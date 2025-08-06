import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/libs/DB';
import { productSchema } from '@/models/Schema';
import { and, eq, sql } from 'drizzle-orm';

type Product = {
  id: number;
  productCode: string;
  productName: string;
  category: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const ownerId = orgId || userId;
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const planId = searchParams.get('planId');
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category parameter is required' },
        { status: 400 }
      );
    }

    let query;
    
    if (planId) {
      // Get product by category filtered by plan (through plan_detail)
      query = db
        .select({
          id: productSchema.id,
          productCode: productSchema.productCode,
          productName: productSchema.productName,
          category: productSchema.category,
        })
        .from(productSchema)
        .where(
          and(
            eq(productSchema.ownerId, ownerId),
            eq(productSchema.category, category),
            sql`EXISTS (
              SELECT 1 FROM plan_detail pd
              WHERE pd.product_code = ${productSchema.productCode}
              AND pd.plan_id = ${planId}
              AND pd.owner_id = ${ownerId}
            )`
          )
        )
        .limit(1);
    } else {
      // Get product by category without plan filtering
      query = db
        .select({
          id: productSchema.id,
          productCode: productSchema.productCode,
          productName: productSchema.productName,
          category: productSchema.category,
        })
        .from(productSchema)
        .where(
          and(
            eq(productSchema.ownerId, ownerId),
            eq(productSchema.category, category)
          )
        )
        .limit(1);
    }

    const [product] = await query as Product[];

    if (!product) {
      return NextResponse.json(
        { error: 'No product found with this category' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product by category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product by category' },
      { status: 500 }
    );
  }
}