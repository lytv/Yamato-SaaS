import { useTranslations } from 'next-intl';

import { LogoCloud } from '@/features/landing/LogoCloud';

export const SponsorLogos = () => {
  const t = useTranslations('Sponsors');

  return (
    <LogoCloud text={t('title')}>
      <div className="flex flex-col items-center space-y-2">
        <div className="flex size-20 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
          <svg className="size-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        </div>
        <span className="text-center text-sm font-medium">{t('factory_export')}</span>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <div className="flex size-20 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-teal-600">
          <svg className="size-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 21h18l-9-18L3 21zM12 6l6 13H6l6-13z" />
          </svg>
        </div>
        <span className="text-center text-sm font-medium">{t('factory_contractor')}</span>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <div className="flex size-20 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-red-600">
          <svg className="size-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 7h-2V6a3 3 0 0 0-3-3H10a3 3 0 0 0-3 3v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM9 6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V6zm9 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" />
          </svg>
        </div>
        <span className="text-center text-sm font-medium">{t('fashion_company')}</span>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <div className="flex size-20 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
          <svg className="size-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <span className="text-center text-sm font-medium">{t('sme_business')}</span>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <div className="flex size-20 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600">
          <svg className="size-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
          </svg>
        </div>
        <span className="text-center text-sm font-medium">{t('training_center')}</span>
      </div>
    </LogoCloud>
  );
};
