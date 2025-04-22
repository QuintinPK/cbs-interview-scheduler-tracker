import React, { useState, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Project, Interviewer } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Loader2, Search } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useFilter } from "@/contexts/FilterContext";
import IslandSelector from "@/components/ui/IslandSelector";
import ProjectForm from "@/components/project/ProjectForm";
import ProjectList from "@/components/project/ProjectList";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const Projects = () => {
  const navigate = useNavigate();
  const { projects, loading, addProject, updateProject, deleteProject } = useProjects();
  const { interviewers } = useInterviewers();
  const { selectedIsland, filterProjects } = useFilter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocalIsland, setSelectedLocalIsland] = useState<'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined>(undefined);
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    excluded_islands: [] as ('Bonaire' | 'Saba' | 'Sint Eustatius')[],
    hourly_rate: 10,
    show_response_rates: false,
    response_rate: 0,
    non_response_rate: 0
  });
  
  const handleIslandChange = (island: 'Bonaire' | 'Saba' | 'Sint Eustatius' | 'all' | undefined) => {
    if (island === 'all') {
      setSelectedLocalIsland(undefined);
    } else {
      setSelectedLocalIsland(island as 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined);
    }
  };
  
  const globalFilteredProjects = filterProjects(projects);
  
  const filteredProjects = globalFilteredProjects.filter((project) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = project.name.toLowerCase().includes(query);
    
    const matchesLocalIsland = !selectedLocalIsland || !project.excluded_islands.includes(selectedLocalIsland);
    
    return matchesSearch && matchesLocalIsland;
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };
  
  const handleDateChange = (name: 'start_date' | 'end_date', value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleExcludedIslandsChange = (island: 'Bonaire' | 'Saba' | 'Sint Eustatius') => {
    setFormData(prev => ({
      ...prev,
      excluded_islands: prev.excluded_islands.includes(island)
        ? prev.excluded_islands.filter(excludedIsland => excludedIsland !== island)
        : [...prev.excluded_islands, island]
    }));
  };
  
  const handleAddNew = () => {
    setIsEditing(false);
    setSelectedProject(null);
    setFormData({
      name: "",
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
      excluded_islands: [],
      hourly_rate: 10,
      show_response_rates: false,
      response_rate: 0,
      non_response_rate: 0
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
      excluded_islands: project.excluded_islands,
      hourly_rate: project.hourly_rate ?? 10,
      show_response_rates: project.show_response_rates ?? false,
      response_rate: project.response_rate ?? 0,
      non_response_rate: project.non_response_rate ?? 0
    });
    setShowAddEditDialog(true);
  };

  const handleAssign = (project: Project) => {
    navigate(`/admin/projects/assign/${project.id}`);
  };
  
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      if (isEditing && selectedProject) {
        await updateProject(selectedProject.id, {
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          excluded_islands: formData.excluded_islands,
          hourly_rate: formData.hourly_rate,
          show_response_rates: formData.show_response_rates,
          response_rate: formData.response_rate,
          non_response_rate: formData.non_response_rate
        });
      } else {
        await addProject({
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          excluded_islands: formData.excluded_islands,
          hourly_rate: formData.hourly_rate,
          show_response_rates: formData.show_response_rates,
          response_rate: formData.response_rate,
          non_response_rate: formData.non_response_rate
        });
      }
      
      setShowAddEditDialog(false);
    } catch (error) {
      console.error("Error saving project:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const deleteProjectHandler = useCallback(
    async (project: Project) => {
      if (
        window.confirm(`Are you sure you want to delete project "${project.name}"?`)
      ) {
        try {
          await deleteProject(project.id);
        } catch (error) {
          console.error("Error deleting project:", error);
        }
      }
    },
    [deleteProject]
  );
  
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
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
                className="pl-9 border-gray-200 focus:border-cbs focus:ring-1 focus:ring-cbs"
              />
            </div>
            
            <div className="w-full md:w-60">
              <IslandSelector
                selectedIsland={selectedLocalIsland}
                onIslandChange={handleIslandChange}
                placeholder="All Islands"
                showAllOption={true}
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="mt-2 text-sm text-muted-foreground flex items-center justify-between">
            <span>
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
            </span>
            {selectedIsland && (
              <span className="text-cbs">
                Global filter: Island: {selectedIsland}
              </span>
            )}
          </div>
        </div>
        
        <ProjectList
          projects={filteredProjects}
          loading={loading}
          onEdit={handleEdit}
          onDelete={deleteProjectHandler}
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
            handleExcludedIslandsChange={handleExcludedIslandsChange}
            handleSubmit={handleSubmit}
            isEditing={isEditing}
            loading={submitting}
            onCancel={() => setShowAddEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Projects;
