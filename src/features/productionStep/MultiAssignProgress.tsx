'use client';

import { useTranslations } from 'next-intl';
import React from 'react';

type MultiAssignProgressProps = {
  total: number;
  created: number;
  skipped: number;
  failed: number;
  currentChunk: number;
  totalChunks: number;
  status: 'idle' | 'processing' | 'done' | 'error';
};

export function MultiAssignProgress({
  total,
  created,
  skipped,
  failed,
  currentChunk,
  totalChunks,
  status,
}: MultiAssignProgressProps) {
  const t = useTranslations('MultiAssignProgress');
  const percent = totalChunks > 0 ? Math.round((currentChunk / totalChunks) * 100) : 0;
  const isDone = status === 'done';
  const isError = status === 'error';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-3 max-w-full flex-1 overflow-hidden rounded bg-gray-200">
          <div
            className={`h-3 rounded transition-all duration-300 ${isError ? 'bg-red-500' : isDone ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${percent}%`, maxWidth: '100%' }}
          />
        </div>
        <span className="w-12 text-right text-xs">
          {percent}
          %
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span>
          {t('chunk')}
          {currentChunk}
          {' '}
          /
          {' '}
          {totalChunks}
        </span>
        <span>
          {t('created')}
          :
          <b className="text-green-700">{created}</b>
        </span>
        <span>
          {t('skipped')}
          :
          <b className="text-yellow-700">{skipped}</b>
        </span>
        <span>
          {t('failed')}
          :
          <b className="text-red-700">{failed}</b>
        </span>
      </div>
      {isDone && (
        <div className="rounded border border-green-200 bg-green-50 p-2 font-semibold text-green-700">
          {t('doneSummary', { total, created, skipped, failed })}
        </div>
      )}
      {isError && (
        <div className="rounded border border-red-200 bg-red-50 p-2 font-semibold text-red-700">
          {t('error')}
        </div>
      )}
    </div>
  );
}
