/**
 * Price Summary Filter Component
 * Filter controls for price summary pivot table
 * Following Yamato-SaaS patterns with responsive design
 */

'use client';

import { 
  Search, 
  Package, 
  DollarSign, 
  Filter,
  X,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { usePriceSummaryFilterOptions } from '@/hooks/usePriceSummaryFilterOptions';
import type { 
  PriceSummaryFilterState,
  PriceType,
} from '@/types/priceSummary';
import { PRICE_TYPE_OPTIONS } from '@/types/priceSummary';

type PriceSummaryFilterProps = {
  filters: PriceSummaryFilterState;
  onFiltersChange: (filters: Partial<PriceSummaryFilterState>) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  isLoading?: boolean;
  className?: string;
};

export function PriceSummaryFilter({
  filters,
  onFiltersChange,
  onReset,
  hasActiveFilters,
  activeFilterCount,
  isLoading = false,
  className = '',
}: PriceSummaryFilterProps): JSX.Element {
  const t = useTranslations('priceSummary.filter');
  const [searchInput, setSearchInput] = useState(filters.search);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get filter options
  const { filterOptions, isLoading: isLoadingOptions } = usePriceSummaryFilterOptions();

  // Sync search input with filters
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // Handle search input change
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  // Handle search on Enter or blur
  const handleSearchApply = () => {
    onFiltersChange({ search: searchInput });
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearchApply();
    }
  };

  // Handle product filter change
  const handleProductChange = (value: string) => {
    onFiltersChange({ product_code: value === 'all' ? '' : value });
  };

  // Handle price type filter change
  const handlePriceTypeChange = (value: string) => {
    onFiltersChange({ price_type: value as PriceType });
  };

  // Handle sort field change
  const handleSortByChange = (value: string) => {
    onFiltersChange({ sortBy: value });
  };

  // Handle sort order toggle
  const handleSortOrderToggle = () => {
    onFiltersChange({ 
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
    });
  };

  // Handle pricing filter toggle
  const handlePricingFilterToggle = (checked: boolean) => {
    onFiltersChange({ show_only_with_pricing: checked });
  };

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">
              {t('title', { defaultValue: 'Bộ lọc' })}
            </CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="lg:hidden"
            >
              <Settings className={`h-4 w-4 ${isExpanded ? 'rotate-90' : ''} transition-transform`} />
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                {t('reset', { defaultValue: 'Reset' })}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`space-y-4 ${isExpanded ? 'block' : 'hidden lg:block'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              {t('search.label', { defaultValue: 'Tìm kiếm' })}
            </Label>
            <div className="relative">
              <Input
                id="search"
                type="text"
                value={searchInput}
                onChange={handleSearchInputChange}
                onBlur={handleSearchApply}
                onKeyDown={handleSearchKeyDown}
                placeholder={t('search.placeholder', { 
                  defaultValue: 'Tìm theo mã, tên sản phẩm...' 
                })}
                className="pr-8"
                disabled={isLoading}
              />
              {searchInput && searchInput !== filters.search && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSearchApply}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  title="Áp dụng tìm kiếm"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Product Filter */}
          <div className="space-y-2">
            <Label htmlFor="product" className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              {t('product.label', { defaultValue: 'Sản phẩm' })}
            </Label>
            <Select
              value={filters.product_code || 'all'}
              onValueChange={handleProductChange}
              disabled={isLoading || isLoadingOptions}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('product.placeholder', { 
                  defaultValue: 'Chọn sản phẩm' 
                })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('product.all', { defaultValue: 'Tất cả sản phẩm' })}
                </SelectItem>
                {filterOptions.products.map((product) => (
                  <SelectItem key={product.code} value={product.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-500">
                        {product.code}
                      </span>
                      <span>{product.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="priceType" className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              {t('priceType.label', { defaultValue: 'Loại đơn giá' })}
            </Label>
            <Select
              value={filters.price_type}
              onValueChange={handlePriceTypeChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="space-y-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Controls */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4 text-purple-500" />
              {t('sort.label', { defaultValue: 'Sắp xếp' })}
            </Label>
            <div className="flex gap-2">
              <Select
                value={filters.sortBy}
                onValueChange={handleSortByChange}
                disabled={isLoading}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_code">
                    {t('sort.productCode', { defaultValue: 'Mã sản phẩm' })}
                  </SelectItem>
                  <SelectItem value="product_name">
                    {t('sort.productName', { defaultValue: 'Tên sản phẩm' })}
                  </SelectItem>
                  <SelectItem value="total_steps">
                    {t('sort.totalSteps', { defaultValue: 'Số công đoạn' })}
                  </SelectItem>
                  <SelectItem value="total_price">
                    {t('sort.totalPrice', { defaultValue: 'Tổng giá trị' })}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSortOrderToggle}
                disabled={isLoading}
                className="px-3"
                title={filters.sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Pricing Filter Toggle */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
              {t('pricing.label', { defaultValue: 'Hiển thị' })}
            </Label>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <Switch
                id="show_only_with_pricing"
                checked={filters.show_only_with_pricing}
                onCheckedChange={handlePricingFilterToggle}
                disabled={isLoading}
              />
              <Label 
                htmlFor="show_only_with_pricing" 
                className="text-sm cursor-pointer"
              >
                {t('pricing.onlyWithPricing', { defaultValue: 'Chỉ có đơn giá' })}
              </Label>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-gray-500 mr-2">
              {t('activeFilters', { defaultValue: 'Bộ lọc đang áp dụng:' })}
            </span>
            
            {filters.search && (
              <Badge variant="outline" className="gap-1">
                <Search className="h-3 w-3" />
                {filters.search}
                <button
                  onClick={() => onFiltersChange({ search: '' })}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            )}
            
            {filters.product_code && (
              <Badge variant="outline" className="gap-1">
                <Package className="h-3 w-3" />
                {filterOptions.products.find(p => p.code === filters.product_code)?.name || filters.product_code}
                <button
                  onClick={() => onFiltersChange({ product_code: '' })}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            )}
            
            {filters.price_type !== 'factory_price' && (
              <Badge variant="outline" className="gap-1">
                <DollarSign className="h-3 w-3" />
                {PRICE_TYPE_OPTIONS.find(p => p.value === filters.price_type)?.label}
                <button
                  onClick={() => onFiltersChange({ price_type: 'factory_price' })}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            )}

            {filters.show_only_with_pricing && (
              <Badge variant="outline" className="gap-1">
                <DollarSign className="h-3 w-3" />
                {t('pricing.onlyWithPricing', { defaultValue: 'Chỉ có đơn giá' })}
                <button
                  onClick={() => onFiltersChange({ show_only_with_pricing: false })}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}