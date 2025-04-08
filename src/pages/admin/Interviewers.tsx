
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { mockInterviewers } from "@/lib/mock-data";
import { Interviewer } from "@/types";
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
import { PlusCircle, Calendar, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Interviewers = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [interviewers, setInterviewers] = useState<Interviewer[]>(mockInterviewers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer | null>(null);
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    code: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  
  const filteredInterviewers = interviewers.filter((interviewer) => {
    const query = searchQuery.toLowerCase();
    return (
      interviewer.code.toLowerCase().includes(query) ||
      interviewer.firstName.toLowerCase().includes(query) ||
      interviewer.lastName.toLowerCase().includes(query) ||
      interviewer.email.toLowerCase().includes(query)
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
      firstName: "",
      lastName: "",
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
      firstName: interviewer.firstName,
      lastName: interviewer.lastName,
      phone: interviewer.phone,
      email: interviewer.email,
    });
    setShowAddEditDialog(true);
  };
  
  const handleDelete = (interviewer: Interviewer) => {
    setSelectedInterviewer(interviewer);
    setShowDeleteDialog(true);
  };
  
  const handleSubmit = () => {
    // Validate form
    if (!formData.code || !formData.firstName || !formData.lastName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (isEditing && selectedInterviewer) {
      // Update existing interviewer
      const updatedInterviewers = interviewers.map((interviewer) => {
        if (interviewer.id === selectedInterviewer.id) {
          return {
            ...interviewer,
            ...formData,
          };
        }
        return interviewer;
      });
      
      setInterviewers(updatedInterviewers);
      toast({
        title: "Success",
        description: "Interviewer updated successfully",
      });
    } else {
      // Add new interviewer
      const newInterviewer: Interviewer = {
        id: Date.now().toString(),
        ...formData,
      };
      
      setInterviewers([...interviewers, newInterviewer]);
      toast({
        title: "Success",
        description: "New interviewer added successfully",
      });
    }
    
    setShowAddEditDialog(false);
  };
  
  const confirmDelete = () => {
    if (!selectedInterviewer) return;
    
    const updatedInterviewers = interviewers.filter(
      (interviewer) => interviewer.id !== selectedInterviewer.id
    );
    
    setInterviewers(updatedInterviewers);
    setShowDeleteDialog(false);
    
    toast({
      title: "Success",
      description: "Interviewer deleted successfully",
    });
  };
  
  const handleSchedule = (interviewer: Interviewer) => {
    // In a real app, this would navigate to the scheduling page with the interviewer pre-selected
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
                {filteredInterviewers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No interviewers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInterviewers.map((interviewer) => (
                    <TableRow key={interviewer.id}>
                      <TableCell className="font-medium">{interviewer.code}</TableCell>
                      <TableCell>{`${interviewer.firstName} ${interviewer.lastName}`}</TableCell>
                      <TableCell>{interviewer.phone}</TableCell>
                      <TableCell>{interviewer.email}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(interviewer)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSchedule(interviewer)}
                            title="Schedule"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(interviewer)}
                            title="Delete"
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
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name*</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name*</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
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
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-cbs hover:bg-cbs-light">
              {isEditing ? "Save Changes" : "Add Interviewer"}
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
                {selectedInterviewer?.firstName} {selectedInterviewer?.lastName}
              </span>
              ?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Interviewers;
