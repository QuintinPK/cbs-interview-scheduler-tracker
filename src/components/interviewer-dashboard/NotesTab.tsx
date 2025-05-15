
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NotesList } from "./notes/NotesList";
import { NoteDialog } from "./notes/NoteDialog";
import { useNotes } from "@/hooks/useNotes";
import { Note, Project } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface NotesTabProps {
  interviewerId: string;
  projects: Project[];
  getProjectName: (projectId: string | null | undefined) => string;
}

export const NotesTab: React.FC<NotesTabProps> = ({
  interviewerId,
  projects,
  getProjectName,
}) => {
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes(interviewerId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const { toast } = useToast();
  
  const handleAddNote = () => {
    setEditingNote(null);
    setDialogOpen(true);
  };
  
  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setDialogOpen(true);
  };
  
  const handleDeleteNote = async (note: Note) => {
    try {
      await deleteNote(note.id);
      toast({
        title: "Note deleted",
        description: "The note has been removed successfully."
      });
    } catch (error: any) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: `Failed to delete note: ${error?.message || "Unknown error"}`,
        variant: "destructive"
      });
    }
  };
  
  const handleSaveNote = async (note: Partial<Note>) => {
    try {
      setSaveInProgress(true);
      
      // Log the note data for debugging
      console.log("Saving note:", note);
      console.log("Current interviewer ID:", interviewerId);
      
      if (editingNote) {
        console.log("Updating existing note with ID:", editingNote.id);
        await updateNote(editingNote.id, note);
        toast({
          title: "Note updated",
          description: "The note has been updated successfully."
        });
      } else {
        console.log("Adding new note for interviewer:", interviewerId);
        await addNote({
          ...note,
          interviewer_id: interviewerId,
        });
        toast({
          title: "Note added",
          description: "The note has been added successfully."
        });
      }
      setDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: `Failed to save note: ${error?.message || "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      setSaveInProgress(false);
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Interviewer Notes</CardTitle>
          <Button onClick={handleAddNote} size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-1" /> Add Note
          </Button>
        </CardHeader>
        <CardContent>
          <NotesList 
            notes={notes}
            loading={loading}
            getProjectName={getProjectName}
            onEdit={handleEditNote}
            onDelete={handleDeleteNote}
          />
        </CardContent>
      </Card>
      
      <NoteDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!saveInProgress) {
            setDialogOpen(open);
          }
        }}
        note={editingNote}
        projects={projects}
        onSave={handleSaveNote}
      />
    </>
  );
};
