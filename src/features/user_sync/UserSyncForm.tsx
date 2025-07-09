/**
 * UserSyncForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing user_syncs with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useUserSyncMutations } from '@/hooks/useUserSyncMutations';
import { userSyncFormSchema } from '@/libs/validations/user_sync';
import type { UserSync, UserSyncFormData } from '@/types/user_sync';

type UserSyncFormProps = {
  user_sync?: UserSync;
  onSuccess: (user_sync: UserSync) => void;
  onCancel: () => void;
};

export function UserSyncForm({ user_sync, onSuccess, onCancel }: UserSyncFormProps): JSX.Element {
  const t = useTranslations('userSync.form');
  const isEditing = Boolean(user_sync);
  const { createUserSync, updateUserSync, isCreating, isUpdating, error, clearError } = useUserSyncMutations();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<UserSyncFormData>({
    resolver: zodResolver(userSyncFormSchema),
    defaultValues: user_sync
      ? {
          userId: user_sync.userId || '',
          email: user_sync.email || '',
          fullName: user_sync.fullName || '',
          avatarUrl: user_sync.avatarUrl || '',
          role: user_sync.role || '',
          organizationRole: user_sync.organizationRole || '',
          shortcut: user_sync.shortcut || '',
          isActive: typeof user_sync.isActive === 'boolean' ? user_sync.isActive : false,
        }
      : {
          userId: '',
          email: '',
          fullName: '',
          avatarUrl: '',
          role: '',
          organizationRole: '',
          shortcut: '',
          isActive: false,
        },
    mode: 'onChange',
  });

  // Clear errors when form values change
  useEffect(() => {
    const subscription = watch(() => {
      if (error) {
        clearError();
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, error, clearError]);

  const onSubmit = async (data: UserSyncFormData): Promise<void> => {
    try {
      if (isEditing && user_sync) {
        const updatedUserSync = await updateUserSync(user_sync.userId, data);
        onSuccess(updatedUserSync);
      } else {
        const newUserSync = await createUserSync(data);
        onSuccess(newUserSync);
      }
    } catch {
      // Error is handled by the mutation hook
    }
  };

  const handleReset = (): void => {
    reset();
    clearError();
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      {/* User ID Field */}
      <div>
        <label htmlFor="userId" className="block text-sm font-medium text-gray-700">{t('user_id_label')}</label>
        <input
          id="userId"
          type="text"
          {...register('userId')}
          aria-required="true"
          aria-describedby={errors.userId ? 'userId-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.userId ? 'border-red-300' : ''}`}
          placeholder={t('user_id_placeholder')}
        />
        {errors.userId && (
          <p id="userId-error" className="mt-2 text-sm text-red-600">{errors.userId.message}</p>
        )}
      </div>
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('email_label')}</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          aria-required="true"
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.email ? 'border-red-300' : ''}`}
          placeholder={t('email_placeholder')}
        />
        {errors.email && (
          <p id="email-error" className="mt-2 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>
      {/* Full Name Field */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">{t('full_name_label')}</label>
        <input
          id="fullName"
          type="text"
          {...register('fullName')}
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.fullName ? 'border-red-300' : ''}`}
          placeholder={t('full_name_placeholder')}
        />
        {errors.fullName && (
          <p id="fullName-error" className="mt-2 text-sm text-red-600">{errors.fullName.message}</p>
        )}
      </div>
      {/* Role Field */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">{t('role_label')}</label>
        <input
          id="role"
          type="text"
          {...register('role')}
          aria-describedby={errors.role ? 'role-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.role ? 'border-red-300' : ''}`}
          placeholder={t('role_placeholder')}
        />
        {errors.role && (
          <p id="role-error" className="mt-2 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>
      {/* Organization Role Field */}
      <div>
        <label htmlFor="organizationRole" className="block text-sm font-medium text-gray-700">{t('org_role_label')}</label>
        <input
          id="organizationRole"
          type="text"
          {...register('organizationRole')}
          aria-describedby={errors.organizationRole ? 'organizationRole-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.organizationRole ? 'border-red-300' : ''}`}
          placeholder={t('org_role_placeholder')}
        />
        {errors.organizationRole && (
          <p id="organizationRole-error" className="mt-2 text-sm text-red-600">{errors.organizationRole.message}</p>
        )}
      </div>
      {/* Shortcut Field */}
      <div>
        <label htmlFor="shortcut" className="block text-sm font-medium text-gray-700">{t('shortcut_label')}</label>
        <input
          id="shortcut"
          type="text"
          {...register('shortcut')}
          aria-describedby={errors.shortcut ? 'shortcut-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.shortcut ? 'border-red-300' : ''}`}
          placeholder={t('shortcut_placeholder')}
        />
        {errors.shortcut && (
          <p id="shortcut-error" className="mt-2 text-sm text-red-600">{errors.shortcut.message}</p>
        )}
      </div>
      {/* Is Active Field */}
      <div className="flex items-center space-x-2">
        <input
          id="isActive"
          type="checkbox"
          {...register('isActive')}
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">{t('is_active_label')}</label>
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {t('reset')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? isEditing
              ? t('updating')
              : t('creating')
            : isEditing
              ? t('update')
              : t('create')}
        </button>
      </div>
    </form>
  );
}
