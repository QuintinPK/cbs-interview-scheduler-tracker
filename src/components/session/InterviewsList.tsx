import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatDateTime, calculateDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Interview } from "@/types";
import { MapPin, Clock, CheckCircle, XCircle, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CoordinatePopup from "../ui/CoordinatePopup";

interface InterviewsListProps {
  interviews: Interview[];
  refreshInterviews: () => Promise<void>;
}

const InterviewsList: React.FC<InterviewsListProps> = ({ interviews, refreshInterviews }) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<{
    result: string | null;
  }>({ result: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCoordinate, setSelectedCoordinate] = useState<{lat: number, lng: number} | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const getResultBadge = (result: string | null) => {
    if (!result) return null;
    
    if (result === 'response') {
      return (
        <Badge variant="success" className="flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          Response
        </Badge>
      );
    }
    
    return (
      <Badge variant="danger" className="flex items-center">
        <XCircle className="h-3 w-3 mr-1" />
        Non-response
      </Badge>
    );
  };

  const handleDeleteClick = (interview: Interview) => {
    setSelectedInterview(interview);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (interview: Interview) => {
    setSelectedInterview(interview);
    setEditingInterview({ result: interview.result });
    setEditDialogOpen(true);
  };
  
  const handleCoordinateClick = (lat: number | null, lng: number | null) => {
    if (lat !== null && lng !== null) {
      setSelectedCoordinate({ lat, lng });
      setIsMapOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!selectedInterview) return;
    
    try {
      setIsDeleting(true);
      const { error } = await (supabase as any)
        .from('interviews')
        .delete()
        .eq('id', selectedInterview.id);
        
      if (error) throw error;
      
      toast({
        title: "Interview Deleted",
        description: "The interview has been deleted successfully",
      });
      setDeleteDialogOpen(false);
      await refreshInterviews();
    } catch (error) {
      console.error("Error deleting interview:", error);
      toast({
        title: "Error",
        description: "Could not delete the interview",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedInterview) return;
    
    try {
      setIsSubmitting(true);
      const { error } = await (supabase as any)
        .from('interviews')
        .update({
          result: editingInterview.result
        })
        .eq('id', selectedInterview.id);
        
      if (error) throw error;
      
      toast({
        title: "Interview Updated",
        description: "The interview has been updated successfully",
      });
      setEditDialogOpen(false);
      await refreshInterviews();
    } catch (error) {
      console.error("Error updating interview:", error);
      toast({
        title: "Error",
        description: "Could not update the interview",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 pt-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Interview Details</CardTitle>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-1/6">Start Time</TableHead>
                <TableHead className="w-1/6">End Time</TableHead>
                <TableHead className="w-1/6">Duration</TableHead>
                <TableHead className="w-1/6">Start Location</TableHead>
                <TableHead className="w-1/6">End Location</TableHead>
                <TableHead className="w-1/8">Result</TableHead>
                <TableHead className="w-1/12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.map((interview) => (
                <TableRow key={interview.id} className="hover:bg-gray-100">
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-gray-500" />
                      {formatDateTime(interview.start_time)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {interview.end_time ? (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-gray-500" />
                        {formatDateTime(interview.end_time)}
                      </div>
                    ) : (
                      <Badge variant="warning">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {interview.end_time ? calculateDuration(interview.start_time, interview.end_time) : "Ongoing"}
                  </TableCell>
                  <TableCell>
                    {interview.start_latitude && interview.start_longitude ? (
                      <button 
                        className="flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => handleCoordinateClick(interview.start_latitude, interview.start_longitude)}
                        title={interview.start_address || ""}
                      >
                        <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                        <span className="text-xs truncate">
                          {interview.start_latitude.toFixed(4)}, {interview.start_longitude.toFixed(4)}
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs truncate">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {interview.end_latitude && interview.end_longitude ? (
                      <button 
                        className="flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => handleCoordinateClick(interview.end_latitude, interview.end_longitude)}
                        title={interview.end_address || ""}
                      >
                        <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                        <span className="text-xs truncate">
                          {interview.end_latitude.toFixed(4)}, {interview.end_longitude.toFixed(4)}
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs truncate">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {interview.is_active ? (
                      <Badge variant="warning">Active</Badge>
                    ) : (
                      getResultBadge(interview.result)
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(interview)}
                        disabled={interview.is_active}
                        className="h-7 w-7"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(interview)}
                        className="h-7 w-7 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Interview Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this interview? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Interview Result</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="result">Result</Label>
              <div className="flex gap-2">
                <Button
                  variant={editingInterview.result === 'response' ? 'default' : 'outline'}
                  className={editingInterview.result === 'response' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setEditingInterview({ ...editingInterview, result: 'response' })}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Response
                </Button>
                <Button
                  variant={editingInterview.result === 'non-response' ? 'default' : 'outline'}
                  className={editingInterview.result === 'non-response' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => setEditingInterview({ ...editingInterview, result: 'non-response' })}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Non-response
                </Button>
                <Button
                  variant={editingInterview.result === null ? 'default' : 'outline'}
                  onClick={() => setEditingInterview({ ...editingInterview, result: null })}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <CoordinatePopup
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)} 
        coordinate={selectedCoordinate ? {
          latitude: selectedCoordinate.lat,
          longitude: selectedCoordinate.lng
        } : null}
      />
    </>
  );
};

export default InterviewsList;
