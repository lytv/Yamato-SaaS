import fetch from 'node-fetch';

import { db } from '../src/libs/DB';
import { Env } from '../src/libs/Env';
import { userSyncSchema } from '../src/models/Schema';

// Clerk API endpoint
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
    shortcut: user.public_metadata?.shortcut || null,
    isActive: user.banned === false,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
  };
}

async function syncUsers() {
  const data = await fetchClerkUsers();
  const users = Array.isArray(data) ? data : data.data;
  // Truyền ownerId cứng
  const ownerId = 'default-org-id';
  for (const user of users) {
    const mapped = mapClerkUserToDb(user);
    // Upsert logic: try update, if not found then insert
    await db.insert(userSyncSchema)
      .values({ ...mapped, ownerId })
      .onConflictDoUpdate({
        target: userSyncSchema.userId,
        set: { ...mapped, ownerId },
      });
    console.log(`Synced user: ${mapped.email}`);
  }
  console.log('User sync completed.');
}

syncUsers().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
