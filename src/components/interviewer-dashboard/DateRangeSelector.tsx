
import React from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangeSelectorProps {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  dateRange,
  setDateRange
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
              </>
            ) : (
              format(dateRange.from, "LLL dd, y")
            )
          ) : (
            <span>All time</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={setDateRange}
          initialFocus
        />
        {dateRange?.from && (
          <div className="p-3 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
              Reset date filter
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
