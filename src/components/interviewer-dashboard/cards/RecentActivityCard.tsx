
import React from "react";
import { Session } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Calendar, Activity, MapPin } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RecentActivityCardProps {
  sessions: Session[];
  onViewLocation: (session: Session) => void;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  sessions,
  onViewLocation,
}) => {
  return (
    <div className="bg-card shadow-sm rounded-lg p-4 border border-border/50 transition-all hover:shadow-md">
      <h3 className="font-medium flex items-center text-primary mb-2">
        <Calendar className="h-4 w-4 mr-2 opacity-70" />
        Recent Activity
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-1 cursor-help">
                <Activity className="h-3 w-3 text-muted-foreground/70" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-xs">The most recent time the interviewer was active in the field. This provides a quick reference for when they last conducted work.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h3>
      {sessions.length > 0 ? (
        <div className="text-muted-foreground">
          <p>Last active: {formatDateTime(sessions[0].start_time)}</p>
          {sessions[0].start_latitude && sessions[0].start_longitude && (
            <button 
              className="flex items-center text-xs mt-1 text-blue-600 hover:text-blue-800 hover:underline"
              onClick={() => onViewLocation(sessions[0])}
            >
              <MapPin className="h-3 w-3 mr-1" />
              View location
            </button>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">No activity recorded yet</p>
      )}
    </div>
  );
};
