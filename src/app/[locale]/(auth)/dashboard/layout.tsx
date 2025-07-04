import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { DashboardHeader } from '@/features/dashboard/DashboardHeader';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Dashboard',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default function DashboardLayout(props: { children: React.ReactNode }) {
  const t = useTranslations('DashboardLayout');

  return (
    <>
      <div className="shadow-md">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-3 py-4">
          <DashboardHeader
            menu={[
              // Dashboard & Overview
              {
                href: '/dashboard',
                label: t('home'),
              },

              // Product Management
              {
                label: t('product_management'),
                submenu: [
                  {
                    href: '/dashboard/products',
                    label: t('products'),
                  },
                  {
                    href: '/dashboard/productsubs',
                    label: t('productsubs'),
                  },
                  {
                    href: '/dashboard/production-steps',
                    label: t('production_steps'),
                  },
                  {
                    href: '/dashboard/production-step-details',
                    label: t('production_step_details'),
                  },
                  {
                    href: '/dashboard/product-step-crosstab',
                    label: t('product_step_crosstab'),
                  },
                ],
              },

              // Planning & Workflow
              {
                label: t('planning_workflow'),
                submenu: [
                  {
                    href: '/dashboard/plans',
                    label: t('plans'),
                  },
                  {
                    href: '/dashboard/plandetails',
                    label: t('plandetails'),
                  },
                  {
                    href: '/dashboard/processes',
                    label: t('processes'),
                  },
                  {
                    href: '/dashboard/work-tables',
                    label: t('work_tables'),
                  },
                ],
              },

              // Organization Management
              {
                label: t('organization'),
                submenu: [
                  {
                    href: '/dashboard/notes',
                    label: t('notes'),
                  },
                  {
                    href: '/dashboard/todos',
                    label: t('todos'),
                  },
                  {
                    href: '/dashboard/organization-profile/organization-members',
                    label: t('members'),
                  },
                  {
                    href: '/dashboard/user_syncs',
                    label: t('user_syncs'),
                  },
                ],
              },

              // Settings
              {
                href: '/dashboard/organization-profile',
                label: t('settings'),
              },
              // PRO: Link to the /dashboard/billing page
            ]}
          />
        </div>
      </div>

      <div className="min-h-[calc(100vh-72px)] bg-muted">
        <div className="mx-auto max-w-screen-xl px-3 pb-16 pt-6">
          {props.children}
        </div>
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';
