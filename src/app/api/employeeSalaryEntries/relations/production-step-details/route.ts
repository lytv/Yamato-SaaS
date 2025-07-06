/**
 * EmployeeSalaryEntry Production Step Details API Route
 * Get production step details filtered by product with step names
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getProductionStepDetailsByProduct } from '@/libs/queries/employeeSalaryEntry';

// GET /api/employeeSalaryEntries/relations/production-step-details?productId=X
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const productionStepDetails = await getProductionStepDetailsByProduct(Number(productId));

    return NextResponse.json({
      success: true,
      data: productionStepDetails,
      metadata: {
        productId: Number(productId),
        total: productionStepDetails.length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching production step details by product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production step details' },
      { status: 500 },
    );
  }
}
