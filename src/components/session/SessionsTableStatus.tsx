
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface SessionsTableStatusProps {
  loading: boolean;
  isEmpty: boolean;
  colSpan: number;
}

export const SessionsTableStatus: React.FC<SessionsTableStatusProps> = ({
  loading,
  isEmpty,
  colSpan,
}) => {
  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="text-center py-10">
          <div className="flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-cbs" />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (isEmpty) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="text-center py-6 text-muted-foreground">
          No sessions found
        </TableCell>
      </TableRow>
    );
  }

  return null;
};
