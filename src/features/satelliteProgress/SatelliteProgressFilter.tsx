/**
 * Satellite Progress Filter Component
 * Following Yamato-SaaS patterns with responsive design
 */

'use client';

import { Search, Filter, RotateCcw, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSatelliteProgressContext } from '@/contexts/SatelliteProgressContext';

type SatelliteProgressFilterProps = {
  className?: string;
};

export function SatelliteProgressFilter({
  className = '',
}: SatelliteProgressFilterProps): JSX.Element {
  const t = useTranslations('satelliteProgress.filter');
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
    filterOptions,
    isLoadingFilterOptions,
  } = useSatelliteProgressContext();

  const handleSearchChange = (value: string) => {
    setFilters({ search: value });
  };

  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" back to empty string for API
    const filterValue = value === 'all' ? '' : value;
    setFilters({ [key]: filterValue });
  };

  const handleReset = () => {
    resetFilters();
    setIsExpanded(false);
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {t('title', { defaultValue: 'Bộ lọc' })}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {t('description', { defaultValue: 'Lọc dữ liệu tiến độ vệ tinh' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Badge variant="secondary" className="px-3 py-1">
                <Filter className="h-3 w-3 mr-1" />
                {activeFilterCount} bộ lọc
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {isExpanded ? 'Thu gọn' : 'Mở rộng'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Input - Always visible */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium">
            {t('search.label', { defaultValue: 'Tìm kiếm' })}
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              type="text"
              placeholder={t('search.placeholder', { defaultValue: 'Tìm kiếm sản phẩm, kế hoạch, nhân viên...' })}
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Expandable Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            {/* Plan Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('plan.label', { defaultValue: 'Kế hoạch' })}
              </Label>
              <Select
                value={filters.plan_code || 'all'}
                onValueChange={(value) => handleFilterChange('plan_code', value)}
                disabled={isLoadingFilterOptions}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('plan.placeholder', { defaultValue: 'Chọn kế hoạch' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('plan.all', { defaultValue: 'Tất cả kế hoạch' })}
                  </SelectItem>
                  {filterOptions?.plans.map((plan) => (
                    <SelectItem key={plan.code} value={plan.code}>
                      {plan.name} ({plan.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('product.label', { defaultValue: 'Sản phẩm' })}
              </Label>
              <Select
                value={filters.product_code || 'all'}
                onValueChange={(value) => handleFilterChange('product_code', value)}
                disabled={isLoadingFilterOptions}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('product.placeholder', { defaultValue: 'Chọn sản phẩm' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('product.all', { defaultValue: 'Tất cả sản phẩm' })}
                  </SelectItem>
                  {filterOptions?.products.map((product) => (
                    <SelectItem key={product.code} value={product.code}>
                      {product.name} ({product.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <Users className="h-4 w-4 inline mr-1" />
                {t('user.label', { defaultValue: 'Nhân viên vệ tinh' })}
              </Label>
              <Select
                value={filters.assigned_user_id || 'all'}
                onValueChange={(value) => handleFilterChange('assigned_user_id', value)}
                disabled={isLoadingFilterOptions}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('user.placeholder', { defaultValue: 'Chọn nhân viên' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('user.all', { defaultValue: 'Tất cả nhân viên' })}
                  </SelectItem>
                  {filterOptions?.users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.user_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('sort.label', { defaultValue: 'Sắp xếp' })}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product_code">Mã sản phẩm</SelectItem>
                    <SelectItem value="plan_code">Mã kế hoạch</SelectItem>
                    <SelectItem value="assigned_user_name">Nhân viên</SelectItem>
                    <SelectItem value="completion_rate">Tỷ lệ hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value) => handleFilterChange('sortOrder', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Tăng dần</SelectItem>
                    <SelectItem value="desc">Giảm dần</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {hasActiveFilters && (
          <div className="flex items-center justify-end pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {t('reset', { defaultValue: 'Xóa bộ lọc' })}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}