import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiAssignConfigForm, MultiAssignConfig } from '@/features/productionStep/MultiAssignConfigForm';

describe('MultiAssignConfigForm', () => {
  it('renders all fields', () => {
    render(<MultiAssignConfigForm onChange={() => {}} />);
    expect(screen.getByLabelText(/bắt đầu thứ tự/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tự động tăng/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/giá xưởng/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/giá tính toán/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/giới hạn SL 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/giới hạn SL 2/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/là công đoạn cuối/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/là công đoạn vật tư/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/là công đoạn lưu kho/i)).toBeInTheDocument();
  });

  it('calls onChange with updated values', () => {
    const handleChange = vi.fn();
    render(<MultiAssignConfigForm onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText(/bắt đầu thứ tự/i), { target: { value: '5' } });
    fireEvent.click(screen.getByLabelText(/tự động tăng/i));
    fireEvent.change(screen.getByLabelText(/giá xưởng/i), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText(/giá tính toán/i), { target: { value: '2000' } });
    fireEvent.change(screen.getByLabelText(/giới hạn SL 1/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/giới hạn SL 2/i), { target: { value: '20' } });
    fireEvent.click(screen.getByLabelText(/là công đoạn cuối/i));
    fireEvent.click(screen.getByLabelText(/là công đoạn vật tư/i));
    fireEvent.click(screen.getByLabelText(/là công đoạn lưu kho/i));
    // onChange is called many times, check last call
    expect(handleChange.mock.calls.length).toBeGreaterThan(0);
    const last = handleChange.mock.calls.at(-1)?.[0] as MultiAssignConfig;
    expect(last.sequenceStart).toBe(5);
    expect(last.autoIncrement).toBe(false);
    expect(last.factoryPrice).toBe('1000');
    expect(last.calculatedPrice).toBe('2000');
    expect(last.quantityLimit1).toBe(10);
    expect(last.quantityLimit2).toBe(20);
    expect(last.isFinalStep).toBe(true);
    expect(last.isVtStep).toBe(true);
    expect(last.isParkingStep).toBe(true);
  });
}); 