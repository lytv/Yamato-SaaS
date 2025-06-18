'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const configSchema = z.object({
  sequenceStart: z.number().int().min(1, 'Bắt đầu từ 1').default(1),
  autoIncrement: z.boolean().default(true),
  factoryPrice: z.string().transform(val => val?.trim() || undefined).optional(),
  calculatedPrice: z.string().transform(val => val?.trim() || undefined).optional(),
  quantityLimit1: z.union([z.number().int().min(0), z.nan().transform(() => undefined)]).optional(),
  quantityLimit2: z.union([z.number().int().min(0), z.nan().transform(() => undefined)]).optional(),
  isFinalStep: z.boolean().default(false),
  isVtStep: z.boolean().default(false),
  isParkingStep: z.boolean().default(false),
});

export type MultiAssignConfig = z.infer<typeof configSchema>;

type MultiAssignConfigFormProps = {
  initialValues?: Partial<MultiAssignConfig>;
  onChange: (values: MultiAssignConfig) => void;
};

export function MultiAssignConfigForm({ initialValues, onChange }: MultiAssignConfigFormProps) {
  const t = useTranslations('MultiAssignConfigForm');
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<MultiAssignConfig>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      sequenceStart: 1,
      autoIncrement: true,
      ...initialValues,
    },
    mode: 'onChange',
  });

  // Sử dụng useRef để tránh infinite loop
  const prevValuesRef = React.useRef<string>('');

  const values = watch();

  React.useEffect(() => {
    // Chỉ gọi onChange khi values thực sự thay đổi
    const currentValuesString = JSON.stringify(values);
    if (prevValuesRef.current !== currentValuesString) {
      prevValuesRef.current = currentValuesString;
      onChange(values);
    }
  }, [values, onChange]);

  return (
    <form className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="block text-sm font-medium">{t('sequenceStart')}</label>
        <input type="number" min={1} {...register('sequenceStart', { valueAsNumber: true })} className="w-full rounded border px-2 py-1" />
        {errors.sequenceStart && <span className="text-xs text-red-500">{errors.sequenceStart.message}</span>}
      </div>
      <div className="mt-6 flex items-center gap-2">
        <input type="checkbox" {...register('autoIncrement')} id="autoIncrement" />
        <label htmlFor="autoIncrement" className="text-sm">{t('autoIncrement')}</label>
      </div>
      <div>
        <label className="block text-sm font-medium">{t('factoryPrice')}</label>
        <input type="text" {...register('factoryPrice')} className="w-full rounded border px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium">{t('calculatedPrice')}</label>
        <input type="text" {...register('calculatedPrice')} className="w-full rounded border px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium">{t('quantityLimit1')}</label>
        <input type="number" min={0} {...register('quantityLimit1', { valueAsNumber: true })} className="w-full rounded border px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium">{t('quantityLimit2')}</label>
        <input type="number" min={0} {...register('quantityLimit2', { valueAsNumber: true })} className="w-full rounded border px-2 py-1" />
      </div>
      <div className="mt-6 flex items-center gap-2">
        <input type="checkbox" {...register('isFinalStep')} id="isFinalStep" />
        <label htmlFor="isFinalStep" className="text-sm">{t('isFinalStep')}</label>
      </div>
      <div className="mt-6 flex items-center gap-2">
        <input type="checkbox" {...register('isVtStep')} id="isVtStep" />
        <label htmlFor="isVtStep" className="text-sm">{t('isVtStep')}</label>
      </div>
      <div className="mt-6 flex items-center gap-2">
        <input type="checkbox" {...register('isParkingStep')} id="isParkingStep" />
        <label htmlFor="isParkingStep" className="text-sm">{t('isParkingStep')}</label>
      </div>
    </form>
  );
}
