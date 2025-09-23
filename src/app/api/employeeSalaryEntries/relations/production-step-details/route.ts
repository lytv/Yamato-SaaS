/**
 * EmployeeSalaryEntry Production Step Details API Route
 * Get production step details filtered by product with step names
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getAllProductionSteps, getProductionStepDetailsByProduct } from '@/libs/queries/employeeSalaryEntry';

// GET /api/employeeSalaryEntries/relations/production-step-details?productId=X
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const loadAll = searchParams.get('loadAll') === 'true';

    let productionStepDetails;
    const metadata: any = {
      lastUpdated: new Date().toISOString(),
    };

    if (loadAll || !productId) {
      // Load all production steps from production_step table
      productionStepDetails = await getAllProductionSteps(orgId || userId);
      metadata.loadType = 'all';
      metadata.total = productionStepDetails.length;
    } else {
      // Load production step details filtered by product
      productionStepDetails = await getProductionStepDetailsByProduct(Number(productId), orgId || userId);
      metadata.loadType = 'filtered';
      metadata.productId = Number(productId);
      metadata.total = productionStepDetails.length;
    }

    return NextResponse.json({
      success: true,
      data: productionStepDetails,
      metadata,
    });
  } catch (error) {
    console.error('Error fetching production step details by product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production step details' },
      { status: 500 },
    );
  }
}
