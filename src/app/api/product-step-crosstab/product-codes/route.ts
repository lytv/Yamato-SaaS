import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { getProductCodesForCrosstab } from '@/libs/queries/productStepCrosstab';

export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const ownerId = orgId || userId;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;

    const data = await getProductCodesForCrosstab(ownerId, search);

    return NextResponse.json({
      data,
    });
  } catch (error) {
    console.error('Error fetching product codes for crosstab:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
