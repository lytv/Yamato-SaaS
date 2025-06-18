import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MultiAssignProgress } from '@/features/productionStep/MultiAssignProgress';

describe('MultiAssignProgress', () => {
  it('shows progress bar and chunk status', () => {
    render(
      <MultiAssignProgress
        total={100}
        created={20}
        skipped={10}
        failed={0}
        currentChunk={2}
        totalChunks={4}
        status="processing"
      />
    );
    expect(screen.getByText(/chunk/i)).toHaveTextContent('Chunk 2 / 4');
    expect(screen.getByText(/tạo mới/i)).toHaveTextContent('20');
    expect(screen.getByText(/bỏ qua/i)).toHaveTextContent('10');
    expect(screen.getByText(/lỗi/i)).toHaveTextContent('0');
    expect(screen.getByText(/50%/i)).toBeInTheDocument();
  });

  it('shows done summary', () => {
    render(
      <MultiAssignProgress
        total={10}
        created={8}
        skipped={2}
        failed={0}
        currentChunk={4}
        totalChunks={4}
        status="done"
      />
    );
    expect(screen.getByText(/đã hoàn thành bulk assign/i)).toBeInTheDocument();
    expect(screen.getByText(/tổng:/i)).toHaveTextContent('10');
    expect(screen.getByText(/tạo mới:/i)).toHaveTextContent('8');
    expect(screen.getByText(/bỏ qua:/i)).toHaveTextContent('2');
    expect(screen.getByText(/lỗi:/i)).toHaveTextContent('0');
  });

  it('shows error summary', () => {
    render(
      <MultiAssignProgress
        total={10}
        created={5}
        skipped={2}
        failed={3}
        currentChunk={4}
        totalChunks={4}
        status="error"
      />
    );
    expect(screen.getByText(/đã xảy ra lỗi/i)).toBeInTheDocument();
  });
}); 