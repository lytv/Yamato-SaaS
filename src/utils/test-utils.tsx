import { ClerkProvider } from '@clerk/nextjs';
import { render as testingLibraryRender } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '../locales/en.json';

export function render(ui: React.ReactNode) {
  return testingLibraryRender(
    <ClerkProvider>
      <NextIntlClientProvider locale="en" messages={messages}>
        {ui}
      </NextIntlClientProvider>
    </ClerkProvider>,
  );
}
