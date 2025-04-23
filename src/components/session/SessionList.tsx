
import React from 'react';
import { formatDateTime, calculateDuration } from '@/lib/utils';
import { Session } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Pencil, Trash2 } from 'lucide-react';
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
import InterviewsList from './InterviewsList';

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
    <Card className="border shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Interviewer Code</TableHead>
              <TableHead>Start Date/Time</TableHead>
              <TableHead>End Date/Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Start Location</TableHead>
              <TableHead>End Location</TableHead>
              <TableHead>Interviews</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <React.Fragment key={session.id}>
                <TableRow className="hover:bg-gray-50">
                  <TableCell>{session.interviewer_id}</TableCell>
                  <TableCell>{formatDateTime(session.start_time)}</TableCell>
                  <TableCell>{session.end_time ? formatDateTime(session.end_time) : "-"}</TableCell>
                  <TableCell>{session.end_time ? calculateDuration(session.start_time, session.end_time) : "Ongoing"}</TableCell>
                  <TableCell>
                    {session.start_latitude && session.start_longitude ? (
                      <div className="flex items-center text-sm text-blue-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {session.start_latitude.toFixed(4)}, {session.start_longitude.toFixed(4)}
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    {session.end_latitude && session.end_longitude ? (
                      <div className="flex items-center text-sm text-blue-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {session.end_latitude.toFixed(4)}, {session.end_longitude.toFixed(4)}
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    {session.interviews?.length ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {session.interviews.length}
                      </span>
                    ) : (
                      "No interviews"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Session</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this session? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteSession(session.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
                {session.interviews && session.interviews.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0 border-t-0">
                      <InterviewsList sessions={[session]} refreshInterviews={() => {}} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SessionList;
