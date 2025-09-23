'use client';

import React, { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type PriceType, useProductionStepDetailPriceImport } from '@/hooks/useProductionStepDetailPriceImport';

type PriceImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function PriceImportModal({ isOpen, onClose, onSuccess }: PriceImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [priceType, setPriceType] = useState<PriceType>('factory_price');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { importPrices, isImporting, importResult, clearResult } = useProductionStepDetailPriceImport();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      clearResult();
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      return;
    }

    const result = await importPrices(selectedFile, priceType);

    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPriceType('factory_price');
    clearResult();
    onClose();
  };

  const resetForm = () => {
    setSelectedFile(null);
    clearResult();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>📊 Import Đơn Giá từ Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-2 font-medium text-blue-800">📋 Hướng dẫn format file Excel:</h3>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>
                •
                <strong>Dòng đầu tiên:</strong>
                {' '}
                Mã công đoạn (stepCode) từ cột B, C, D...
              </li>
              <li>
                •
                <strong>Cột đầu tiên:</strong>
                {' '}
                Mã hàng (productCode) từ dòng 2 trở đi
              </li>
              <li>
                •
                <strong>Các ô giao nhau:</strong>
                {' '}
                Giá trị đơn giá (số)
              </li>
              <li>
                •
                <strong>Ô trống:</strong>
                {' '}
                Sẽ được bỏ qua, không cập nhật
              </li>
            </ul>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <label htmlFor="file-input" className="block text-sm font-medium text-gray-700">
              📎 Chọn file Excel
            </label>
            <input
              id="file-input"
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              disabled={isImporting}
            />
            {selectedFile && (
              <p className="text-sm text-green-600">
                ✅ Đã chọn:
                {' '}
                {selectedFile.name}
                {' '}
                (
                {(selectedFile.size / 1024).toFixed(1)}
                {' '}
                KB)
              </p>
            )}
          </div>

          {/* Price Type Selection */}
          <div className="space-y-3">
            <h3 className="block text-sm font-medium text-gray-700">
              💰 Loại đơn giá cần cập nhật
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <label htmlFor="factory-price" className="flex cursor-pointer items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50" aria-label="Factory Price">
                <input
                  id="factory-price"
                  type="radio"
                  name="priceType"
                  value="factory_price"
                  checked={priceType === 'factory_price'}
                  onChange={e => setPriceType(e.target.value as PriceType)}
                  disabled={isImporting}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium">🏭 Giá xưởng</div>
                  <div className="text-sm text-gray-500">Factory Price</div>
                </div>
              </label>

              <label htmlFor="calculated-price" className="flex cursor-pointer items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50" aria-label="Calculated Price">
                <input
                  id="calculated-price"
                  type="radio"
                  name="priceType"
                  value="calculated_price"
                  checked={priceType === 'calculated_price'}
                  onChange={e => setPriceType(e.target.value as PriceType)}
                  disabled={isImporting}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium">🧮 Giá tính toán</div>
                  <div className="text-sm text-gray-500">Calculated Price</div>
                </div>
              </label>

              <label htmlFor="retail-price" className="flex cursor-pointer items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50" aria-label="Retail Price">
                <input
                  id="retail-price"
                  type="radio"
                  name="priceType"
                  value="retail_price"
                  checked={priceType === 'retail_price'}
                  onChange={e => setPriceType(e.target.value as PriceType)}
                  disabled={isImporting}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium">🛒 Giá bán lẻ</div>
                  <div className="text-sm text-gray-500">Retail Price</div>
                </div>
              </label>
            </div>
          </div>

          {/* Import Result */}
          {importResult && (
            <div className={`rounded-lg border p-4 ${
              importResult.success
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}
            >
              <div className={`font-medium ${
                importResult.success ? 'text-green-800' : 'text-red-800'
              }`}
              >
                {importResult.success ? '✅ Import thành công!' : '❌ Import thất bại'}
              </div>

              {importResult.message && (
                <p className={`mt-1 text-sm ${
                  importResult.success ? 'text-green-700' : 'text-red-700'
                }`}
                >
                  {importResult.message}
                </p>
              )}

              <div className="mt-3 grid grid-cols-4 gap-3 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{importResult.summary.processed}</div>
                  <div className="text-gray-500">Đã xử lý</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-600">{importResult.summary.updated}</div>
                  <div className="text-gray-500">Cập nhật</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">{importResult.summary.created}</div>
                  <div className="text-gray-500">Tạo mới</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600">{importResult.summary.errors}</div>
                  <div className="text-gray-500">Lỗi</div>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-red-800">
                    Xem chi tiết lỗi (
                    {importResult.errors.length}
                    )
                  </summary>
                  <div className="mt-2 max-h-32 overflow-y-auto rounded bg-red-100 p-2 text-sm text-red-700">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="mb-1">
                        •
                        {error}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isImporting}>
                ❌ Hủy
              </Button>
              {(selectedFile || importResult) && (
                <Button variant="outline" onClick={resetForm} disabled={isImporting}>
                  🔄 Reset
                </Button>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isImporting
                ? (
                    <>
                      <span className="mr-2 animate-spin">⚙️</span>
                      Đang import...
                    </>
                  )
                : (
                    <>
                      📊 Import đơn giá
                    </>
                  )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
