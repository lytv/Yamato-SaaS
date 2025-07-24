/**
 * Satellite Progress Page
 * Main page for satellite progress reporting with integrated filter and list components
 * Following Yamato-SaaS patterns and responsive design
 */

'use client';

import { Suspense } from 'react';

import { SatelliteProgressProvider } from '@/contexts/SatelliteProgressContext';
import { SatelliteProgressFilter } from '@/features/satelliteProgress/SatelliteProgressFilter';
import { SatelliteProgressList } from '@/features/satelliteProgress/SatelliteProgressList';
import { SatelliteProgressSkeleton } from '@/features/satelliteProgress/SatelliteProgressSkeleton';

export default function SatelliteProgressPage(): JSX.Element {
  return (
    <SatelliteProgressProvider>
      <div className="container mx-auto p-6 space-y-6">
        <Suspense fallback={<SatelliteProgressSkeleton />}>
          <SatelliteProgressFilter />
          <SatelliteProgressList />
        </Suspense>
      </div>
    </SatelliteProgressProvider>
  );
}