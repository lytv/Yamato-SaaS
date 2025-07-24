import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { userSyncSchema } from '@/models/Schema';

const CLERK_API_URL = 'https://api.clerk.com/v1/users';
const CLERK_SECRET_KEY = Env.CLERK_SECRET_KEY;

async function fetchClerkUsers() {
  const res = await fetch(CLERK_API_URL, {
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch Clerk users');
  }
  return res.json();
}

function mapClerkUserToDb(user: any) {
  return {
    userId: user.id,
    email: user.email_addresses?.[0]?.email_address || '',
    fullName: [user.first_name, user.last_name].filter(Boolean).join(' '),
    avatarUrl: user.image_url,
    role: user.public_metadata?.role || 'member',
    organizationRole: user.public_metadata?.organizationRole || null,
    isActive: user.banned === false,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
  };
}

export async function POST(_req: NextRequest) {
  try {
    const { userId: syncUserId, orgId: syncOrgId } = await auth();
    if (!syncUserId) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const ownerId = syncOrgId || syncUserId;
    const data = await fetchClerkUsers();
    const users = Array.isArray(data) ? data : data.data;
    let count = 0;
    for (const user of users) {
      const mapped = {
        ...mapClerkUserToDb(user),
        ownerId,
      };
      await db.insert(userSyncSchema)
        .values(mapped)
        .onConflictDoUpdate({
          target: userSyncSchema.userId,
          set: mapped,
        });
      count++;
    }
    return Response.json({ success: true, message: `Synced ${count} users.` });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
