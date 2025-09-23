import 'react-day-picker/dist/style.css';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';

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
          className="rounded-md border bg-white shadow"
          showOutsideDays
          {...props}
        />
      </div>
    );
  },
);

Calendar.displayName = 'Calendar';

export { cn };
