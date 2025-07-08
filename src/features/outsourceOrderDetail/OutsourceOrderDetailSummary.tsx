/**
 * OutsourceOrderDetail Summary Component
 * Displays aggregated statistics and totals for order details
 */

'use client';

import { useMemo } from 'react';
import type { OutsourceOrderDetailWithRelations } from '@/types/outsourceOrderDetail';

interface OutsourceOrderDetailSummaryProps {
  details: OutsourceOrderDetailWithRelations[];
  className?: string;
}

export function OutsourceOrderDetailSummary({ 
  details, 
  className = '' 
}: OutsourceOrderDetailSummaryProps) {
  const summary = useMemo(() => {
    const totalItems = details.length;
    const totalOrderedQuantity = details.reduce((sum, detail) => sum + (detail.orderedQuantity || 0), 0);
    const totalCompletedQuantity = details.reduce((sum, detail) => sum + (detail.completedQuantity || 0), 0);
    
    const totalValue = details.reduce((sum, detail) => {
      const price = typeof detail.totalPrice === 'string' ? Number(detail.totalPrice) : detail.totalPrice;
      return sum + (price || 0);
    }, 0);

    const completionRate = totalOrderedQuantity > 0 ? (totalCompletedQuantity / totalOrderedQuantity) * 100 : 0;

    // Status breakdown
    const statusCounts = details.reduce((acc, detail) => {
      const status = detail.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Step breakdown
    const stepCounts = details.reduce((acc, detail) => {
      const step = detail.stepName || 'Unknown';
      acc[step] = (acc[step] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Product breakdown
    const productCounts = details.reduce((acc, detail) => {
      const product = detail.productName || 'Unknown';
      acc[product] = (acc[product] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalItems,
      totalOrderedQuantity,
      totalCompletedQuantity,
      totalValue,
      completionRate,
      statusCounts,
      stepCounts,
      productCounts,
    };
  }, [details]);

  if (details.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p>No details available for summary</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Totals */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Summary Totals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.totalOrderedQuantity.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Ordered Quantity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.totalCompletedQuantity.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">₫ {summary.totalValue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Value</div>
          </div>
        </div>
      </div>

      {/* Progress and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion Progress */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-md font-semibold mb-3">Completion Progress</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overall Progress</span>
              <span className="text-sm font-medium">{summary.completionRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(summary.completionRate, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{summary.totalCompletedQuantity} completed</span>
              <span>{summary.totalOrderedQuantity - summary.totalCompletedQuantity} remaining</span>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-md font-semibold mb-3">Status Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(summary.statusCounts).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'completed' ? 'bg-green-500' :
                    status === 'in_progress' ? 'bg-orange-500' :
                    status === 'cancelled' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                </div>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Production Steps */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-md font-semibold mb-3">By Production Step</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Object.entries(summary.stepCounts)
              .sort(([,a], [,b]) => b - a)
              .map(([step, count]) => (
                <div key={step} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 truncate flex-1 mr-2" title={step}>
                    {step}
                  </span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-md font-semibold mb-3">By Product</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Object.entries(summary.productCounts)
              .sort(([,a], [,b]) => b - a)
              .map(([product, count]) => (
                <div key={product} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 truncate flex-1 mr-2" title={product}>
                    {product}
                  </span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-700">{summary.totalItems}</div>
            <div className="text-xs text-gray-500">Total Items</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-700">{Object.keys(summary.productCounts).length}</div>
            <div className="text-xs text-gray-500">Unique Products</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-700">{Object.keys(summary.stepCounts).length}</div>
            <div className="text-xs text-gray-500">Production Steps</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-700">{Object.keys(summary.statusCounts).length}</div>
            <div className="text-xs text-gray-500">Status Types</div>
          </div>
        </div>
      </div>
    </div>
  );
}
