'use client';

import { OrganizationProfile } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { TitleBar } from '@/features/dashboard/TitleBar';
import { getI18nPath } from '@/utils/Helpers';

const OrganizationProfilePage = (props: { params: { locale: string } }) => {
  const t = useTranslations('OrganizationProfile');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/organization-profile/sync-users', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMsg('Đồng bộ thành công!');
      } else {
        setSyncMsg(`Đồng bộ thất bại: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setSyncMsg(`Đồng bộ thất bại: ${(err as Error).message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />
      <div className="mb-2 flex justify-end gap-2">
        <button
          type="button"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-60"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? 'Đang đồng bộ...' : 'Đồng bộ user'}
        </button>
        {/* Nút Invite mặc định của Clerk sẽ nằm trong OrganizationProfile */}
      </div>
      {syncMsg && <div className="mb-2 text-sm text-green-600">{syncMsg}</div>}
      <OrganizationProfile
        routing="path"
        path={getI18nPath(
          '/dashboard/organization-profile',
          props.params.locale,
        )}
        afterLeaveOrganizationUrl="/onboarding/organization-selection"
        appearance={{
          elements: {
            rootBox: 'w-full',
            cardBox: 'w-full flex',
          },
        }}
      />
    </>
  );
};

export default OrganizationProfilePage;
