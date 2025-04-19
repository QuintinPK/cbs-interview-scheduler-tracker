
import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Interviewer } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlusCircle, Loader2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import InterviewerForm from "@/components/interviewer/InterviewerForm";
import InterviewerList from "@/components/interviewer/InterviewerList";
import { useInterviewers } from "@/hooks/useInterviewers";

const Interviewers = () => {
  const navigate = useNavigate();
  const { interviewers, loading, addInterviewer, updateInterviewer, deleteInterviewer } = useInterviewers();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer | null>(null);
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    code: "",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    island: undefined as 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined,
  });
  
  const filteredInterviewers = interviewers.filter((interviewer) => {
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
    navigate(`/admin/interviewer/${interviewer.id}`);
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
          
          <Button
            onClick={handleAddNew}
            className="bg-cbs hover:bg-cbs-light flex items-center gap-2 transition-all shadow-sm hover:shadow"
            disabled={loading}
          >
            <PlusCircle size={16} />
            Add New Interviewer
          </Button>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <div className="max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, code, island, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
              className="pl-9 border-gray-200 focus:border-cbs focus:ring-1 focus:ring-cbs"
            />
          </div>
          
          <div className="mt-2 text-sm text-muted-foreground">
            {filteredInterviewers.length} interviewer{filteredInterviewers.length !== 1 ? 's' : ''} found
          </div>
        </div>
        
        <InterviewerList
          interviewers={filteredInterviewers}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSchedule={handleSchedule}
          onViewDashboard={handleViewDashboard}
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
