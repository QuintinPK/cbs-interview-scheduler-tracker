import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { Project } from "@/types";

type DeleteDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  password: string;
  setPassword: (password: string) => void;
  isLoading: boolean;
  error: string | null;
};

const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  password,
  setPassword,
  isLoading,
  error
}: DeleteDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}<br /><br />
            <strong className="text-destructive">This action cannot be undone.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="admin-password">Confirm with Admin Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="text-red-500"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading || !password}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const DeleteDataCard = () => {
  const { toast } = useToast();
  const { verifyPassword } = useAuth();
  const { projects } = useProjects();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isInterviewerDialogOpen, setIsInterviewerDialogOpen] = useState(false);
  const [isProjectDataDialogOpen, setIsProjectDataDialogOpen] = useState(false);

  const handleDeleteSessions = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const isValid = await verifyPassword(password);
      
      if (!isValid) {
        setError("Invalid password");
        return;
      }
      
      const { error: functionError } = await supabase.functions.invoke('admin-functions', {
        body: {
          action: "deleteAllSessionData"
        }
      });
      
      if (functionError) throw functionError;
      
      toast({
        title: "Success",
        description: "All session and interview data has been deleted",
      });
      
      setIsSessionDialogOpen(false);
      setPassword("");
    } catch (error) {
      console.error("Error deleting session data:", error);
      toast({
        title: "Error",
        description: "Failed to delete session data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInterviewers = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const isValid = await verifyPassword(password);
      
      if (!isValid) {
        setError("Invalid password");
        return;
      }
      
      const { error: functionError } = await supabase.functions.invoke('admin-functions', {
        body: {
          action: "deleteAllInterviewerData"
        }
      });
      
      if (functionError) throw functionError;
      
      toast({
        title: "Success",
        description: "All interviewer data has been deleted",
      });
      
      setIsInterviewerDialogOpen(false);
      setPassword("");
    } catch (error) {
      console.error("Error deleting interviewer data:", error);
      toast({
        title: "Error",
        description: "Failed to delete interviewer data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProjectData = async () => {
    if (!password || !selectedProject) {
      setError("Password and project selection are required");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const isValid = await verifyPassword(password);
      
      if (!isValid) {
        setError("Invalid password");
        return;
      }
      
      const { error: functionError } = await supabase.functions.invoke('admin-functions', {
        body: {
          action: "deleteProjectData",
          data: {
            projectId: selectedProject.id
          }
        }
      });
      
      if (functionError) throw functionError;
      
      toast({
        title: "Success",
        description: `All data for project "${selectedProject.name}" has been deleted`,
      });
      
      setIsProjectDataDialogOpen(false);
      setPassword("");
      setSelectedProject(null);
    } catch (error) {
      console.error("Error deleting project data:", error);
      toast({
        title: "Error",
        description: "Failed to delete project data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Manage your project data. These actions cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Session Data</h3>
                <p className="text-sm text-muted-foreground">
                  Delete all session logs and interview data.
                </p>
              </div>
              <Button 
                variant="destructive"
                size="sm"
                onClick={() => {
                  setError(null);
                  setPassword("");
                  setIsSessionDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Interviewer Data</h3>
                <p className="text-sm text-muted-foreground">
                  Delete all interviewer information and related data.
                </p>
              </div>
              <Button 
                variant="destructive"
                size="sm"
                onClick={() => {
                  setError(null);
                  setPassword("");
                  setIsInterviewerDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <h3 className="text-lg font-medium">Project Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Delete session and interview data for specific projects.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <div 
                    key={project.id}
                    className="border rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-medium">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.start_date} - {project.end_date}
                      </p>
                    </div>
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setError(null);
                        setPassword("");
                        setSelectedProject(project);
                        setIsProjectDataDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        isOpen={isSessionDialogOpen}
        onClose={() => setIsSessionDialogOpen(false)}
        onConfirm={handleDeleteSessions}
        title="Delete Session Data"
        description="This will permanently delete all session logs and interview data from the system."
        password={password}
        setPassword={setPassword}
        isLoading={isLoading}
        error={error}
      />

      <DeleteConfirmDialog
        isOpen={isInterviewerDialogOpen}
        onClose={() => setIsInterviewerDialogOpen(false)}
        onConfirm={handleDeleteInterviewers}
        title="Delete Interviewer Data"
        description="This will permanently delete all interviewer information and related data from the system."
        password={password}
        setPassword={setPassword}
        isLoading={isLoading}
        error={error}
      />

      <DeleteConfirmDialog
        isOpen={isProjectDataDialogOpen}
        onClose={() => {
          setIsProjectDataDialogOpen(false);
          setSelectedProject(null);
        }}
        onConfirm={handleDeleteProjectData}
        title={`Delete Project Data: ${selectedProject?.name}`}
        description={`This will permanently delete all session logs and interview data associated with the project "${selectedProject?.name}". This action cannot be undone.`}
        password={password}
        setPassword={setPassword}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
};

export default DeleteDataCard;
