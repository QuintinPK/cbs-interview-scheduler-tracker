
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import GlobalFilter from "@/components/GlobalFilter";

interface SessionFiltersProps {
  interviewerCodeFilter: string;
  setInterviewerCodeFilter: (value: string) => void;
  dateFilter: Date | undefined;
  setDateFilter: (date: Date | undefined) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  loading: boolean;
}

const SessionFilters: React.FC<SessionFiltersProps> = ({
  interviewerCodeFilter,
  setInterviewerCodeFilter,
  dateFilter,
  setDateFilter,
  applyFilters,
  resetFilters,
  loading
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h2 className="font-semibold mb-4">Global Filters</h2>
        <GlobalFilter />
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h2 className="font-semibold mb-4">Session Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="interviewer-filter">Interviewer Code</Label>
            <Input
              id="interviewer-filter"
              placeholder="Filter by interviewer code"
              value={interviewerCodeFilter}
              onChange={(e) => setInterviewerCodeFilter(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFilter && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 pointer-events-auto">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-end gap-2">
            <Button 
              onClick={resetFilters} 
              variant="outline"
              disabled={loading}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionFilters;
