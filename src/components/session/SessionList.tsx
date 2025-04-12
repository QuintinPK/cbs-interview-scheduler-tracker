import React from "react";
import { Session } from "@/types";
import { formatDuration } from "@/lib/utils";

interface SessionListProps {
  sessions: Session[];
  loading: boolean;
}

const SessionList: React.FC<SessionListProps> = ({ sessions, loading }) => {
  return (
    <div>
      {/* Session list implementation */}
    </div>
  );
};

export default SessionList;
