/**
 * MIDDLEWARE FIX: Todo API Issues
 *
 * Vấn đề: API routes đang được route qua i18n middleware
 * Giải pháp: Exclude API routes khỏi i18n processing
 *
 * CÁCH SỬA:
 * 1. Backup file hiện tại: src/middleware.ts
 * 2. Replace bằng code dưới đây
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { AllLocales, AppConfig } from '@/utils/AppConfig';

const intlMiddleware = createMiddleware({
  locales: AllLocales,
  localePrefix: AppConfig.localePrefix,
  defaultLocale: AppConfig.defaultLocale,
});

// FIX: Separate API routes from page routes
const isApiRoute = createRouteMatcher([
  '/api(.*)',
]);

const isProtectedPageRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/onboarding(.*)',
  '/:locale/onboarding(.*)',
]);

// FIX: API routes should be protected but not go through i18n
const isProtectedApiRoute = createRouteMatcher([
  '/api/todos(.*)',
  '/api/notes(.*)', // ✅ Add notes API routes
  '/api/products(.*)', // ✅ CRITICAL: Add products API routes
  '/api/productsubs(.*)', // ✅ Add productsubs API routes
  '/api/production-steps(.*)', // ✅ CRITICAL: Add production steps API routes
  '/api/production-step-details(.*)', // ✅ CRITICAL: Add production step details API routes
  '/api/product-step-crosstab(.*)', // ✅ CRITICAL: Add crosstab API routes
  '/api/work-tables(.*)', // ✅ Add work-tables API routes for Clerk protection
  '/api/processes(.*)', // ✅ Add processes API routes
  '/api/user_syncs(.*)', // ✅ Add user_syncs API routes
  '/api/plans(.*)', // ✅ Add plans API routes
  '/api/plandetails(.*)', // ✅ Add plandetails API routes
  '/api/plan-details(.*)', // ✅ Add plan-details API routes
  '/api/employeeSalaryEntries(.*)', // ✅ Add employeeSalaryEntries API routes
  '/api/employee-salary-entries(.*)', // ✅ Add employee-salary-entries API routes
  '/api/outsourceOrders(.*)', // ✅ Add outsourceOrders API routes
  '/api/outsourceOrderDetails(.*)', // ✅ Add outsourceOrderDetails API routes
  '/api/outsourceOrderReceipts(.*)', // ✅ Add outsourceOrderReceipts API routes
  '/api/salary-details(.*)', // ✅ Add salary-details API routes for Clerk protection
  '/api/employee-summary(.*)', // ✅ Add employee-summary API routes for Clerk protection
  '/api/employeeDeliveryReceiptInventory(.*)', // ✅ Add employeeDeliveryReceiptInventory API routes
  '/api/production-progress-report(.*)', // ✅ Add production-progress-report API routes
  '/api/production-progress-pivot(.*)', // ✅ Add production-progress-pivot API routes
  '/api/protected(.*)',
  '/api/organization-profile/sync-users', // Bảo vệ API đồng bộ user
  // Add other protected API routes here
]);

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  // FIX: Handle API routes separately
  if (isApiRoute(request)) {
    // Only apply Clerk auth to API routes, NO i18n middleware
    if (isProtectedApiRoute(request)) {
      return clerkMiddleware(async (auth, _req) => {
        try {
          await auth.protect();

          // FIX: For API routes, return NextResponse.next() directly
          // Do NOT call intlMiddleware for API routes
          return NextResponse.next();
        } catch (error) {
          console.error('API auth error:', error);
          return NextResponse.json(
            {
              success: false,
              error: 'Unauthorized',
              code: 'AUTH_REQUIRED',
            },
            {
              status: 401,
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
        }
      })(request, event);
    }

    // For non-protected API routes, just continue
    return NextResponse.next();
  }

  // FIX: Handle page routes with both Clerk and i18n
  if (
    request.nextUrl.pathname.includes('/sign-in')
    || request.nextUrl.pathname.includes('/sign-up')
    || isProtectedPageRoute(request)
  ) {
    return clerkMiddleware(async (auth, req) => {
      if (isProtectedPageRoute(req)) {
        const locale
          = req.nextUrl.pathname.match(/(\/.*)\/dashboard/)?.at(1) ?? '';

        const signInUrl = new URL(`${locale}/sign-in`, req.url);

        await auth.protect({
          unauthenticatedUrl: signInUrl.toString(),
        });
      }

      const authObj = await auth();

      if (
        authObj.userId
        && !authObj.orgId
        && req.nextUrl.pathname.includes('/dashboard')
        && !req.nextUrl.pathname.endsWith('/organization-selection')
      ) {
        const orgSelection = new URL(
          '/onboarding/organization-selection',
          req.url,
        );

        return NextResponse.redirect(orgSelection);
      }

      // FIX: Only call intlMiddleware for page routes
      return intlMiddleware(req);
    })(request, event);
  }

  // For all other routes (public pages), apply i18n middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all requests except:
    // - Static files (with file extensions)
    // - Next.js internals (_next)
    // - Monitoring endpoints
    '/((?!.+\\.[\\w]+$|_next|monitoring).*)',
    '/',
    // Include API and trpc routes
    '/(api|trpc)(.*)',
  ],
};
