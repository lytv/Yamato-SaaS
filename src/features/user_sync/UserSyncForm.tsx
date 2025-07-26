/**
 * UserSyncForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing user_syncs with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Tag, Shield, Building, Hash, ToggleLeft, ToggleRight, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useUserSyncMutations } from '@/hooks/useUserSyncMutations';
import { userSyncFormSchema } from '@/libs/validations/user_sync';
import { generateUserId } from '@/libs/utils/generateUserId';
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
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Header */}
        <div className="text-center pb-6 border-b border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isEditing ? t('editTitle') : t('createTitle')}
          </h2>
          <p className="text-gray-600">
            {isEditing ? t('editDescription') : t('createDescription')}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xs">!</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        {/* User ID Field */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <label htmlFor="userId" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
            <Hash className="w-4 h-4 mr-2 text-blue-500" />
            {t('user_id_label')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
              <input
                id="userId"
                type={showUserId ? 'text' : 'password'}
                {...register('userId')}
                aria-required="true"
                aria-describedby={errors.userId ? 'userId-error' : undefined}
                className={`flex-1 block w-full border-0 bg-transparent py-3 px-4 text-sm placeholder:text-gray-400 focus:ring-0 ${errors.userId ? 'text-red-600' : 'text-gray-900'}`}
                placeholder={t('user_id_placeholder')}
                readOnly={isEditing}
              />
              <div className="flex items-center space-x-1 px-2">
                <button
                  type="button"
                  onClick={toggleUserIdVisibility}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  title={showUserId ? t('hideUserId') : t('showUserId')}
                >
                  {showUserId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleGenerateUserId}
                    className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-all duration-200 transform hover:scale-105"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t('generateButton')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          {errors.userId && (
            <p id="userId-error" className="mt-2 text-sm text-red-600 flex items-center">
              <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-red-600 text-xs">!</span>
              </span>
              {errors.userId.message}
            </p>
          )}
          {!isEditing && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 flex items-center">
                <span className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-blue-600 text-xs">i</span>
                </span>
                {t('userIdInfo')}
              </p>
            </div>
          )}
        </div>
        {/* Email Field */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <label htmlFor="email" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
            <Mail className="w-4 h-4 mr-2 text-green-500" />
            {t('email_label')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              {...register('email')}
              aria-required="true"
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'}`}
              placeholder={t('email_placeholder')}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="mt-2 text-sm text-red-600 flex items-center">
              <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-red-600 text-xs">!</span>
              </span>
              {errors.email.message}
            </p>
          )}
        </div>
        {/* Full Name Field */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <label htmlFor="fullName" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
            <User className="w-4 h-4 mr-2 text-purple-500" />
            {t('full_name_label')}
          </label>
          <div className="relative">
            <input
              id="fullName"
              type="text"
              {...register('fullName')}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'}`}
              placeholder={t('full_name_placeholder')}
            />
          </div>
          {errors.fullName && (
            <p id="fullName-error" className="mt-2 text-sm text-red-600 flex items-center">
              <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-red-600 text-xs">!</span>
              </span>
              {errors.fullName.message}
            </p>
          )}
        </div>
        {/* Role Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Role Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label htmlFor="role" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Shield className="w-4 h-4 mr-2 text-orange-500" />
              {t('role_label')}
            </label>
            <div className="relative">
              <input
                id="role"
                type="text"
                {...register('role')}
                aria-describedby={errors.role ? 'role-error' : undefined}
                className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.role ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'}`}
                placeholder={t('role_placeholder')}
              />
            </div>
            {errors.role && (
              <p id="role-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.role.message}
              </p>
            )}
          </div>

          {/* Organization Role Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label htmlFor="organizationRole" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Building className="w-4 h-4 mr-2 text-indigo-500" />
              {t('org_role_label')}
            </label>
            <div className="relative">
              <input
                id="organizationRole"
                type="text"
                {...register('organizationRole')}
                aria-describedby={errors.organizationRole ? 'organizationRole-error' : undefined}
                className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.organizationRole ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'}`}
                placeholder={t('org_role_placeholder')}
              />
            </div>
            {errors.organizationRole && (
              <p id="organizationRole-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.organizationRole.message}
              </p>
            )}
          </div>
        </div>
        {/* Shortcut and Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shortcut Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label htmlFor="shortcut" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Tag className="w-4 h-4 mr-2 text-pink-500" />
              {t('shortcut_label')}
            </label>
            <div className="relative">
              <input
                id="shortcut"
                type="text"
                {...register('shortcut')}
                aria-describedby={errors.shortcut ? 'shortcut-error' : undefined}
                className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${errors.shortcut ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'}`}
                placeholder={t('shortcut_placeholder')}
              />
            </div>
            {errors.shortcut && (
              <p id="shortcut-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.shortcut.message}
              </p>
            )}
          </div>

          {/* Is Active Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label htmlFor="isActive" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <span className="w-4 h-4 mr-2">{watch('isActive') ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-gray-400" />}</span>
              {t('is_active_label')}
            </label>
            <div className="flex items-center space-x-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="isActive"
                  type="checkbox"
                  {...register('isActive')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm text-gray-600">
                  {watch('isActive') ? t('active') : t('inactive')}
                </span>
              </label>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex justify-center items-center px-6 py-3 border border-orange-300 rounded-lg text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('reset')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className={`inline-flex justify-center items-center px-8 py-3 border border-transparent rounded-lg text-sm font-medium text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none ${
              isEditing 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500' 
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? t('updating') : t('creating')}
              </>
            ) : (
              <>
                <User className="w-4 h-4 mr-2" />
                {isEditing ? t('update') : t('create')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
