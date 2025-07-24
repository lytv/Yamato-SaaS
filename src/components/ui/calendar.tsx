import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

// Hàm cn: nối className tiện dụng
function cn(...args: (string | undefined | false | null)[]) {
  return args.filter(Boolean).join(' ');
}

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('p-3', className)}>
        <DayPicker
          className="bg-white rounded-md shadow border"
          showOutsideDays
          {...props}
        />
      </div>
    );
  }
);

Calendar.displayName = 'Calendar';

export { cn }; 