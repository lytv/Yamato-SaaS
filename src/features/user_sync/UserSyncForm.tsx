/**
 * UserSyncForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing user_syncs with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Building, Eye, EyeOff, Hash, Mail, RefreshCw, Shield, Tag, ToggleLeft, ToggleRight, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useUserSyncMutations } from '@/hooks/useUserSyncMutations';
import { generateUserId } from '@/libs/utils/generateUserId';
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
  const [showUserId, setShowUserId] = useState(false);
  const { createUserSync, updateUserSync, isCreating, isUpdating, error, clearError } = useUserSyncMutations();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
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
          userId: generateUserId(), // Auto-generate User ID for new users
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

  const handleGenerateUserId = (): void => {
    const newUserId = generateUserId();
    setValue('userId', newUserId, { shouldValidate: true });
  };

  const toggleUserIdVisibility = (): void => {
    setShowUserId(!showUserId);
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <User className="size-8 text-white" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            {isEditing ? t('editTitle') : t('createTitle')}
          </h2>
          <p className="text-gray-600">
            {isEditing ? t('editDescription') : t('createDescription')}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="flex size-5 items-center justify-center rounded-full bg-red-100">
                  <span className="text-xs text-red-600">!</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        {/* User ID Field */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <label htmlFor="userId" className="mb-3 flex items-center text-sm font-semibold text-gray-800">
            <Hash className="mr-2 size-4 text-blue-500" />
            {t('user_id_label')}
            <span className="ml-1 text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500">
              <input
                id="userId"
                type={showUserId ? 'text' : 'password'}
                {...register('userId')}
                aria-required="true"
                aria-describedby={errors.userId ? 'userId-error' : undefined}
                className={`block w-full flex-1 border-0 bg-transparent px-4 py-3 text-sm placeholder:text-gray-400 focus:ring-0 ${errors.userId ? 'text-red-600' : 'text-gray-900'}`}
                placeholder={t('user_id_placeholder')}
                readOnly={isEditing}
              />
              <div className="flex items-center space-x-1 px-2">
                <button
                  type="button"
                  onClick={toggleUserIdVisibility}
                  className="p-2 text-gray-400 transition-colors duration-200 hover:text-gray-600"
                  title={showUserId ? t('hideUserId') : t('showUserId')}
                >
                  {showUserId ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleGenerateUserId}
                    className="flex items-center space-x-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-blue-600"
                  >
                    <RefreshCw className="size-4" />
                    <span>{t('generateButton')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          {errors.userId && (
            <p id="userId-error" className="mt-2 flex items-center text-sm text-red-600">
              <span className="mr-2 flex size-4 items-center justify-center rounded-full bg-red-100">
                <span className="text-xs text-red-600">!</span>
              </span>
              {errors.userId.message}
            </p>
          )}
          {!isEditing && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="flex items-center text-xs text-blue-700">
                <span className="mr-2 flex size-4 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-xs text-blue-600">i</span>
                </span>
                {t('userIdInfo')}
              </p>
            </div>
          )}
        </div>
        {/* Email Field */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <label htmlFor="email" className="mb-3 flex items-center text-sm font-semibold text-gray-800">
            <Mail className="mr-2 size-4 text-green-500" />
            {t('email_label')}
            <span className="ml-1 text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              {...register('email')}
              aria-required="true"
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`block w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'}`}
              placeholder={t('email_placeholder')}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="mt-2 flex items-center text-sm text-red-600">
              <span className="mr-2 flex size-4 items-center justify-center rounded-full bg-red-100">
                <span className="text-xs text-red-600">!</span>
              </span>
              {errors.email.message}
            </p>
          )}
        </div>
        {/* Full Name Field */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <label htmlFor="fullName" className="mb-3 flex items-center text-sm font-semibold text-gray-800">
            <User className="mr-2 size-4 text-purple-500" />
            {t('full_name_label')}
          </label>
          <div className="relative">
            <input
              id="fullName"
              type="text"
              {...register('fullName')}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              className={`block w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'}`}
              placeholder={t('full_name_placeholder')}
            />
          </div>
          {errors.fullName && (
            <p id="fullName-error" className="mt-2 flex items-center text-sm text-red-600">
              <span className="mr-2 flex size-4 items-center justify-center rounded-full bg-red-100">
                <span className="text-xs text-red-600">!</span>
              </span>
              {errors.fullName.message}
            </p>
          )}
        </div>
        {/* Role Fields Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Role Field */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <label htmlFor="role" className="mb-3 flex items-center text-sm font-semibold text-gray-800">
              <Shield className="mr-2 size-4 text-orange-500" />
              {t('role_label')}
            </label>
            <div className="relative">
              <input
                id="role"
                type="text"
                {...register('role')}
                aria-describedby={errors.role ? 'role-error' : undefined}
                className={`block w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.role ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'}`}
                placeholder={t('role_placeholder')}
              />
            </div>
            {errors.role && (
              <p id="role-error" className="mt-2 flex items-center text-sm text-red-600">
                <span className="mr-2 flex size-4 items-center justify-center rounded-full bg-red-100">
                  <span className="text-xs text-red-600">!</span>
                </span>
                {errors.role.message}
              </p>
            )}
          </div>

          {/* Organization Role Field */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <label htmlFor="organizationRole" className="mb-3 flex items-center text-sm font-semibold text-gray-800">
              <Building className="mr-2 size-4 text-indigo-500" />
              {t('org_role_label')}
            </label>
            <div className="relative">
              <input
                id="organizationRole"
                type="text"
                {...register('organizationRole')}
                aria-describedby={errors.organizationRole ? 'organizationRole-error' : undefined}
                className={`block w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.organizationRole ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'}`}
                placeholder={t('org_role_placeholder')}
              />
            </div>
            {errors.organizationRole && (
              <p id="organizationRole-error" className="mt-2 flex items-center text-sm text-red-600">
                <span className="mr-2 flex size-4 items-center justify-center rounded-full bg-red-100">
                  <span className="text-xs text-red-600">!</span>
                </span>
                {errors.organizationRole.message}
              </p>
            )}
          </div>
        </div>
        {/* Shortcut and Status Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Shortcut Field */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <label htmlFor="shortcut" className="mb-3 flex items-center text-sm font-semibold text-gray-800">
              <Tag className="mr-2 size-4 text-pink-500" />
              {t('shortcut_label')}
            </label>
            <div className="relative">
              <input
                id="shortcut"
                type="text"
                {...register('shortcut')}
                aria-describedby={errors.shortcut ? 'shortcut-error' : undefined}
                className={`block w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500 ${errors.shortcut ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'}`}
                placeholder={t('shortcut_placeholder')}
              />
            </div>
            {errors.shortcut && (
              <p id="shortcut-error" className="mt-2 flex items-center text-sm text-red-600">
                <span className="mr-2 flex size-4 items-center justify-center rounded-full bg-red-100">
                  <span className="text-xs text-red-600">!</span>
                </span>
                {errors.shortcut.message}
              </p>
            )}
          </div>

          {/* Is Active Field */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <label htmlFor="isActive" className="mb-3 flex items-center text-sm font-semibold text-gray-800">
              <span className="mr-2 size-4">{watch('isActive') ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-gray-400" />}</span>
              {t('is_active_label')}
            </label>
            <div className="flex items-center space-x-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  id="isActive"
                  type="checkbox"
                  {...register('isActive')}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                <span className="ml-3 text-sm text-gray-600">
                  {watch('isActive') ? t('active') : t('inactive')}
                </span>
              </label>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-col justify-end space-y-3 border-t border-gray-200 pt-6 sm:flex-row sm:space-x-4 sm:space-y-0">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:scale-105 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-lg border border-orange-300 bg-orange-50 px-6 py-3 text-sm font-medium text-orange-700 transition-all duration-200 hover:scale-105 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <RefreshCw className="mr-2 size-4" />
            {t('reset')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className={`inline-flex items-center justify-center rounded-lg border border-transparent px-8 py-3 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50${
              isEditing
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500'
            }`}
          >
            {isSubmitting
              ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                    {isEditing ? t('updating') : t('creating')}
                  </>
                )
              : (
                  <>
                    <User className="mr-2 size-4" />
                    {isEditing ? t('update') : t('create')}
                  </>
                )}
          </button>
        </div>
      </form>
    </div>
  );
}
