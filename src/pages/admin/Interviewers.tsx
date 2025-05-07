
import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useNavigate } from "react-router-dom";
import InterviewerForm from "@/components/interviewer/InterviewerForm";
import InterviewerList from "@/components/interviewer/InterviewerList";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useProjects } from "@/hooks/useProjects";
import { useFilter } from "@/contexts/FilterContext";
import { CsvInterviewer } from "@/utils/csvUtils";
import type { Interviewer } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import InterviewersHeader from "@/components/interviewer/InterviewersHeader";
import InterviewersSearch from "@/components/interviewer/InterviewersSearch";
import DeleteConfirmationDialog from "@/components/interviewer/DeleteConfirmationDialog";

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
  
  React.useEffect(() => {
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
    console.log("Navigating to interviewer dashboard:", interviewer.id);
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
        <InterviewersHeader 
          onAddNew={handleAddNew} 
          onImport={handleCsvImport}
          loading={interviewersLoading}
        />
        
        <InterviewersSearch 
          searchQuery={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          loading={interviewersLoading}
          filteredCount={filteredInterviewers.length}
          selectedProject={selectedProject}
          selectedIsland={selectedIsland}
        />
        
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
      
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        interviewer={selectedInterviewer}
        submitting={submitting}
        onConfirmDelete={confirmDelete}
      />
    </AdminLayout>
  );
};

export default Interviewers;
