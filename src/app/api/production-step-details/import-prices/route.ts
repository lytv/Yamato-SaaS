import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as XLSX from 'xlsx';
import { eq, and } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { productSchema, productionStepSchema, productionStepDetailSchema } from '@/models/Schema';

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const { userId, orgId } = await auth();
    const ownerId = orgId || userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const priceType = formData.get('priceType') as string; // 'factory_price' or 'calculated_price'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!priceType || !['factory_price', 'calculated_price', 'retail_price'].includes(priceType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid price type. Must be factory_price, calculated_price, or retail_price' },
        { status: 400 }
      );
    }

    // Convert file to buffer and parse Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return NextResponse.json(
        { success: false, error: 'No worksheets found in Excel file' },
        { status: 400 }
      );
    }
    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      return NextResponse.json(
        { success: false, error: 'Worksheet not found' },
        { status: 400 }
      );
    }
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: null,
      range: 0 
    }) as any[][];

    if (jsonData.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Excel file must have at least 2 rows (header + data)' },
        { status: 400 }
      );
    }

    // Extract step codes from first row (skip first column which is empty or label)
    const firstRow = jsonData[0];
    if (!firstRow) {
      return NextResponse.json(
        { success: false, error: 'No data found in first row' },
        { status: 400 }
      );
    }
    const stepCodes = firstRow.slice(1).filter(code => code && code.toString().trim());
    
    if (stepCodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No step codes found in first row' },
        { status: 400 }
      );
    }

    // Extract product codes and prices from subsequent rows
    const productRows = jsonData.slice(1).filter(row => row[0] && row[0].toString().trim());
    
    if (productRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No product codes found in first column' },
        { status: 400 }
      );
    }

    // Fetch all products and production steps for validation
    const [products, productionSteps] = await Promise.all([
      db.select({ id: productSchema.id, productCode: productSchema.productCode })
        .from(productSchema)
        .where(eq(productSchema.ownerId, ownerId!)),
      db.select({ id: productionStepSchema.id, stepCode: productionStepSchema.stepCode })
        .from(productionStepSchema)
        .where(eq(productionStepSchema.ownerId, ownerId!))
    ]);

    // Create lookup maps
    const productLookup = new Map<string, number>(products.map((p: { productCode: string; id: number }) => [p.productCode, p.id]));
    const stepLookup = new Map<string, number>(productionSteps.map((s: { stepCode: string; id: number }) => [s.stepCode, s.id]));

    // Process updates
    const updates: Array<{
      productId: number;
      productionStepId: number;
      price: number;
      productCode: string;
      stepCode: string;
    }> = [];

    const errors: string[] = [];
    let processedCount = 0;

    for (const [rowIndex, row] of productRows.entries()) {
      const productCode = row[0].toString().trim();
      const productId = productLookup.get(productCode);

      if (!productId) {
        errors.push(`Row ${rowIndex + 2}: Product code '${productCode}' not found`);
        continue;
      }

      for (const [colIndex, stepCode] of stepCodes.entries()) {
        const stepCodeStr = stepCode.toString().trim();
        const productionStepId = stepLookup.get(stepCodeStr);

        if (!productionStepId) {
          errors.push(`Row ${rowIndex + 2}, Col ${colIndex + 2}: Step code '${stepCodeStr}' not found`);
          continue;
        }

        const priceValue = row[colIndex + 1]; // +1 because first column is product code
        
        if (priceValue === null || priceValue === undefined || priceValue === '') {
          continue; // Skip empty cells
        }

        const price = parseFloat(priceValue.toString());
        
        if (isNaN(price) || price < 0) {
          errors.push(`Row ${rowIndex + 2}, Col ${colIndex + 2}: Invalid price value '${priceValue}'`);
          continue;
        }

        updates.push({
          productId,
          productionStepId,
          price,
          productCode,
          stepCode: stepCodeStr
        });
        processedCount++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid price updates found',
        errors,
        summary: {
          processed: 0,
          updated: 0,
          created: 0,
          errors: errors.length
        }
      }, { status: 400 });
    }

    // Execute updates in batches
    let updatedCount = 0;
    let createdCount = 0;
    const batchSize = 50;

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      for (const update of batch) {
        try {
          // Check if production_step_detail exists
          const existing = await db.select()
            .from(productionStepDetailSchema)
            .where(
              and(
                eq(productionStepDetailSchema.productId, update.productId),
                eq(productionStepDetailSchema.productionStepId, update.productionStepId),
                eq(productionStepDetailSchema.ownerId, ownerId!)
              )
            )
            .limit(1);

          const updateData = priceType === 'factory_price' 
            ? { factoryPrice: update.price.toString() }
            : priceType === 'calculated_price'
            ? { calculatedPrice: update.price.toString() }
            : { retailPrice: update.price.toString() };

          if (existing.length > 0) {
            // Update existing record
            await db.update(productionStepDetailSchema)
              .set({
                ...updateData,
                updatedAt: new Date()
              })
              .where(
                and(
                  eq(productionStepDetailSchema.productId, update.productId),
                  eq(productionStepDetailSchema.productionStepId, update.productionStepId),
                  eq(productionStepDetailSchema.ownerId, ownerId!)
                )
              );
            updatedCount++;
          } else {
            // Create new record with default values
            await db.insert(productionStepDetailSchema).values({
              ownerId: ownerId!,
              productId: update.productId,
              productionStepId: update.productionStepId,
              sequenceNumber: 1, // Default sequence number
              factoryPrice: priceType === 'factory_price' ? update.price.toString() : null,
              calculatedPrice: priceType === 'calculated_price' ? update.price.toString() : null,
              retailPrice: priceType === 'retail_price' ? update.price.toString() : null,
              isFinalStep: false,
              isVtStep: false,
              isParkingStep: false
            });
            createdCount++;
          }
        } catch (error) {
          console.error(`Error processing update for ${update.productCode} - ${update.stepCode}:`, error);
          errors.push(`Failed to update ${update.productCode} - ${update.stepCode}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${processedCount} price updates`,
      summary: {
        processed: processedCount,
        updated: updatedCount,
        created: createdCount,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : [] // Return first 10 errors
    });

  } catch (error) {
    console.error('Import prices error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}