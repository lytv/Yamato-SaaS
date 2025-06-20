import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import {
  getProductStepCrosstab,
  getProductStepCrosstabCount,
} from '@/libs/queries/productStepCrosstab';

export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const ownerId = orgId || userId;
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || undefined;
    const productCode = searchParams.get('productCode') || undefined;
    const priceType
      = searchParams.get('priceType') === 'factory' ? 'factory' : 'calculated';
    const showAll = searchParams.get('showAll') === 'true';

    const data = await getProductStepCrosstab({
      ownerId,
      page,
      limit,
      search,
      productCode,
      priceType,
      showAll,
    });

    const total = await getProductStepCrosstabCount({
      ownerId,
      search,
      productCode,
      priceType,
    });

    const pagination = showAll
      ? {
          page: 1,
          limit: total,
          total,
          totalPages: 1,
        }
      : {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        };

    return NextResponse.json({
      data,
      pagination,
    });
  } catch (error) {
    console.error('Error fetching crosstab data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
