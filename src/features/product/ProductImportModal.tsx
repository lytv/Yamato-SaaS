/**
 * ProductImportModal Component
 * Single-step modal following ProductModal pattern
 * Handles Excel file upload and product import
 */

import React, { useState } from 'react';

import { useProductImport } from '@/hooks/useProductImport';
import type { ImportResult } from '@/types/import';

type ProductImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: ImportResult) => void;
};

export function ProductImportModal({ isOpen, onClose, onSuccess }: ProductImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { importProducts, isImporting, importError, importResult, clearError, clearResult } = useProductImport();

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      clearError();
      clearResult();
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      const result = await importProducts(selectedFile);
      onSuccess(result);
      // Keep modal open to show results
    } catch {
      // Error is handled by hook, no need for local error variable
    }
  };

  // Handle close
  const handleClose = () => {
    setSelectedFile(null);
    clearError();
    clearResult();
    onClose();
  };

  // Handle keyboard events
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      tabIndex={-1}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white shadow-xl">
        <div className="p-6">
          <h2 id="import-modal-title" className="mb-4 text-xl font-semibold">
            Import Products from Excel
          </h2>

          {/* File Upload Section */}
          <div className="mb-6">
            <label htmlFor="file-upload" className="mb-2 block text-sm font-medium text-gray-700">
              Select Excel File (.xlsx)
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isImporting}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected:
                {' '}
                {selectedFile.name}
                {' '}
                (
                {(selectedFile.size / 1024 / 1024).toFixed(2)}
                {' '}
                MB)
              </p>
            )}
          </div>

          {/* Error Display */}
          {importError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{importError}</p>
            </div>
          )}

          {/* Results Display */}
          {importResult && (
            <div className="mb-6 rounded-md bg-gray-50 p-4">
              <h3 className="mb-2 font-medium text-gray-900">Import Results</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  Total rows processed:
                  {importResult.totalRows}
                </p>
                <p className="text-green-600">
                  Successfully created:
                  {importResult.successCount}
                </p>
                {importResult.errorCount > 0 && (
                  <p className="text-red-600">
                    Failed:
                    {importResult.errorCount}
                  </p>
                )}
              </div>

              {/* Error Details */}
              {importResult.errors.length > 0 && (
                <div className="mt-3">
                  <h4 className="mb-2 text-sm font-medium text-gray-900">Errors:</h4>
                  <div className="max-h-32 overflow-y-auto">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <p key={index} className="text-xs text-red-600">
                        Row
                        {' '}
                        {error.rowNumber}
                        :
                        {' '}
                        {error.message}
                      </p>
                    ))}
                    {importResult.errors.length > 10 && (
                      <p className="text-xs text-gray-500">
                        ... and
                        {' '}
                        {importResult.errors.length - 10}
                        {' '}
                        more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isImporting}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {importResult ? 'Close' : 'Cancel'}
            </button>

            {!importResult && (
              <button
                type="button"
                onClick={handleImport}
                disabled={!selectedFile || isImporting}
                className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Import Products'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
