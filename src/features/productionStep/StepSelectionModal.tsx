'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProductionSteps } from '@/hooks/useProductionSteps';
import type { ProductionStep } from '@/types/productionStep';

interface StepSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSteps: ProductionStep[];
  onConfirm: (steps: ProductionStep[]) => void;
  ownerId: string;
}

export function StepSelectionModal({
  isOpen,
  onClose,
  selectedSteps,
  onConfirm,
  ownerId,
}: StepSelectionModalProps) {
  const [localSelected, setLocalSelected] = useState<ProductionStep[]>(selectedSteps);
  const [search, setSearch] = useState('');
  const [stepGroup, setStepGroup] = useState('');
  const [page, setPage] = useState(1);
  const [allSteps, setAllSteps] = useState<ProductionStep[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  const { productionSteps, pagination, isLoading } = useProductionSteps({
    page,
    search,
    ownerId,
    limit: 50, // Increase limit for better UX
  });

  // Load all steps for "Select All" functionality
  const loadAllSteps = useCallback(async () => {
    setIsLoadingAll(true);
    try {
      const response = await fetch(`/api/production-steps?ownerId=${ownerId}&limit=1000`);
      if (response.ok) {
        const data = await response.json();
        setAllSteps(data.productionSteps || []);
      }
    } catch (error) {
      console.error('Failed to load all steps:', error);
    } finally {
      setIsLoadingAll(false);
    }
  }, [ownerId]);

  useEffect(() => {
    if (isOpen) {
      setLocalSelected(selectedSteps);
      loadAllSteps();
    }
  }, [isOpen, selectedSteps, loadAllSteps]);

  const handleToggleStep = (step: ProductionStep) => {
    setLocalSelected(prev => {
      const isSelected = prev.some(s => s.id === step.id);
      if (isSelected) {
        return prev.filter(s => s.id !== step.id);
      } else {
        return [...prev, step];
      }
    });
  };

  const handleSelectAll = () => {
    setLocalSelected(allSteps);
  };

  const handleDeselectAll = () => {
    setLocalSelected([]);
  };

  const handleSelectVisible = () => {
    const visibleIds = new Set(productionSteps.map(s => s.id));
    const newSelected = [...localSelected.filter(s => !visibleIds.has(s.id)), ...productionSteps];
    setLocalSelected(newSelected);
  };

  const handleDeselectVisible = () => {
    const visibleIds = new Set(productionSteps.map(s => s.id));
    setLocalSelected(prev => prev.filter(s => !visibleIds.has(s.id)));
  };

  const handleConfirm = () => {
    onConfirm(localSelected);
    onClose();
  };

  // Get unique step groups for filter dropdown (filter out null/undefined)
  const stepGroups = [...new Set(allSteps.map(s => s.stepGroup).filter(Boolean))] as string[];

  const filteredSteps = productionSteps.filter(step => {
    const searchLower = search.toLowerCase();
    const matchesSearch = step.stepName.toLowerCase().includes(searchLower) ||
      step.stepCode.toLowerCase().includes(searchLower);
    const matchesGroup = !stepGroup || step.stepGroup === stepGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Chọn công đoạn ({localSelected.length} đã chọn)</DialogTitle>
        </DialogHeader>
        
        {/* Search and Filters */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm công đoạn..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <select
            value={stepGroup}
            onChange={(e) => {
              setStepGroup(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">Tất cả nhóm</option>
            {stepGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={isLoadingAll}
          >
            {isLoadingAll ? 'Đang tải...' : `Chọn tất cả (${allSteps.length})`}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
          >
            Bỏ chọn tất cả
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectVisible}
          >
            Chọn trang này ({filteredSteps.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectVisible}
          >
            Bỏ chọn trang này
          </Button>
        </div>

        {/* Step List */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {isLoading ? (
            <div className="p-4 text-center">Đang tải...</div>
          ) : filteredSteps.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Không tìm thấy công đoạn</div>
          ) : (
            <div className="divide-y">
              {filteredSteps.map((step) => {
                const isSelected = localSelected.some(s => s.id === step.id);
                return (
                  <div
                    key={step.id}
                    className={`p-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => handleToggleStep(step)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleStep(step)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{step.stepName}</div>
                      <div className="text-sm text-gray-500 flex gap-4">
                        <span>Mã: {step.stepCode}</span>
                        {step.stepGroup && <span>Nhóm: {step.stepGroup}</span>}
                        {step.filmSequence && <span>Film: {step.filmSequence}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Trang {page} - Hiển thị {filteredSteps.length} công đoạn
            {pagination && ` (Tổng: ${pagination.total})`}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!pagination?.hasMore}
            >
              Tiếp
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} className="bg-blue-600 text-white">
            Xác nhận ({localSelected.length} công đoạn)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}