import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import InterviewerForm from "@/components/interviewer/InterviewerForm";
import InterviewerList from "@/components/interviewer/InterviewerList";
import InterviewerCsvImport from "@/components/interviewer/InterviewerCsvImport";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useProjects } from "@/hooks/useProjects";
import { useFilter } from "@/contexts/FilterContext";
import { CsvInterviewer } from "@/utils/csvUtils";
import type { Interviewer } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const Interviewers = () => {
  const navigate = useNavigate();
  const { interviewers, loading: interviewersLoading, addInterviewer, updateInterviewer, deleteInterviewer } = useInterviewers();
  const { getAllProjectAssignments } = useProjects();
  const { selectedProject, selectedIsland, filterInterviewers } = useFilter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer | null>(null);
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [interviewerProjects, setInterviewerProjects] = useState<{[key: string]: any[]}>({});
  const [projectsLoading, setProjectsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    code: "",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    island: undefined as 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined,
  });
  
  useEffect(() => {
    const loadProjectAssignments = async () => {
      if (interviewers.length === 0 || interviewersLoading) return;
      
      setProjectsLoading(true);
      try {
        const assignments = await getAllProjectAssignments();
        setInterviewerProjects(assignments);
      } catch (error) {
        console.error("Error loading project assignments:", error);
      } finally {
        setProjectsLoading(false);
      }
    };

    loadProjectAssignments();
  }, [interviewers, interviewersLoading, getAllProjectAssignments]);
  
  const globalFilteredInterviewers = filterInterviewers(interviewers, interviewerProjects);
  
  const filteredInterviewers = globalFilteredInterviewers.filter((interviewer) => {
    const query = searchQuery.toLowerCase();
    return (
      interviewer.code.toLowerCase().includes(query) ||
      interviewer.first_name.toLowerCase().includes(query) ||
      interviewer.last_name.toLowerCase().includes(query) ||
      (interviewer.email && interviewer.email.toLowerCase().includes(query)) ||
      (interviewer.island && interviewer.island.toLowerCase().includes(query))
    );
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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
  
  const handleAddNew = () => {
    setIsEditing(false);
    setSelectedInterviewer(null);
    setFormData({
      code: "",
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      island: undefined,
    });
    setShowAddEditDialog(true);
  };
  
  const handleEdit = (interviewer: Interviewer) => {
    setIsEditing(true);
    setSelectedInterviewer(interviewer);
    setFormData({
      code: interviewer.code,
      first_name: interviewer.first_name,
      last_name: interviewer.last_name,
      phone: interviewer.phone || "",
      email: interviewer.email || "",
      island: interviewer.island,
    });
    setShowAddEditDialog(true);
  };
  
  const handleDelete = (interviewer: Interviewer) => {
    setSelectedInterviewer(interviewer);
    setShowDeleteDialog(true);
  };
  
  const handleSubmit = async () => {
    if (!formData.code || !formData.first_name || !formData.last_name) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (isEditing && selectedInterviewer) {
        await updateInterviewer(selectedInterviewer.id, formData);
      } else {
        await addInterviewer(formData);
      }
      
      setShowAddEditDialog(false);
    } catch (error) {
      console.error("Error saving interviewer:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const confirmDelete = async () => {
    if (!selectedInterviewer) return;
    
    try {
      setSubmitting(true);
      await deleteInterviewer(selectedInterviewer.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting interviewer:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleSchedule = (interviewer: Interviewer) => {
    navigate(`/admin/scheduling?interviewer=${interviewer.code}`);
  };
  
  const handleViewDashboard = (interviewer: Interviewer) => {
    console.log("Navigating to interviewer dashboard:", interviewer.id); // Add for debugging
    navigate(`/admin/interviewer/${interviewer.id}`);
  };
  
  const handleCsvImport = async (csvInterviewers: CsvInterviewer[]) => {
    try {
      setSubmitting(true);
      
      for (const interviewer of csvInterviewers) {
        await addInterviewer({
          code: interviewer.code,
          first_name: interviewer.first_name,
          last_name: interviewer.last_name,
          phone: interviewer.phone || "",
          email: interviewer.email || "",
          island: interviewer.island,
        });
      }
      
    } catch (error) {
      console.error("Error importing interviewers:", error);
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
              Interviewer Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your interview team and their assignments
            </p>
          </div>
          
          <div className="flex gap-2">
            <InterviewerCsvImport onImport={handleCsvImport} />
            <Button
              onClick={handleAddNew}
              className="bg-cbs hover:bg-cbs-light flex items-center gap-2 transition-all shadow-sm hover:shadow"
              disabled={interviewersLoading}
            >
              <PlusCircle size={16} />
              Add New Interviewer
            </Button>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <div className="max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, code, island, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={interviewersLoading}
              className="pl-9 border-gray-200 focus:border-cbs focus:ring-1 focus:ring-cbs"
            />
          </div>
          
          <div className="mt-2 text-sm text-muted-foreground flex items-center justify-between">
            <span>
              {filteredInterviewers.length} interviewer{filteredInterviewers.length !== 1 ? 's' : ''} found
            </span>
            {(selectedProject || selectedIsland) && (
              <span className="text-cbs">
                Filtered by: {selectedProject ? `Project: ${selectedProject.name}` : ''}
                {selectedProject && selectedIsland ? ' & ' : ''}
                {selectedIsland ? `Island: ${selectedIsland}` : ''}
              </span>
            )}
          </div>
        </div>
        
        <InterviewerList
          interviewers={filteredInterviewers}
          loading={interviewersLoading || projectsLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSchedule={handleSchedule}
          onViewDashboard={handleViewDashboard}
          interviewerProjects={interviewerProjects}
        />
      </div>
      
      <Dialog open={showAddEditDialog} onOpenChange={setShowAddEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Interviewer" : "Add New Interviewer"}</DialogTitle>
          </DialogHeader>
          
          <InterviewerForm
            formData={formData}
            handleInputChange={handleInputChange}
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
                {selectedInterviewer ? `${selectedInterviewer.first_name} ${selectedInterviewer.last_name}` : ''}
              </span>
              ?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone. All sessions associated with this interviewer will also be deleted.
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
    </AdminLayout>
  );
};

export default Interviewers;
