
import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Project, Interviewer } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlusCircle, Loader2, Search, Calendar, MapPin, Users } from "lucide-react";
import { format, parse } from "date-fns";
import { useProjects } from "@/hooks/useProjects";
import { useInterviewers } from "@/hooks/useInterviewers";
import IslandSelector from "@/components/ui/IslandSelector";
import ProjectList from "@/components/project/ProjectList";
import ProjectForm from "@/components/project/ProjectForm";

const Projects = () => {
  const { projects, loading, addProject, updateProject, deleteProject, 
    getProjectInterviewers, assignInterviewerToProject, removeInterviewerFromProject } = useProjects();
  const { interviewers, loading: interviewersLoading } = useInterviewers();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedIsland, setSelectedIsland] = useState<'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined>(undefined);
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projectInterviewers, setProjectInterviewers] = useState<Interviewer[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    island: "Bonaire" as 'Bonaire' | 'Saba' | 'Sint Eustatius'
  });
  
  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = project.name.toLowerCase().includes(query) || 
                          project.island.toLowerCase().includes(query);
    const matchesIsland = !selectedIsland || project.island === selectedIsland;
    return matchesSearch && matchesIsland;
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleDateChange = (name: 'start_date' | 'end_date', value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleIslandChange = (island: 'Bonaire' | 'Saba' | 'Sint Eustatius') => {
    setFormData({
      ...formData,
      island,
    });
  };
  
  const handleFilterIslandChange = (island: 'Bonaire' | 'Saba' | 'Sint Eustatius') => {
    setSelectedIsland(island);
  };
  
  const handleAddNew = () => {
    setIsEditing(false);
    setSelectedProject(null);
    const today = new Date();
    setFormData({
      name: "",
      start_date: format(today, 'yyyy-MM-dd'),
      end_date: format(today, 'yyyy-MM-dd'),
      island: "Bonaire"
    });
    setShowAddEditDialog(true);
  };
  
  const handleEdit = (project: Project) => {
    setIsEditing(true);
    setSelectedProject(project);
    setFormData({
      name: project.name,
      start_date: project.start_date,
      end_date: project.end_date,
      island: project.island as 'Bonaire' | 'Saba' | 'Sint Eustatius'
    });
    setShowAddEditDialog(true);
  };
  
  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteDialog(true);
  };
  
  const handleAssign = async (project: Project) => {
    setSelectedProject(project);
    
    try {
      const interviewers = await getProjectInterviewers(project.id);
      setProjectInterviewers(interviewers);
      setShowAssignDialog(true);
    } catch (error) {
      console.error("Error getting project interviewers:", error);
    }
  };
  
  const handleSubmit = async () => {
    if (!formData.name || !formData.start_date || !formData.end_date || !formData.island) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (isEditing && selectedProject) {
        await updateProject(selectedProject.id, formData);
      } else {
        await addProject(formData);
      }
      
      setShowAddEditDialog(false);
    } catch (error) {
      console.error("Error saving project:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const confirmDelete = async () => {
    if (!selectedProject) return;
    
    try {
      setSubmitting(true);
      await deleteProject(selectedProject.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleAssignInterviewer = async (interviewerId: string) => {
    if (!selectedProject) return;
    
    try {
      setSubmitting(true);
      await assignInterviewerToProject(selectedProject.id, interviewerId);
      
      // Refresh the list of interviewers for this project
      const updatedInterviewers = await getProjectInterviewers(selectedProject.id);
      setProjectInterviewers(updatedInterviewers);
    } catch (error) {
      console.error("Error assigning interviewer:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleRemoveInterviewer = async (interviewerId: string) => {
    if (!selectedProject) return;
    
    try {
      setSubmitting(true);
      await removeInterviewerFromProject(selectedProject.id, interviewerId);
      
      // Refresh the list of interviewers for this project
      const updatedInterviewers = await getProjectInterviewers(selectedProject.id);
      setProjectInterviewers(updatedInterviewers);
    } catch (error) {
      console.error("Error removing interviewer:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cbs to-cbs-light bg-clip-text text-transparent">
              Project Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage fieldwork projects across islands
            </p>
          </div>
          
          <Button
            onClick={handleAddNew}
            className="bg-cbs hover:bg-cbs-light flex items-center gap-2 transition-all shadow-sm hover:shadow"
            disabled={loading}
          >
            <PlusCircle size={16} />
            Add New Project
          </Button>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="max-w-md relative grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or island..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
                className="pl-9 border-gray-200 focus:border-cbs focus:ring-1 focus:ring-cbs"
              />
            </div>
            
            <div className="w-full md:w-60">
              <IslandSelector
                selectedIsland={selectedIsland}
                onIslandChange={handleFilterIslandChange}
                placeholder="All Islands"
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="mt-2 text-sm text-muted-foreground">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
          </div>
        </div>
        
        <ProjectList
          projects={filteredProjects}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAssign={handleAssign}
        />
      </div>
      
      <Dialog open={showAddEditDialog} onOpenChange={setShowAddEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Project" : "Add New Project"}</DialogTitle>
          </DialogHeader>
          
          <ProjectForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleDateChange={handleDateChange}
            handleIslandChange={handleIslandChange}
            handleSubmit={handleSubmit}
            isEditing={isEditing}
            loading={submitting}
            onCancel={() => setShowAddEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Are you sure you want to delete{" "}
              <span className="font-medium">
                {selectedProject ? selectedProject.name : ''}
              </span>
              ?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone. All sessions and interviews associated with this project will also be deleted.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={submitting}
            >
              {submitting ? (
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
      
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Assign Interviewers to {selectedProject ? selectedProject.name : ''}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-2">
            <h3 className="text-sm font-medium mb-2">Currently Assigned Interviewers:</h3>
            
            {projectInterviewers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No interviewers assigned to this project</p>
            ) : (
              <div className="border rounded-md divide-y">
                {projectInterviewers.map(interviewer => (
                  <div key={interviewer.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium">{interviewer.first_name} {interviewer.last_name}</p>
                      <p className="text-sm text-muted-foreground">{interviewer.code}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveInterviewer(interviewer.id)}
                      disabled={submitting}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <h3 className="text-sm font-medium mt-6 mb-2">Add Interviewers:</h3>
            
            <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
              {interviewers
                .filter(interviewer => !projectInterviewers.some(pi => pi.id === interviewer.id))
                .map(interviewer => (
                  <div key={interviewer.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium">{interviewer.first_name} {interviewer.last_name}</p>
                      <p className="text-sm text-muted-foreground">{interviewer.code}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-green-500 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleAssignInterviewer(interviewer.id)}
                      disabled={submitting}
                    >
                      Add
                    </Button>
                  </div>
                ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAssignDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Projects;
