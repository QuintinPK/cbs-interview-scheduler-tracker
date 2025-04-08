
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Interviewer } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Calendar, Pencil, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Interviewers = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer | null>(null);
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    code: "",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  });
  
  useEffect(() => {
    const loadInterviewers = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('interviewers')
          .select('*')
          .order('code');
          
        if (error) throw error;
        
        setInterviewers(data || []);
      } catch (error) {
        console.error("Error loading interviewers:", error);
        toast({
          title: "Error",
          description: "Could not load interviewers",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadInterviewers();
  }, [toast]);
  
  const filteredInterviewers = interviewers.filter((interviewer) => {
    const query = searchQuery.toLowerCase();
    return (
      interviewer.code.toLowerCase().includes(query) ||
      interviewer.first_name.toLowerCase().includes(query) ||
      interviewer.last_name.toLowerCase().includes(query) ||
      (interviewer.email && interviewer.email.toLowerCase().includes(query))
    );
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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
    });
    setShowAddEditDialog(true);
  };
  
  const handleDelete = (interviewer: Interviewer) => {
    setSelectedInterviewer(interviewer);
    setShowDeleteDialog(true);
  };
  
  const handleSubmit = async () => {
    // Validate form
    if (!formData.code || !formData.first_name || !formData.last_name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      if (isEditing && selectedInterviewer) {
        // Update existing interviewer
        const { error } = await supabase
          .from('interviewers')
          .update({
            code: formData.code,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            email: formData.email,
          })
          .eq('id', selectedInterviewer.id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Interviewer updated successfully",
        });
      } else {
        // Add new interviewer
        const { error } = await supabase
          .from('interviewers')
          .insert([{
            code: formData.code,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            email: formData.email,
          }]);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "New interviewer added successfully",
        });
      }
      
      // Refresh the interviewers list
      const { data, error } = await supabase
        .from('interviewers')
        .select('*')
        .order('code');
        
      if (error) throw error;
      
      setInterviewers(data || []);
      setShowAddEditDialog(false);
    } catch (error) {
      console.error("Error saving interviewer:", error);
      toast({
        title: "Error",
        description: "Could not save interviewer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const confirmDelete = async () => {
    if (!selectedInterviewer) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('interviewers')
        .delete()
        .eq('id', selectedInterviewer.id);
        
      if (error) throw error;
      
      // Remove interviewer from state
      setInterviewers(interviewers.filter(i => i.id !== selectedInterviewer.id));
      setShowDeleteDialog(false);
      
      toast({
        title: "Success",
        description: "Interviewer deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting interviewer:", error);
      toast({
        title: "Error",
        description: "Could not delete interviewer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSchedule = (interviewer: Interviewer) => {
    navigate(`/admin/scheduling?interviewer=${interviewer.code}`);
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Interviewer Management</h1>
          <Button
            onClick={handleAddNew}
            className="bg-cbs hover:bg-cbs-light flex items-center gap-2"
            disabled={loading}
          >
            <PlusCircle size={16} />
            Add New Interviewer
          </Button>
        </div>
        
        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="max-w-md">
            <Label htmlFor="search" className="sr-only">
              Search Interviewers
            </Label>
            <Input
              id="search"
              placeholder="Search by name, code, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        
        {/* Interviewers Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Actions</TableHead>
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
                ) : filteredInterviewers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No interviewers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInterviewers.map((interviewer) => (
                    <TableRow key={interviewer.id}>
                      <TableCell className="font-medium">{interviewer.code}</TableCell>
                      <TableCell>{`${interviewer.first_name} ${interviewer.last_name}`}</TableCell>
                      <TableCell>{interviewer.phone || '-'}</TableCell>
                      <TableCell>{interviewer.email || '-'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(interviewer)}
                            title="Edit"
                            disabled={loading}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSchedule(interviewer)}
                            title="Schedule"
                            disabled={loading}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(interviewer)}
                            title="Delete"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
      </div>
      
      {/* Add/Edit Dialog */}
      <Dialog open={showAddEditDialog} onOpenChange={setShowAddEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Interviewer" : "Add New Interviewer"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Interviewer Code*</Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g. INT001"
                disabled={loading}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name*</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder="John"
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name*</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="06-12345678"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john.doe@example.com"
                disabled={loading}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddEditDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="bg-cbs hover:bg-cbs-light"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Saving..." : "Adding..."}
                </>
              ) : (
                isEditing ? "Save Changes" : "Add Interviewer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
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
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? (
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
