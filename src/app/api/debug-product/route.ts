/**
 * Debug Product API Route
 * GET /api/debug-product - Debug authentication and middleware for products
 * Following TDD implementation and Yamato-SaaS patterns
 * Useful for troubleshooting auth issues
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/debug-product - Debug authentication and environment
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId, orgId } = await auth();
    const url = new URL(request.url);

    return NextResponse.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        auth: {
          userId: userId || null,
          orgId: orgId || null,
          ownerId: orgId || userId || null,
        },
        request: {
          url: url.href,
          pathname: url.pathname,
          searchParams: Object.fromEntries(url.searchParams),
          method: request.method,
          headers: {
            'user-agent': request.headers.get('user-agent'),
            'x-forwarded-for': request.headers.get('x-forwarded-for'),
            'authorization': request.headers.get('authorization') ? '[PRESENT]' : null,
          },
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          // Don't expose sensitive env vars in debug
        },
      },
    });
  } catch (error) {
    console.error('Debug product error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Debug failed',
        code: 'DEBUG_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
