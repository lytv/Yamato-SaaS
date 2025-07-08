import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { CenteredMenu } from '@/features/landing/CenteredMenu';
import { Section } from '@/features/landing/Section';

import { Logo } from './Logo';

export const Navbar = () => {
  const t = useTranslations('Navbar');
  const tDash = useTranslations('DashboardLayout');

  return (
    <Section className="px-3 py-6">
      <CenteredMenu
        logo={<Logo />}
        rightMenu={(
          <>
            {/* PRO: Dark mode toggle button */}
            <li data-fade>
              <LocaleSwitcher />
            </li>
            <li className="ml-1 mr-2.5" data-fade>
              <Link href="/sign-in">{t('sign_in')}</Link>
            </li>
            <li>
              <Link className={buttonVariants()} href="/sign-up">
                {t('sign_up')}
              </Link>
            </li>
          </>
        )}
      >
        {/* Menu chính */}
        <>
          <li>
            <div className="group relative">
              <button className="px-2 py-1 hover:underline focus:outline-none">
                {tDash('outsource_menu')}
              </button>
              <div className="absolute left-0 mt-2 hidden min-w-[120px] rounded bg-white py-2 shadow-lg group-hover:block">
                <Link href="/outsourceOrders" className="block px-4 py-2 hover:bg-gray-100">
                  {tDash('outsource_order')}
                </Link>
              </div>
            </div>
          </li>
        </>
      </CenteredMenu>
    </Section>
  );
};
