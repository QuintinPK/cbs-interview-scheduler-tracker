
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const useNotes = (interviewerId: string) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Load notes when the component mounts
  useEffect(() => {
    const loadNotes = async () => {
      if (!interviewerId) {
        setNotes([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('interviewer_notes')
          .select('*')
          .eq('interviewer_id', interviewerId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setNotes(data || []);
      } catch (error) {
        console.error("Error loading notes:", error);
        toast({
          title: "Error",
          description: "Could not load interviewer notes",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadNotes();
  }, [interviewerId, toast]);
  
  // Add a new note
  const addNote = async (note: Partial<Note>): Promise<Note> => {
    try {
      // Ensure required fields are present
      if (!note.content) {
        throw new Error("Note content is required");
      }
      
      // Make sure interviewer_id is included and set
      const noteToInsert = {
        interviewer_id: interviewerId,
        content: note.content,
        title: note.title || null,
        project_id: note.project_id || null,
        created_by: "admin" // You can change this to the current user's username or ID
      };
      
      console.log("Adding note:", noteToInsert);
      
      const { data, error } = await supabase
        .from('interviewer_notes')
        .insert(noteToInsert)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase error adding note:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error("No data returned after inserting note");
      }
      
      console.log("Note added successfully:", data);
      setNotes(prevNotes => [data, ...prevNotes]);
      return data;
    } catch (error) {
      console.error("Error adding note:", error);
      throw error;
    }
  };
  
  // Update an existing note
  const updateNote = async (id: string, updates: Partial<Note>): Promise<Note> => {
    try {
      // Ensure we're not trying to update the interviewer_id
      const { interviewer_id, ...updateData } = updates;
      
      const noteUpdates = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };
      
      console.log("Updating note:", id, noteUpdates);
      
      const { data, error } = await supabase
        .from('interviewer_notes')
        .update(noteUpdates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase error updating note:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error("No data returned after updating note");
      }
      
      console.log("Note updated successfully:", data);
      setNotes(notes.map(note => note.id === id ? data : note));
      return data;
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  };
  
  // Delete a note
  const deleteNote = async (id: string): Promise<void> => {
    try {
      console.log("Deleting note:", id);
      
      const { error } = await supabase
        .from('interviewer_notes')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Supabase error deleting note:", error);
        throw error;
      }
      
      console.log("Note deleted successfully");
      setNotes(notes.filter(note => note.id !== id));
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  };
  
  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote
  };
};
