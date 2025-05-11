
import React from "react";
import { Interviewer } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export interface InterviewerHeaderProps {
  interviewer: Interviewer;
  loading: boolean;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  lastRefreshTime?: Date | null;
}

export const InterviewerHeader = ({ 
  interviewer, 
  loading,
  onRefresh,
  isRefreshing = false,
  lastRefreshTime = null
}: InterviewerHeaderProps) => {
  if (loading) {
    return (
      <Card className="w-full h-24 bg-gray-100 animate-pulse" />
    );
  }

  return (
    <Card className="p-6 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-800">
              {interviewer.first_name} {interviewer.last_name}
            </h1>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
              {interviewer.code}
            </span>
          </div>
          <p className="text-gray-600">
            {interviewer.island} Island
          </p>
        </div>
        
        {onRefresh && (
          <div className="mt-4 sm:mt-0 flex flex-col items-end">
            <Button 
              onClick={onRefresh} 
              disabled={isRefreshing}
              variant="outline" 
              size="sm"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
            {lastRefreshTime && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
