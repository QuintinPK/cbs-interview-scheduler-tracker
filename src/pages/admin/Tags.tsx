
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Filter, Plus, SortAsc, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { EvaluationTag } from "@/types";

const Tags = () => {
  const { toast } = useToast();
  const [tags, setTags] = useState<EvaluationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<EvaluationTag | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTag, setNewTag] = useState({
    name: "",
    category: "",
  });
  
  // Categories that we support
  const categories = [
    "General",
    "Quality",
    "Punctuality",
    "Process",
    "Communication",
    "Interaction"
  ];
  
  useEffect(() => {
    fetchTags();
  }, []);
  
  const fetchTags = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('evaluation_tags')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      setTags(data || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast({
        title: "Error",
        description: "Failed to load evaluation tags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddTag = async () => {
    if (!newTag.name || !newTag.category) {
      toast({
        title: "Error",
        description: "Please provide both name and category",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('evaluation_tags')
        .insert([
          { 
            name: newTag.name,
            category: newTag.category
          }
        ])
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Tag added successfully",
      });
      
      setIsAddDialogOpen(false);
      setNewTag({ name: "", category: "" });
      fetchTags();
    } catch (error) {
      console.error("Error adding tag:", error);
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditTag = async () => {
    if (!selectedTag || !newTag.name || !newTag.category) {
      toast({
        title: "Error",
        description: "Please provide both name and category",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('evaluation_tags')
        .update({ 
          name: newTag.name,
          category: newTag.category
        })
        .eq('id', selectedTag.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Tag updated successfully",
      });
      
      setIsEditDialogOpen(false);
      setSelectedTag(null);
      setNewTag({ name: "", category: "" });
      fetchTags();
    } catch (error) {
      console.error("Error updating tag:", error);
      toast({
        title: "Error",
        description: "Failed to update tag",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteTag = async () => {
    if (!selectedTag) return;
    
    try {
      setLoading(true);
      
      // First check if tag is in use
      const { data: junctionData, error: junctionError } = await supabase
        .from('evaluation_tags_junction')
        .select('evaluation_id')
        .eq('tag_id', selectedTag.id);
        
      if (junctionError) throw junctionError;
      
      if (junctionData && junctionData.length > 0) {
        toast({
          title: "Cannot Delete",
          description: `This tag is used in ${junctionData.length} evaluation(s). Remove the tag from these evaluations first.`,
          variant: "destructive",
        });
        setIsDeleteDialogOpen(false);
        setSelectedTag(null);
        return;
      }
      
      // If not in use, proceed with deletion
      const { error } = await supabase
        .from('evaluation_tags')
        .delete()
        .eq('id', selectedTag.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Tag deleted successfully",
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedTag(null);
      fetchTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const openEditDialog = (tag: EvaluationTag) => {
    setSelectedTag(tag);
    setNewTag({
      name: tag.name,
      category: tag.category,
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (tag: EvaluationTag) => {
    setSelectedTag(tag);
    setIsDeleteDialogOpen(true);
  };
  
  const filteredTags = tags.filter(tag => {
    const query = searchQuery.toLowerCase();
    return (
      tag.name.toLowerCase().includes(query) ||
      tag.category.toLowerCase().includes(query)
    );
  });
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cbs to-cbs-light bg-clip-text text-transparent">
              Evaluation Tags
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage evaluation tags used for interviewer feedback
            </p>
          </div>
          
          <Button
            onClick={() => {
              setNewTag({ name: "", category: "" });
              setIsAddDialogOpen(true);
            }}
            className="bg-cbs hover:bg-cbs-light flex items-center gap-2 transition-all shadow-sm hover:shadow"
          >
            <Plus size={16} />
            Add New Tag
          </Button>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
            <div className="max-w-md relative">
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 border-gray-200 focus:border-cbs focus:ring-1 focus:ring-cbs"
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="icon" title="Filter">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" title="Sort">
                <SortAsc className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <div className="flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-cbs" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No tags found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {tag.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{tag.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tag.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {tag.created_at ? format(new Date(tag.created_at), "yyyy-MM-dd HH:mm") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(tag)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(tag)}
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
      
      {/* Add Tag Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Tag</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tag Name</Label>
              <Input
                id="name"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                placeholder="e.g., Professional, Thorough, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newTag.category}
                onValueChange={(value) => setNewTag({ ...newTag, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddTag}
              disabled={loading || !newTag.name || !newTag.category}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Tag"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Tag Name</Label>
              <Input
                id="edit-name"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={newTag.category}
                onValueChange={(value) => setNewTag({ ...newTag, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditTag}
              disabled={loading || !newTag.name || !newTag.category}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Tag"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Are you sure you want to delete tag "
              <span className="font-medium">{selectedTag?.name}</span>"?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone. If the tag is in use, you will not be able to delete it.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteTag}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Tag"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Tags;
