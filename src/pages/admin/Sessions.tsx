import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import SessionFilters from "@/components/session/SessionFilters";
import { useSessions } from "@/hooks/useSessions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, StopCircle, Trash2 } from "lucide-react";
import SessionTotals from "@/components/session/SessionTotals";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import CoordinatePopup from "@/components/ui/CoordinatePopup";
import { Session, Island } from "@/types";
import { useInterviewers } from "@/hooks/useInterviewers";

const Sessions = () => {
  const navigate = useNavigate();
  const { interviewers } = useInterviewers();
  const {
    filteredSessions: sessions,
    loading,
    interviewerCodeFilter,
    setInterviewerCodeFilter,
    dateFilter,
    setDateFilter,
    islandFilter,
    setIslandFilter,
    projectFilter,
    setProjectFilter,
    getInterviewerCode,
    applyFilters,
    resetFilters,
    stopSession,
    deleteSession,
  } = useSessions();

  const [showStopDialog, setShowStopDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  const getInterviewerName = (id: string) => {
    const interviewer = interviewers.find((i) => i.id === id);
    return interviewer
      ? `${interviewer.first_name} ${interviewer.last_name}`
      : "Unknown";
  };

  const handleStopSession = (session: Session) => {
    setSelectedSession(session);
    setShowStopDialog(true);
  };

  const handleDeleteSession = (session: Session) => {
    setSelectedSession(session);
    setShowDeleteDialog(true);
  };

  const confirmStopSession = async () => {
    if (selectedSession) {
      await stopSession(selectedSession.id);
      setShowStopDialog(false);
    }
  };

  const confirmDeleteSession = async () => {
    if (selectedSession) {
      await deleteSession(selectedSession.id);
      setShowDeleteDialog(false);
    }
  };

  const handleViewInterviewer = (interviewerId: string) => {
    navigate(`/admin/interviewer/${interviewerId}`);
  };

  const handleViewCoordinates = (lat: number, lng: number, label: string) => {
    setCoordinates({ lat, lng, label });
    setShowModal(true);
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "In progress";

    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const duration = endTime - startTime;

    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Session History</h1>

        <SessionFilters
          interviewerCodeFilter={interviewerCodeFilter}
          setInterviewerCodeFilter={setInterviewerCodeFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          applyFilters={applyFilters}
          resetFilters={resetFilters}
          loading={loading}
          islandFilter={islandFilter}
          setIslandFilter={setIslandFilter}
          projectFilter={projectFilter}
          setProjectFilter={setProjectFilter}
        />

        <SessionTotals sessions={sessions} loading={loading} />

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Interviewer</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center"
                  >
                    Loading sessions...
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center"
                  >
                    No sessions found
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      <div>
                        <span className="font-semibold">
                          {getInterviewerCode(session.interviewer_id)}
                        </span>
                        <p className="text-sm text-muted-foreground">
                          {getInterviewerName(session.interviewer_id)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(session.start_time), "PPp")}
                    </TableCell>
                    <TableCell>
                      {session.end_time
                        ? format(new Date(session.end_time), "PPp")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {formatDuration(session.start_time, session.end_time)}
                    </TableCell>
                    <TableCell>
                      {session.start_latitude && session.start_longitude ? (
                        <Button
                          variant="ghost"
                          className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800 hover:bg-transparent"
                          onClick={() =>
                            handleViewCoordinates(
                              session.start_latitude as number,
                              session.start_longitude as number,
                              "Start Location"
                            )
                          }
                        >
                          View on map
                        </Button>
                      ) : (
                        "No location"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          session.is_active ? "default" : "secondary"
                        }
                      >
                        {session.is_active ? "Active" : "Completed"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {session.project_id ? session.project_id : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleViewInterviewer(
                                  session.interviewer_id
                                )
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Interviewer
                            </DropdownMenuItem>
                            {session.is_active && (
                              <DropdownMenuItem
                                onClick={() => handleStopSession(session)}
                              >
                                <StopCircle className="mr-2 h-4 w-4" />
                                Stop Session
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteSession(session)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog
        open={showStopDialog}
        onOpenChange={setShowStopDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to stop this session? This will mark it as
              completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStopSession}>
              Stop Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSession}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {coordinates && showModal && (
        <CoordinatePopup
          mapLat={coordinates.lat}
          mapLng={coordinates.lng}
          mapLabel={coordinates.label}
          onClose={() => setShowModal(false)}
        />
      )}
    </AdminLayout>
  );
};

export default Sessions;
