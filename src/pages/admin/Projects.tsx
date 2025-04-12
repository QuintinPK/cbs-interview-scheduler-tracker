
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { CalendarIcon, MapPin, PlusCircle, Pencil, Trash2, Users, CheckIcon, Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useInterviewers } from "@/hooks/useInterviewers";
import { Island, Project, Interviewer } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import IslandSelector from "@/components/projects/IslandSelector";
import ProjectDialog from "@/components/projects/ProjectDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Projects = () => {
  const { toast } = useToast();
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null);
  const { projects, loading, addProject, updateProject, deleteProject, assignInterviewerToProject, removeInterviewerFromProject, getProjectInterviewers } = useProjects(selectedIsland);
  const { interviewers, loading: interviewersLoading } = useInterviewers();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [projectInterviewers, setProjectInterviewers] = useState<Record<string, Interviewer[]>>({});
  const [loadingInterviewers, setLoadingInterviewers] = useState<Record<string, boolean>>({});
  
  // Fetch interviewers for each project
  useEffect(() => {
    const fetchProjectInterviewers = async () => {
      const newLoadingState = { ...loadingInterviewers };
      
      for (const project of projects) {
        if (!projectInterviewers[project.id]) {
          newLoadingState[project.id] = true;
          setLoadingInterviewers(newLoadingState);
          
          const interviewers = await getProjectInterviewers(project.id);
          
          setProjectInterviewers(prev => ({
            ...prev,
            [project.id]: interviewers
          }));
          
          newLoadingState[project.id] = false;
          setLoadingInterviewers(newLoadingState);
        }
      }
    };
    
    if (projects.length > 0) {
      fetchProjectInterviewers();
    }
  }, [projects]);
  
  const handleAddProject = async (project: Omit<Project, 'id' | 'created_at'>) => {
    return await addProject(project);
  };
  
  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowEditDialog(true);
  };
  
  const handleUpdateProject = async (projectData: Omit<Project, 'id' | 'created_at'>) => {
    if (!selectedProject) return false;
    return await updateProject(selectedProject.id, projectData);
  };
  
  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedProject) return;
    
    setIsSubmitting(true);
    const success = await deleteProject(selectedProject.id);
    setIsSubmitting(false);
    
    if (success) {
      setShowDeleteDialog(false);
    }
  };
  
  const handleAssignInterviewers = (project: Project) => {
    setSelectedProject(project);
    setShowAssignDialog(true);
  };
  
  const handleAssignInterviewer = async (interviewerId: string) => {
    if (!selectedProject) return;
    
    const isAlreadyAssigned = projectInterviewers[selectedProject.id]?.some(
      interviewer => interviewer.id === interviewerId
    );
    
    if (isAlreadyAssigned) {
      await removeInterviewerFromProject(selectedProject.id, interviewerId);
    } else {
      await assignInterviewerToProject(selectedProject.id, interviewerId);
    }
    
    // Refresh project interviewers
    const updatedInterviewers = await getProjectInterviewers(selectedProject.id);
    setProjectInterviewers(prev => ({
      ...prev,
      [selectedProject.id]: updatedInterviewers
    }));
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-cbs hover:bg-cbs-light flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Add New Project
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <IslandSelector
            selectedIsland={selectedIsland}
            onIslandChange={setSelectedIsland}
            loading={loading}
          />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Island</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Interviewers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-cbs" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    {selectedIsland ? `No projects found for ${selectedIsland}` : "No projects found"}
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center w-fit">
                        <MapPin className="h-3 w-3 mr-1" />
                        {project.island}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1 text-gray-500" />
                        <span className="text-sm">
                          {format(parseISO(project.start_date), "MMM d, yyyy")} - {format(parseISO(project.end_date), "MMM d, yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {loadingInterviewers[project.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : projectInterviewers[project.id]?.length ? (
                        <div className="flex items-center">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {projectInterviewers[project.id]?.length}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs ml-2 h-7"
                            onClick={() => handleAssignInterviewers(project)}
                          >
                            Manage
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleAssignInterviewers(project)}
                        >
                          Assign Interviewers
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProject(project)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(project)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Add Project Dialog */}
      <ProjectDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={handleAddProject}
        isEditing={false}
        title="Add New Project"
      />
      
      {/* Edit Project Dialog */}
      <ProjectDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSubmit={handleUpdateProject}
        isEditing={true}
        selectedProject={selectedProject}
        title="Edit Project"
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete the project "{selectedProject?.name}"?</p>
            <p className="text-sm text-muted-foreground mt-2">
              This will remove the project and all its assignments. This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assign Interviewers Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Interviewers to {selectedProject?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Manage Interviewers
                  <Users className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start" side="bottom">
                <Command>
                  <CommandInput placeholder="Search interviewers..." />
                  <CommandList>
                    <CommandEmpty>No interviewers found</CommandEmpty>
                    <CommandGroup heading="Interviewers">
                      {interviewers.map((interviewer) => {
                        const isAssigned = projectInterviewers[selectedProject?.id || ""]?.some(
                          i => i.id === interviewer.id
                        );
                        
                        return (
                          <CommandItem
                            key={interviewer.id}
                            onSelect={() => handleAssignInterviewer(interviewer.id)}
                            className="flex items-center justify-between"
                          >
                            <span>{interviewer.code} - {interviewer.first_name} {interviewer.last_name}</span>
                            {isAssigned && <CheckIcon className="h-4 w-4 text-green-600" />}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Currently Assigned:</h3>
              {loadingInterviewers[selectedProject?.id || ""] ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : projectInterviewers[selectedProject?.id || ""]?.length > 0 ? (
                <div className="space-y-1">
                  {projectInterviewers[selectedProject?.id || ""]?.map((interviewer) => (
                    <div key={interviewer.id} className="flex items-center justify-between bg-muted p-2 rounded-md">
                      <span>{interviewer.code} - {interviewer.first_name} {interviewer.last_name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAssignInterviewer(interviewer.id)}
                        className="h-6 w-6 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No interviewers assigned to this project yet.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAssignDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Projects;
