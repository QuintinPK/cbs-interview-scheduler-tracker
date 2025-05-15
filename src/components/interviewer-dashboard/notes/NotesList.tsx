
import React, { useState } from "react";
import { Note } from "@/types";
import { format } from "date-fns";
import { Edit, Trash2, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface NotesListProps {
  notes: Note[];
  loading: boolean;
  getProjectName: (projectId: string | null | undefined) => string;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  loading,
  getProjectName,
  onEdit,
  onDelete,
}) => {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  
  // Get unique project IDs for filtering
  const projectIds = Array.from(new Set(
    notes.map(note => note.project_id || "none")
  ));
  
  // Filter and sort notes
  const filteredNotes = notes
    .filter(note => {
      if (projectFilter === "all") return true;
      if (projectFilter === "none") return !note.project_id;
      return note.project_id === projectFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No notes yet</h3>
        <p className="text-muted-foreground">
          Add your first note using the button above
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-2 mb-4">
        <div className="flex-1">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="none">No Project</SelectItem>
              {projectIds
                .filter(id => id !== "none")
                .map(projectId => (
                  <SelectItem key={projectId} value={projectId}>
                    {getProjectName(projectId)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "newest" | "oldest")}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredNotes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No notes match your filter criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map(note => (
            <Card key={note.id} className="overflow-hidden border border-muted">
              <CardHeader className="bg-muted/30 pb-2">
                <CardTitle className="text-base">
                  {note.title || "Untitled Note"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="whitespace-pre-wrap">{note.content}</p>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm py-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className="text-xs">
                      {format(new Date(note.created_at), "PPP")}
                    </span>
                  </div>
                  
                  {note.project_id && (
                    <Badge variant="outline" className="bg-background">
                      {getProjectName(note.project_id)}
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => onEdit(note)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    onClick={() => onDelete(note)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
