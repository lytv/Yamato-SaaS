import React from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded shadow-lg p-6 min-w-[350px] relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          onClick={() => onOpenChange(false)}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
} 