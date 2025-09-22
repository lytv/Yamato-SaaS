import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { AppConfig } from './AppConfig';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MILLISECONDS_IN_ONE_DAY = 86_400_000;

export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (
    process.env.VERCEL_ENV === 'production'
    && process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
};

export const getI18nPath = (url: string, locale: string) => {
  if (locale === AppConfig.defaultLocale) {
    return url;
  }

  return `/${locale}${url}`;
};

/**
 * Normalize Vietnamese text for search
 * Converts accented characters to non-accented equivalents
 * Example: "Nguyễn Văn A" -> "nguyen van a"
 */
export const normalizeVietnameseText = (text: string): string => {
  if (!text) {
    return '';
  }

  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036F]/g, '') // Remove diacritical marks
    .replace(/đ/g, 'd') // Replace đ with d
    .replace(/Đ/g, 'd') // Replace Đ with d
    .trim();
};

/**
 * Search function that supports both accented and non-accented Vietnamese text
 * Returns true if searchTerm matches any of the searchFields in the item
 */
export const searchVietnameseText = (
  item: Record<string, any>,
  searchFields: string[],
  searchTerm: string,
): boolean => {
  if (!searchTerm.trim()) {
    return true;
  }

  const normalizedSearchTerm = normalizeVietnameseText(searchTerm);

  return searchFields.some((field) => {
    const fieldValue = item[field];
    if (!fieldValue) {
      return false;
    }

    const normalizedFieldValue = normalizeVietnameseText(String(fieldValue));
    return normalizedFieldValue.includes(normalizedSearchTerm);
  });
};
