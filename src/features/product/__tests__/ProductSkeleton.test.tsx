/**
 * ProductSkeleton Component Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing loading states and skeleton animations
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProductSkeleton } from '@/features/product/ProductSkeleton';

describe('ProductSkeleton Component', () => {
  describe('Basic Rendering', () => {
    it('should render skeleton with proper structure', () => {
      render(<ProductSkeleton />);

      expect(screen.getByTestId('product-skeleton')).toBeInTheDocument();
    });

    it('should render skeleton rows', () => {
      render(<ProductSkeleton />);

      const skeletonRows = screen.getAllByTestId('skeleton-row');
      expect(skeletonRows.length).toBeGreaterThan(0);
    });

    it('should render skeleton table headers', () => {
      render(<ProductSkeleton />);

      expect(screen.getByTestId('skeleton-header')).toBeInTheDocument();
    });
  });

  describe('Customization', () => {
    it('should render specified number of rows', () => {
      render(<ProductSkeleton rows={5} />);

      const skeletonRows = screen.getAllByTestId('skeleton-row');
      expect(skeletonRows).toHaveLength(5);
    });

    it('should render default number of rows when not specified', () => {
      render(<ProductSkeleton />);

      const skeletonRows = screen.getAllByTestId('skeleton-row');
      expect(skeletonRows).toHaveLength(3); // Default should be 3
    });

    it('should apply custom className when provided', () => {
      render(<ProductSkeleton className="custom-skeleton" />);

      const skeleton = screen.getByTestId('product-skeleton');
      expect(skeleton).toHaveClass('custom-skeleton');
    });
  });

  describe('Animation', () => {
    it('should have animated skeleton elements', () => {
      render(<ProductSkeleton />);

      const animatedElements = screen.getAllByTestId('skeleton-animate');
      expect(animatedElements.length).toBeGreaterThan(0);
      
      animatedElements.forEach(element => {
        expect(element).toHaveClass('animate-pulse');
      });
    });

    it('should have proper skeleton styling', () => {
      render(<ProductSkeleton />);

      const skeletonElements = screen.getAllByTestId('skeleton-animate');
      skeletonElements.forEach(element => {
        expect(element).toHaveClass('bg-gray-200');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ProductSkeleton />);

      const skeleton = screen.getByTestId('product-skeleton');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading products');
      expect(skeleton).toHaveAttribute('role', 'status');
    });

    it('should have loading text for screen readers', () => {
      render(<ProductSkeleton />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render mobile-friendly skeleton', () => {
      render(<ProductSkeleton variant="mobile" />);

      expect(screen.getByTestId('mobile-skeleton')).toBeInTheDocument();
    });

    it('should render desktop skeleton by default', () => {
      render(<ProductSkeleton />);

      expect(screen.getByTestId('desktop-skeleton')).toBeInTheDocument();
    });
  });
}); 