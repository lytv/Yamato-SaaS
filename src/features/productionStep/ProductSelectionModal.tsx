'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types/product';

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  onConfirm: (products: Product[]) => void;
  ownerId: string;
}

export function ProductSelectionModal({
  isOpen,
  onClose,
  selectedProducts,
  onConfirm,
  ownerId,
}: ProductSelectionModalProps) {
  const [localSelected, setLocalSelected] = useState<Product[]>(selectedProducts);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  const { products, pagination, isLoading } = useProducts({
    page,
    search,
    ownerId,
    limit: 50, // Increase limit for better UX
  });

  // Load all products for "Select All" functionality
  const loadAllProducts = useCallback(async () => {
    setIsLoadingAll(true);
    try {
      const response = await fetch(`/api/products?ownerId=${ownerId}&limit=1000`);
      if (response.ok) {
        const data = await response.json();
        setAllProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to load all products:', error);
    } finally {
      setIsLoadingAll(false);
    }
  }, [ownerId]);

  useEffect(() => {
    if (isOpen) {
      setLocalSelected(selectedProducts);
      loadAllProducts();
    }
  }, [isOpen, selectedProducts, loadAllProducts]);

  const handleToggleProduct = (product: Product) => {
    setLocalSelected(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      if (isSelected) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleSelectAll = () => {
    setLocalSelected(allProducts);
  };

  const handleDeselectAll = () => {
    setLocalSelected([]);
  };

  const handleSelectVisible = () => {
    const visibleIds = new Set(products.map(p => p.id));
    const newSelected = [...localSelected.filter(p => !visibleIds.has(p.id)), ...products];
    setLocalSelected(newSelected);
  };

  const handleDeselectVisible = () => {
    const visibleIds = new Set(products.map(p => p.id));
    setLocalSelected(prev => prev.filter(p => !visibleIds.has(p.id)));
  };

  const handleConfirm = () => {
    onConfirm(localSelected);
    onClose();
  };

  const filteredProducts = products.filter(product => {
    const searchLower = search.toLowerCase();
    const matchesSearch = product.productName.toLowerCase().includes(searchLower) ||
      product.productCode.toLowerCase().includes(searchLower);
    const matchesCategory = !category || product.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Chọn sản phẩm ({localSelected.length} đã chọn)</DialogTitle>
        </DialogHeader>
        
        {/* Search and Filters */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">Tất cả danh mục</option>
            {/* Add category options dynamically if needed */}
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
            {isLoadingAll ? 'Đang tải...' : `Chọn tất cả (${allProducts.length})`}
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
            Chọn trang này ({filteredProducts.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectVisible}
          >
            Bỏ chọn trang này
          </Button>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {isLoading ? (
            <div className="p-4 text-center">Đang tải...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Không tìm thấy sản phẩm</div>
          ) : (
            <div className="divide-y">
              {filteredProducts.map((product) => {
                const isSelected = localSelected.some(p => p.id === product.id);
                return (
                  <div
                    key={product.id}
                    className={`p-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => handleToggleProduct(product)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleProduct(product)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{product.productName}</div>
                      <div className="text-sm text-gray-500 flex gap-4">
                        <span>Mã: {product.productCode}</span>
                        {product.category && <span>Danh mục: {product.category}</span>}
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
            Trang {page} - Hiển thị {filteredProducts.length} sản phẩm
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
            Xác nhận ({localSelected.length} sản phẩm)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}