import { auth } from '@clerk/nextjs/server';
import { and, eq, inArray } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/libs/DB';
import { productionStepDetailSchema } from '@/models/Schema';

const bodySchema = z.object({
  productIds: z.array(z.number().int().positive()).min(1).max(50),
  productionStepIds: z.array(z.number().int().positive()).min(1).max(50),
  defaultValues: z.object({
    sequenceStart: z.number().int().min(1),
    autoIncrement: z.boolean(),
    factoryPrice: z.string().optional(),
    calculatedPrice: z.string().optional(),
    quantityLimit1: z.number().int().min(0).optional(),
    quantityLimit2: z.number().int().min(0).optional(),
    isFinalStep: z.boolean().optional(),
    isVtStep: z.boolean().optional(),
    isParkingStep: z.boolean().optional(),
  }),
});
const CHUNK_SIZE = 25;

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const { productIds, productionStepIds, defaultValues } = parsed.data;
    const totalRequested = productIds.length * productionStepIds.length;
    const created: any[] = [];
    const skipped: any[] = [];
    const failed: any[] = [];

    // Fetch existing assignments for conflict detection
    const existing = await db
      .select({ productId: productionStepDetailSchema.productId, productionStepId: productionStepDetailSchema.productionStepId })
      .from(productionStepDetailSchema)
      .where(
        and(
          eq(productionStepDetailSchema.ownerId, orgId),
          inArray(productionStepDetailSchema.productId, productIds),
          inArray(productionStepDetailSchema.productionStepId, productionStepIds),
        ),
      );
    const existingSet = new Set(existing.map(e => `${e.productId}|${e.productionStepId}`));

    // Prepare all combinations
    const combinations: { productId: number; productionStepId: number; sequenceNumber: number }[] = [];
    for (const productId of productIds) {
      for (const [j, productionStepId] of productionStepIds.entries()) {
        const key = `${productId}|${productionStepId}`;
        if (existingSet.has(key)) {
          skipped.push({ productId, productionStepId });
          continue;
        }
        combinations.push({
          productId,
          productionStepId,
          sequenceNumber: defaultValues.autoIncrement ? defaultValues.sequenceStart + j : defaultValues.sequenceStart,
        });
      }
    }

    // Chunked insert
    for (let i = 0; i < combinations.length; i += CHUNK_SIZE) {
      const chunk = combinations.slice(i, i + CHUNK_SIZE);
      try {
        const inserted = await db.insert(productionStepDetailSchema).values(
          chunk.map(({ productId, productionStepId, sequenceNumber }) => ({
            ownerId: orgId,
            productId,
            productionStepId,
            sequenceNumber,
            factoryPrice: defaultValues.factoryPrice,
            calculatedPrice: defaultValues.calculatedPrice,
            quantityLimit1: defaultValues.quantityLimit1,
            quantityLimit2: defaultValues.quantityLimit2,
            isFinalStep: defaultValues.isFinalStep ?? false,
            isVtStep: defaultValues.isVtStep ?? false,
            isParkingStep: defaultValues.isParkingStep ?? false,
          })),
        )
          .onConflictDoNothing()
          .returning();
        created.push(...inserted);
      } catch (err) {
        failed.push({ chunk: i / CHUNK_SIZE + 1, error: String(err) });
      }
    }

    return NextResponse.json({
      success: true,
      data: { created, skipped, failed },
      summary: {
        totalRequested,
        created: created.length,
        skipped: skipped.length,
        failed: failed.length,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
