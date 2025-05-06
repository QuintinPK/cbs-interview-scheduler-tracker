
import { useState } from "react";
import { Interview } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

export const useInterviewManagement = (refreshInterviews: () => Promise<void>) => {
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

  return {
    selectedInterview,
    isDeleting,
    deleteDialogOpen,
    setDeleteDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    editingInterview,
    setEditingInterview,
    isSubmitting,
    selectedCoordinate,
    isMapOpen,
    setIsMapOpen,
    getResultBadge,
    handleDeleteClick,
    handleEditClick,
    handleCoordinateClick,
    confirmDelete,
    handleSaveEdit
  };
};

export default useInterviewManagement;
