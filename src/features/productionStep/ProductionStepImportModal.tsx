import React, { useState } from 'react';

import { useProductionStepImport } from '@/hooks/useProductionStepImport';
import type { ImportProductionStepResult } from '@/types/import';

type ProductionStepImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: ImportProductionStepResult) => void;
};

export function ProductionStepImportModal({ isOpen, onClose, onSuccess }: ProductionStepImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { importProductionSteps, isImporting, importError, importResult, clearError, clearResult } = useProductionStepImport();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      clearError();
      clearResult();
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      return;
    }
    try {
      const result = await importProductionSteps(selectedFile);
      onSuccess(result);
    } catch {
      // Error handled by hook
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    clearError();
    clearResult();
    onClose();
  };

  const handleBackdropClick = () => {
    handleClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      tabIndex={-1}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white shadow-xl">
        <button
          type="button"
          aria-label="Close modal"
          tabIndex={0}
          className="absolute right-4 top-4 z-10 rounded bg-gray-200 px-2 py-1 text-gray-700 hover:bg-gray-300 focus:outline-none"
          onClick={handleBackdropClick}
        >
          ×
        </button>
        <div className="p-6">
          <h2 id="import-modal-title" className="mb-4 text-xl font-semibold">
            Import Production Steps from Excel
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
              {importResult.errors.length > 0 && (
                <div className="mt-3">
                  <h4 className="mb-2 text-sm font-medium text-gray-900">Errors:</h4>
                  <div className="max-h-32 overflow-y-auto">
                    {importResult.errors.slice(0, 10).map(error => (
                      <p key={error.rowNumber} className="text-xs text-red-600">
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
                {isImporting ? 'Importing...' : 'Import Production Steps'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
