'use client';

import { Search, Calendar, Users, ArrowUpDown, RotateCcw, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/utils/Helpers';
import { SalaryDetailsFilters } from '@/types/salaryDetails';

interface SalaryDetailsFilterProps {
  filters: SalaryDetailsFilters;
  onFilterChange: <K extends keyof SalaryDetailsFilters>(key: K, value: SalaryDetailsFilters[K]) => void;
  onClearFilters: () => void;
  onExport?: () => void;
  isLoading?: boolean;
  userOptions?: { value: string; label: string; shortcut?: string; email: string; }[];
}

export function SalaryDetailsFilter({
  filters,
  onFilterChange,
  onClearFilters,
  onExport,
  isLoading = false,
  userOptions = [],
}: SalaryDetailsFilterProps) {
  const handleUserSelection = (userId: string) => {
    const currentUserIds = filters.userIds;
    const isSelected = currentUserIds.includes(userId);
    
    if (isSelected) {
      onFilterChange('userIds', currentUserIds.filter(id => id !== userId));
    } else {
      onFilterChange('userIds', [...currentUserIds, userId]);
    }
  };

  const selectedUsers = userOptions.filter(user => filters.userIds.includes(user.value));

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bộ lọc chi tiết lương</h3>
        <div className="flex gap-2">
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            disabled={isLoading}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Xóa bộ lọc
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Tìm kiếm</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Tìm theo tên, sản phẩm, công đoạn..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* User Selection */}
        <div className="space-y-2">
          <Label>Nhân viên</Label>
          <div className="space-y-2">
            {/* Shortcut Input */}
            <div className="relative">
              <Input
                placeholder="Nhập mã shortcut để tìm nhanh..."
                className="pr-10"
                onChange={(e) => {
                  const shortcut = e.target.value.trim().toLowerCase();
                  if (shortcut) {
                    // Find user by shortcut and auto-select
                    const matchedUser = userOptions.find(user => 
                      user.shortcut?.toLowerCase() === shortcut
                    );
                    if (matchedUser && !filters.userIds.includes(matchedUser.value)) {
                      onFilterChange('userIds', [...filters.userIds, matchedUser.value]);
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const shortcut = e.currentTarget.value.trim().toLowerCase();
                    if (shortcut) {
                      const matchedUser = userOptions.find(user => 
                        user.shortcut?.toLowerCase() === shortcut
                      );
                      if (matchedUser) {
                        if (!filters.userIds.includes(matchedUser.value)) {
                          onFilterChange('userIds', [...filters.userIds, matchedUser.value]);
                        }
                        e.currentTarget.value = '';
                      }
                    }
                  }
                }}
              />
              <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            {/* Dropdown Selection */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  {selectedUsers.length === 0 
                    ? 'Chọn nhân viên...' 
                    : selectedUsers.length === 1 
                      ? selectedUsers[0]?.label || 'Nhân viên được chọn'
                      : `${selectedUsers.length} nhân viên được chọn`
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <div className="font-medium">Chọn nhân viên</div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {userOptions.map((user) => (
                      <div key={user.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`user-${user.value}`}
                          checked={filters.userIds.includes(user.value)}
                          onChange={() => handleUserSelection(user.value)}
                          className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <Label htmlFor={`user-${user.value}`} className="text-sm cursor-pointer">
                          <div>
                            <div className="font-medium">{user.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {user.shortcut && `[${user.shortcut}] `}{user.email}
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                  {filters.userIds.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onFilterChange('userIds', [])}
                      className="w-full"
                    >
                      Bỏ chọn tất cả
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label>Từ ngày</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.startDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {filters.startDate ? format(new Date(filters.startDate), 'dd/MM/yyyy') : 'Chọn ngày'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={filters.startDate ? new Date(filters.startDate) : undefined}
                onSelect={(date) => 
                  onFilterChange('startDate', date?.toISOString().split('T')[0] || '')
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label>Đến ngày</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.endDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {filters.endDate ? format(new Date(filters.endDate), 'dd/MM/yyyy') : 'Chọn ngày'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={filters.endDate ? new Date(filters.endDate) : undefined}
                onSelect={(date) => 
                  onFilterChange('endDate', date?.toISOString().split('T')[0] || '')
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Sort By */}
          <div className="flex items-center gap-2">
            <Label>Sắp xếp theo:</Label>
            <Select value={filters.sortBy} onValueChange={(value) => onFilterChange('sortBy', value as SalaryDetailsFilters['sortBy'])}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work_date">Ngày làm việc</SelectItem>
                <SelectItem value="full_name">Tên nhân viên</SelectItem>
                <SelectItem value="product_code">Mã sản phẩm</SelectItem>
                <SelectItem value="step_code">Mã công đoạn</SelectItem>
                <SelectItem value="quantity">Số lượng</SelectItem>
                <SelectItem value="unit_price">Đơn giá</SelectItem>
                <SelectItem value="line_total">Thành tiền</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="w-4 h-4 mr-1" />
              {filters.sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
            </Button>
          </div>

          {/* Show All */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showAll"
              checked={filters.showAll}
              onChange={(e) => onFilterChange('showAll', e.target.checked)}
              className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <Label htmlFor="showAll">Hiển thị tất cả</Label>
          </div>
        </div>
      </div>
    </div>
  );
}