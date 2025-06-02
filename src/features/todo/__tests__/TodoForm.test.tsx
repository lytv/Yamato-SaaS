/**
 * TodoForm Component Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing form validation, submission, and create/edit modes
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TodoForm } from '@/features/todo/TodoForm';
import type { Todo } from '@/types/todo';

// Mock hooks
vi.mock('@/hooks/useTodoMutations', () => ({
  useTodoMutations: vi.fn(),
}));

// Mock i18n
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: vi.fn(),
  Controller: ({ render }: any) => render({ field: {}, fieldState: {} }),
}));



describe('TodoForm Component', () => {
  const mockTodo: Todo = {
    id: 1,
    ownerId: 'user_123',
    title: 'Existing Todo',
    message: 'Existing message',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render create form with empty fields', () => {
      // Arrange
      const { useTodoMutations } = require('@/hooks/useTodoMutations');
      const { useForm } = require('react-hook-form');

      useTodoMutations.mockReturnValue({
        createTodo: vi.fn(),
        updateTodo: vi.fn(),
        isCreating: false,
        isUpdating: false,
        error: null,
      });

      const mockFormMethods = {
        handleSubmit: vi.fn(),
        control: {},
        formState: { errors: {}, isSubmitting: false },
        reset: vi.fn(),
        setValue: vi.fn(),
      };
      useForm.mockReturnValue(mockFormMethods);

      // Act
      render(<TodoForm mode="create" onSuccess={vi.fn()} />);

      // Assert
      expect(screen.getByText('todo.create')).toBeInTheDocument();
      expect(screen.getByLabelText('todo.form.title')).toBeInTheDocument();
      expect(screen.getByLabelText('todo.form.message')).toBeInTheDocument();
      expect(screen.getByText('todo.form.create')).toBeInTheDocument();
    });

    it('should handle create form submission with valid data', async () => {
      // Arrange
      const { useTodoMutations } = require('@/hooks/useTodoMutations');
      const { useForm } = require('react-hook-form');
      const mockCreateTodo = vi.fn().mockResolvedValue({ success: true });
      const mockOnSuccess = vi.fn();

      useTodoMutations.mockReturnValue({
        createTodo: mockCreateTodo,
        updateTodo: vi.fn(),
        isCreating: false,
        isUpdating: false,
        error: null,
      });

      const mockFormMethods = {
        handleSubmit: vi.fn(callback => () => callback({ title: 'New Todo', message: 'New message' })),
        control: {},
        formState: { errors: {}, isSubmitting: false },
        reset: vi.fn(),
        setValue: vi.fn(),
      };
      useForm.mockReturnValue(mockFormMethods);

      render(<TodoForm mode="create" onSuccess={mockOnSuccess} />);

      // Act
      const submitButton = screen.getByText('todo.form.create');
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockCreateTodo).toHaveBeenCalledWith({
          title: 'New Todo',
          message: 'New message',
        });
      });
    });

    it('should show validation errors for empty fields', () => {
      // Arrange
      const { useTodoMutations } = require('@/hooks/useTodoMutations');
      const { useForm } = require('react-hook-form');

      useTodoMutations.mockReturnValue({
        createTodo: vi.fn(),
        updateTodo: vi.fn(),
        isCreating: false,
        isUpdating: false,
        error: null,
      });

      const mockFormMethods = {
        handleSubmit: vi.fn(),
        control: {},
        formState: {
          errors: {
            title: { message: 'Title is required' },
            message: { message: 'Message is required' },
          },
          isSubmitting: false,
        },
        reset: vi.fn(),
        setValue: vi.fn(),
      };
      useForm.mockReturnValue(mockFormMethods);

      // Act
      render(<TodoForm mode="create" onSuccess={vi.fn()} />);

      // Assert
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Message is required')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should render edit form with pre-filled data', () => {
      // Arrange
      const { useTodoMutations } = require('@/hooks/useTodoMutations');
      const { useForm } = require('react-hook-form');

      useTodoMutations.mockReturnValue({
        createTodo: vi.fn(),
        updateTodo: vi.fn(),
        isCreating: false,
        isUpdating: false,
        error: null,
      });

      const mockFormMethods = {
        handleSubmit: vi.fn(),
        control: {},
        formState: { errors: {}, isSubmitting: false },
        reset: vi.fn(),
        setValue: vi.fn(),
      };
      useForm.mockReturnValue(mockFormMethods);

      // Act
      render(<TodoForm mode="edit" todo={mockTodo} onSuccess={vi.fn()} />);

      // Assert
      expect(screen.getByText('todo.edit')).toBeInTheDocument();
      expect(screen.getByText('todo.form.update')).toBeInTheDocument();
      expect(mockFormMethods.setValue).toHaveBeenCalledWith('title', 'Existing Todo');
      expect(mockFormMethods.setValue).toHaveBeenCalledWith('message', 'Existing message');
    });

    it('should handle edit form submission with valid data', async () => {
      // Arrange
      const { useTodoMutations } = require('@/hooks/useTodoMutations');
      const { useForm } = require('react-hook-form');
      const mockUpdateTodo = vi.fn().mockResolvedValue({ success: true });
      const mockOnSuccess = vi.fn();

      useTodoMutations.mockReturnValue({
        createTodo: vi.fn(),
        updateTodo: mockUpdateTodo,
        isCreating: false,
        isUpdating: false,
        error: null,
      });

      const mockFormMethods = {
        handleSubmit: vi.fn(callback => () => callback({ title: 'Updated Todo', message: 'Updated message' })),
        control: {},
        formState: { errors: {}, isSubmitting: false },
        reset: vi.fn(),
        setValue: vi.fn(),
      };
      useForm.mockReturnValue(mockFormMethods);

      render(<TodoForm mode="edit" todo={mockTodo} onSuccess={mockOnSuccess} />);

      // Act
      const submitButton = screen.getByText('todo.form.update');
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockUpdateTodo).toHaveBeenCalledWith(mockTodo.id, {
          title: 'Updated Todo',
          message: 'Updated message',
        });
      });
    });

    it('should throw error when todo is missing in edit mode', () => {
      // Arrange
      const { useTodoMutations } = require('@/hooks/useTodoMutations');

      useTodoMutations.mockReturnValue({
        createTodo: vi.fn(),
        updateTodo: vi.fn(),
        isCreating: false,
        isUpdating: false,
        error: null,
      });

      // Act & Assert
      expect(() => {
        render(<TodoForm mode="edit" onSuccess={vi.fn()} />);
      }).toThrow('Todo is required for edit mode');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during creation', () => {
      // Arrange
      const { useTodoMutations } = require('@/hooks/useTodoMutations');
      const { useForm } = require('react-hook-form');

      useTodoMutations.mockReturnValue({
        createTodo: vi.fn(),
        updateTodo: vi.fn(),
        isCreating: true,
        isUpdating: false,
        error: null,
      });

      const mockFormMethods = {
        handleSubmit: vi.fn(),
        control: {},
        formState: { errors: {}, isSubmitting: true },
        reset: vi.fn(),
        setValue: vi.fn(),
      };
      useForm.mockReturnValue(mockFormMethods);

      // Act
      render(<TodoForm mode="create" onSuccess={vi.fn()} />);

      // Assert
      expect(screen.getByText('todo.form.creating')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show loading state during update', () => {
      // Arrange
      const { useTodoMutations } = require('@/hooks/useTodoMutations');
      const { useForm } = require('react-hook-form');

      useTodoMutations.mockReturnValue({
        createTodo: vi.fn(),
        updateTodo: vi.fn(),
        isCreating: false,
        isUpdating: true,
        error: null,
      });

      const mockFormMethods = {
        handleSubmit: vi.fn(),
        control: {},
        formState: { errors: {}, isSubmitting: true },
        reset: vi.fn(),
        setValue: vi.fn(),
      };
      useForm.mockReturnValue(mockFormMethods);

      // Act
      render(<TodoForm mode="edit" todo={mockTodo} onSuccess={vi.fn()} />);

      // Assert
      expect(screen.getByText('todo.form.updating')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when creation fails', () => {
      // Arrange
      const { useTodoMutations } = require('@/hooks/useTodoMutations');
      const { useForm } = require('react-hook-form');

      useTodoMutations.mockReturnValue({
        createTodo: vi.fn(),
        updateTodo: vi.fn(),
        isCreating: false,
        isUpdating: false,
        error: 'Failed to create todo',
      });

      const mockFormMethods = {
        handleSubmit: vi.fn(),
        control: {},
        formState: { errors: {}, isSubmitting: false },
        reset: vi.fn(),
        setValue: vi.fn(),
      };
      useForm.mockReturnValue(mockFormMethods);

      // Act
      render(<TodoForm mode="create" onSuccess={vi.fn()} />);

      // Assert
      expect(screen.getByText('error.createTodo')).toBeInTheDocument();
      expect(screen.getByText('Failed to create todo')).toBeInTheDocument();
    });
  });

  describe('Form Reset', () => {
    it('should reset form after successful creation', async () => {
      // Arrange
      const { useTodoMutations } = require('@/hooks/useTodoMutations');
      const { useForm } = require('react-hook-form');
      const mockCreateTodo = vi.fn().mockResolvedValue({ success: true });
      const mockReset = vi.fn();

      useTodoMutations.mockReturnValue({
        createTodo: mockCreateTodo,
        updateTodo: vi.fn(),
        isCreating: false,
        isUpdating: false,
        error: null,
      });

      const mockFormMethods = {
        handleSubmit: vi.fn(callback => async () => {
          await callback({ title: 'New Todo', message: 'New message' });
        }),
        control: {},
        formState: { errors: {}, isSubmitting: false },
        reset: mockReset,
        setValue: vi.fn(),
      };
      useForm.mockReturnValue(mockFormMethods);

      render(<TodoForm mode="create" onSuccess={vi.fn()} />);

      // Act
      const submitButton = screen.getByText('todo.form.create');
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and ARIA attributes', () => {
      // Arrange
      const { useTodoMutations } = require('@/hooks/useTodoMutations');
      const { useForm } = require('react-hook-form');

      useTodoMutations.mockReturnValue({
        createTodo: vi.fn(),
        updateTodo: vi.fn(),
        isCreating: false,
        isUpdating: false,
        error: null,
      });

      const mockFormMethods = {
        handleSubmit: vi.fn(),
        control: {},
        formState: { errors: {}, isSubmitting: false },
        reset: vi.fn(),
        setValue: vi.fn(),
      };
      useForm.mockReturnValue(mockFormMethods);

      // Act
      render(<TodoForm mode="create" onSuccess={vi.fn()} />);

      // Assert
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText('todo.form.title')).toBeRequired();
      expect(screen.getByLabelText('todo.form.message')).toBeRequired();
    });
  });
});
