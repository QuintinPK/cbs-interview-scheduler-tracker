
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle } from "lucide-react";

interface SessionInterviewsCountProps {
  count: number;
  isLoading: boolean;
  onToggleExpanded: () => void;
}

export const SessionInterviewsCount: React.FC<SessionInterviewsCountProps> = ({
  count,
  isLoading,
  onToggleExpanded,
}) => {
  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }
  
  if (count > 0) {
    return (
      <Badge 
        variant="purple" 
        className="flex items-center space-x-1 cursor-pointer"
        onClick={onToggleExpanded}
      >
        <MessageCircle className="h-3 w-3 mr-1" />
        <span>{count}</span>
      </Badge>
    );
  }
  
  return <span className="text-gray-400 text-sm">No interviews</span>;
};
