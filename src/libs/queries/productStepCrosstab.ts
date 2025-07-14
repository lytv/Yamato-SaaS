import { and, count, eq, ilike, or } from 'drizzle-orm';

import {
  productionStepDetailSchema,
  productionStepSchema,
  productSchema,
} from '@/models/Schema';
import type {
  ProductStepCrosstabParams,
  ProductStepCrosstabResult,
} from '@/types/productStepCrosstab';

import { db } from '../db';

export async function getProductStepCrosstab(
  params: ProductStepCrosstabParams,
): Promise<ProductStepCrosstabResult[]> {
  const {
    ownerId,
    productCode,
    priceType,
    search,
    page = 1,
    limit = 50,
    showAll = false,
  } = params;

  const offset = (page - 1) * limit;
  const priceColumn
    = priceType === 'factory'
      ? productionStepDetailSchema.factoryPrice
      : productionStepDetailSchema.calculatedPrice;

  // Build where conditions
  const whereConditions = [eq(productSchema.ownerId, ownerId)];

  if (productCode) {
    whereConditions.push(eq(productSchema.productCode, productCode));
  }

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    whereConditions.push(
      or(
        ilike(productSchema.productName, searchTerm),
        ilike(productSchema.productCode, searchTerm),
      )!,
    );
  }

  // Execute join query
  const query = db
    .select({
      productCode: productSchema.productCode,
      productName: productSchema.productName,
      stepCode: productionStepSchema.stepCode,
      stepName: productionStepSchema.stepName,
      price: priceColumn,
      sequenceNumber: productionStepDetailSchema.sequenceNumber,
    })
    .from(productSchema)
    .innerJoin(
      productionStepDetailSchema,
      eq(productSchema.id, productionStepDetailSchema.productId),
    )
    .innerJoin(
      productionStepSchema,
      eq(
        productionStepDetailSchema.productionStepId,
        productionStepSchema.id,
      ),
    )
    .where(and(...whereConditions))
    .orderBy(
      productSchema.productCode,
      productionStepDetailSchema.sequenceNumber,
    );

  if (!showAll) {
    query.limit(limit).offset(offset);
  }

  const results = await query;

  // Transform results to grouped format
  const groupedResults = results.reduce(
    (acc: ProductStepCrosstabResult[], row: { productCode: string; productName: string; stepCode: string; stepName: string; price: string | null; sequenceNumber: number }) => {
      let existing = acc.find(item => item.productCode === row.productCode);

      if (!existing) {
        existing = {
          productCode: row.productCode,
          productName: row.productName,
          steps: [],
        };
        acc.push(existing);
      }

      const price = row.price || '0';

      const step = {
        stepCode: row.stepCode,
        stepName: row.stepName,
        price: price.toString(),
        sequenceNumber: row.sequenceNumber,
      };

      existing.steps.push(step);

      return acc;
    },
    [] as ProductStepCrosstabResult[],
  );

  return groupedResults;
}

export async function getProductStepCrosstabCount(
  params: Omit<ProductStepCrosstabParams, 'page' | 'limit'>,
): Promise<number> {
  const { ownerId, productCode, search } = params;

  // Build where conditions
  const whereConditions = [eq(productSchema.ownerId, ownerId)];

  if (productCode) {
    whereConditions.push(eq(productSchema.productCode, productCode));
  }

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    whereConditions.push(
      or(
        ilike(productSchema.productName, searchTerm),
        ilike(productSchema.productCode, searchTerm),
      )!,
    );
  }

  const result = await db
    .select({
      value: count(productSchema.id),
    })
    .from(productSchema)
    .where(and(...whereConditions));

  return result[0]?.value ?? 0;
}

export async function getProductCodesForCrosstab(
  ownerId: string,
  search?: string,
): Promise<string[]> {
  const whereConditions = [eq(productSchema.ownerId, ownerId)];

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    whereConditions.push(ilike(productSchema.productCode, searchTerm));
  }

  const results = await db
    .selectDistinct({ productCode: productSchema.productCode })
    .from(productSchema)
    .where(and(...whereConditions))
    .orderBy(productSchema.productCode)
    .limit(20);

  return results.map((r: { productCode: string }) => r.productCode);
}
