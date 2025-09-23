import { NextResponse } from 'next/server';

import { getSatelliteProgressFilterOptions } from '@/libs/queries/satelliteProgress';

export async function GET() {
  try {
    const filterOptions = await getSatelliteProgressFilterOptions('default');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: filterOptions,
      counts: {
        products: filterOptions.products.length,
        plans: filterOptions.plans.length,
        users: filterOptions.users.length,
        steps: filterOptions.steps.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Filter test failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
