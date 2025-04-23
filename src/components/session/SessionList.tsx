import React from 'react';
import { formatDateTime, calculateDuration } from '@/lib/utils';
import { Session } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  StopCircle, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SessionListProps {
  sessions: Session[];
  onStopSession: (session: Session) => Promise<boolean>;
  onDeleteSession: (sessionId: string) => Promise<boolean>;
}

const SessionList: React.FC<SessionListProps> = ({ 
  sessions,
  onStopSession,
  onDeleteSession
}) => {
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[150px]">Start Time</TableHead>
              <TableHead className="w-[150px]">End Time</TableHead>
              <TableHead className="w-[120px]">Duration</TableHead>
              <TableHead>Interviewer</TableHead>
              <TableHead>Start Location</TableHead>
              <TableHead>End Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id} className="hover:bg-gray-100">
                <TableCell>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1.5 text-gray-500" />
                    {formatDateTime(session.start_time)}
                  </div>
                </TableCell>
                <TableCell>
                  {session.end_time ? (
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1.5 text-gray-500" />
                      {formatDateTime(session.end_time)}
                    </div>
                  ) : (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </TableCell>
                <TableCell>{session.end_time ? calculateDuration(session.start_time, session.end_time) : "Ongoing"}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1.5 text-gray-500" />
                    {session.interviewer_id}
                  </div>
                </TableCell>
                <TableCell>
                  {session.start_latitude && session.start_longitude ? (
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1.5 text-gray-500" />
                      {session.start_latitude.toFixed(4)}, {session.start_longitude.toFixed(4)}
                    </div>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>
                  {session.end_latitude && session.end_longitude ? (
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1.5 text-gray-500" />
                      {session.end_latitude.toFixed(4)}, {session.end_longitude.toFixed(4)}
                    </div>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!session.is_active ? null : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onStopSession(session)}
                      >
                        <StopCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete
                            the session from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteSession(session.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SessionList;
