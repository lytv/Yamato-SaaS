import '@/styles/global.css';

import type { Metadata } from 'next';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';

import { AllLocales } from '@/utils/AppConfig';

export const metadata: Metadata = {
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png',
    },
    {
      rel: 'icon',
      url: '/favicon.ico',
    },
  ],
};

export function generateStaticParams() {
  return AllLocales.map(locale => ({ locale }));
}

export default function RootLayout(props: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(props.params.locale);

  // Using internationalization in Client Components
  const messages = useMessages();

  // The `suppressHydrationWarning` in <html> is used to prevent hydration errors caused by `next-themes`.
  // Solution provided by the package itself: https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app

  // The `suppressHydrationWarning` attribute in <body> is used to prevent hydration errors caused by Sentry Overlay,
  // which dynamically adds a `style` attribute to the body tag.
  return (
    <html lang={props.params.locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent Web3/MetaMask connection errors
              window.addEventListener('error', function(e) {
                const errorMessage = e.message || '';
                const web3Errors = [
                  'Failed to connect to MetaMask',
                  'ethereum is not defined',
                  'web3 is not defined',
                  'MetaMask not found',
                  'No Ethereum provider'
                ];
                
                if (web3Errors.some(error => errorMessage.includes(error))) {
                  e.preventDefault();
                  console.warn('Web3/MetaMask error suppressed:', errorMessage);
                  return false;
                }
              });
              
              // Suppress unhandled promise rejections related to Web3
              window.addEventListener('unhandledrejection', function(e) {
                const reason = e.reason?.message || e.reason || '';
                if (typeof reason === 'string' && reason.includes('MetaMask')) {
                  e.preventDefault();
                  console.warn('MetaMask promise rejection suppressed:', reason);
                }
              });
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        {/* PRO: Dark mode support for Shadcn UI */}
        <NextIntlClientProvider
          locale={props.params.locale}
          messages={messages}
        >
          {props.children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
