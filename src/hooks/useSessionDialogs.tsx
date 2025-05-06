
import { useState } from "react";
import { Session } from "@/types";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSessionDialogs = () => {
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);
  const [editEndTime, setEditEndTime] = useState("");
  const [editLocation, setEditLocation] = useState({
    latitude: "",
    longitude: "",
  });
  
  const handleEdit = (session: Session) => {
    setSelectedSession(session);
    
    if (session.end_time) {
      setEditEndDate(new Date(session.end_time));
      setEditEndTime(format(new Date(session.end_time), "HH:mm"));
    } else {
      setEditEndDate(new Date());
      setEditEndTime(format(new Date(), "HH:mm"));
    }
    
    if (session.end_latitude && session.end_longitude) {
      setEditLocation({
        latitude: session.end_latitude.toString(),
        longitude: session.end_longitude.toString(),
      });
    } else {
      setEditLocation({ latitude: "", longitude: "" });
    }
    
    setShowEditDialog(true);
  };
  
  const handleDelete = (session: Session) => {
    setSelectedSession(session);
    setShowDeleteDialog(true);
  };
  
  const confirmEdit = async () => {
    if (!selectedSession || !editEndDate) return;
    
    try {
      setSubmitting(true);
      
      const [hours, minutes] = editEndTime.split(':').map(Number);
      const endDateTime = new Date(editEndDate);
      endDateTime.setHours(hours, minutes);
      
      const { error } = await supabase
        .from('sessions')
        .update({
          end_time: endDateTime.toISOString(),
          end_latitude: editLocation.latitude ? parseFloat(editLocation.latitude) : null,
          end_longitude: editLocation.longitude ? parseFloat(editLocation.longitude) : null,
          is_active: false
        })
        .eq('id', selectedSession.id);
        
      if (error) throw error;
      
      toast({
        title: "Session Updated",
        description: "Session has been updated successfully.",
      });
      setShowEditDialog(false);
      return true;
    } catch (error) {
      console.error("Error updating session:", error);
      toast({
        title: "Error",
        description: "Could not update session",
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };
  
  const confirmDelete = async () => {
    if (!selectedSession) return;
    
    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', selectedSession.id);
        
      if (error) throw error;
      
      toast({
        title: "Session Deleted",
        description: "Session has been deleted successfully.",
      });
      setShowDeleteDialog(false);
      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Could not delete session",
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    selectedSession,
    showEditDialog,
    setShowEditDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    submitting,
    editEndDate,
    setEditEndDate,
    editEndTime,
    setEditEndTime,
    editLocation,
    setEditLocation,
    handleEdit,
    handleDelete,
    confirmEdit,
    confirmDelete
  };
};

export default useSessionDialogs;
