import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { getUserSyncsByOwner } from '@/libs/queries/user_sync';

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use organization ID if available, otherwise use user ID
    const ownerId = orgId || userId;

    // Get all active users for the dropdown
    const users = await getUserSyncsByOwner({
      ownerId,
      showAll: true,
      sortBy: 'fullName',
      sortOrder: 'asc',
    });

    // Filter only active users and format for dropdown
    const userOptions = users
      .filter(user => user.isActive)
      .map(user => ({
        value: user.userId,
        label: user.fullName,
        shortcut: user.shortcut,
        email: user.email,
      }));

    return NextResponse.json({
      success: true,
      data: userOptions,
    });
  } catch (error) {
    console.error('Error fetching user options:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
