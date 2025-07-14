/**
 * Debug Ownership Issues for OutsourceOrder
 * NOTE: This is a debug endpoint - remove or restrict in production
 */
import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/db';
import { outsourceOrderSchema } from '@/models/Schema';

export async function GET(request: Request) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId') || '28';

    const ownerId = orgId || userId;

    // Check OutsourceOrder with specific ID
    const outsourceOrder = await db
      .select({
        id: outsourceOrderSchema.id,
        orderCode: outsourceOrderSchema.orderCode,
        orderTitle: outsourceOrderSchema.orderTitle,
        ownerId: outsourceOrderSchema.ownerId,
      })
      .from(outsourceOrderSchema)
      .where(eq(outsourceOrderSchema.id, Number(orderId)))
      .limit(1);

    const order0 = outsourceOrder.length > 0 ? outsourceOrder[0] : undefined;

    // Check if order exists with current ownerId (org-based)
    const orderWithOrgOwner = await db
      .select({
        id: outsourceOrderSchema.id,
        orderCode: outsourceOrderSchema.orderCode,
        ownerId: outsourceOrderSchema.ownerId,
      })
      .from(outsourceOrderSchema)
      .where(and(
        eq(outsourceOrderSchema.id, Number(orderId)),
        eq(outsourceOrderSchema.ownerId, ownerId),
      ))
      .limit(1);

    // Check if order exists with userId (old way)
    const orderWithUserOwner = await db
      .select({
        id: outsourceOrderSchema.id,
        orderCode: outsourceOrderSchema.orderCode,
        ownerId: outsourceOrderSchema.ownerId,
      })
      .from(outsourceOrderSchema)
      .where(and(
        eq(outsourceOrderSchema.id, Number(orderId)),
        eq(outsourceOrderSchema.ownerId, userId),
      ))
      .limit(1);

    // Get all orders for current user (for comparison)
    const allUserOrders = await db
      .select({
        id: outsourceOrderSchema.id,
        orderCode: outsourceOrderSchema.orderCode,
        ownerId: outsourceOrderSchema.ownerId,
      })
      .from(outsourceOrderSchema)
      .where(eq(outsourceOrderSchema.ownerId, userId))
      .limit(10);

    // Get all orders for current org (if any)
    const allOrgOrders = orgId
      ? await db
        .select({
          id: outsourceOrderSchema.id,
          orderCode: outsourceOrderSchema.orderCode,
          ownerId: outsourceOrderSchema.ownerId,
        })
        .from(outsourceOrderSchema)
        .where(eq(outsourceOrderSchema.ownerId, orgId))
        .limit(10)
      : [];

    const result = {
      success: true,
      debug: {
        auth_context: { userId, orgId, effective_ownerId: ownerId },
        target_order_id: orderId,

        order_info: {
          exists: !!order0,
          order_data: order0 || null,
          actual_owner: order0 ? order0.ownerId : null,
        },

        access_check: {
          accessible_with_org_logic: orderWithOrgOwner.length > 0,
          accessible_with_user_logic: orderWithUserOwner.length > 0,
          owner_matches_current_user: order0 ? order0.ownerId === userId : false,
          owner_matches_current_org: order0 ? order0.ownerId === orgId : false,
          owner_matches_effective_owner: order0 ? order0.ownerId === ownerId : false,
        },

        comparison: {
          user_orders_count: allUserOrders.length,
          org_orders_count: allOrgOrders.length,
          user_orders: allUserOrders,
          org_orders: allOrgOrders,
        },

        fix_needed: {
          data_migration_required: order0 ? order0.ownerId !== ownerId : false,
          suggested_fix: order0 && order0.ownerId !== ownerId
            ? 'Update OutsourceOrder ownerId from userId to orgId'
            : 'No fix needed',
        },
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('🚨 Ownership Debug Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
