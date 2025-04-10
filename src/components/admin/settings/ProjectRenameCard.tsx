
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const ProjectRenameCard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    const fetchProjectTitle = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'project_title')
          .maybeSingle();

        if (!error && data && data.value) {
          let title = "";
          
          // Handle potential different formats of the stored value
          if (typeof data.value === 'string') {
            title = data.value;
          } else if (typeof data.value === 'object') {
            title = data.value.title || "CBS Interviewer Tracker";
          }
          
          setProjectTitle(title);
          setNewTitle(title);
        } else {
          // Default title if none is set
          setProjectTitle("CBS Interviewer Tracker");
          setNewTitle("CBS Interviewer Tracker");
        }
      } catch (error) {
        console.error("Error fetching project title:", error);
        // Set default if fetch fails
        setProjectTitle("CBS Interviewer Tracker");
        setNewTitle("CBS Interviewer Tracker");
      }
    };

    fetchProjectTitle();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTitle.trim()) {
      toast({
        title: "Error",
        description: "Project title cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Update project title in database
      const { error } = await supabase.functions.invoke('admin-functions', {
        body: {
          action: "updateProjectTitle",
          data: {
            title: newTitle.trim()
          }
        }
      });
      
      if (error) throw error;
      
      setProjectTitle(newTitle.trim());
      
      toast({
        title: "Success",
        description: "Project title has been updated",
      });
    } catch (error) {
      console.error("Error updating project title:", error);
      toast({
        title: "Error",
        description: "Failed to update project title",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Information</CardTitle>
        <CardDescription>
          Update your project's display name
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-title">Project Title</Label>
            <Input
              id="project-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter project title"
            />
            <p className="text-sm text-muted-foreground">
              Current title: {projectTitle}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            disabled={isLoading || newTitle.trim() === projectTitle}
          >
            {isLoading ? "Updating..." : "Update Title"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ProjectRenameCard;
