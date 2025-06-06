
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/useProjects";
import { useInterviewers } from "@/hooks/useInterviewers";
import { Interviewer, Project } from "@/types";
import { Loader2, ArrowLeft, UserPlus, UserMinus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import IslandSelector from "@/components/ui/IslandSelector";

const ProjectAssign = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIsland, setSelectedIsland] = useState<'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined>(undefined);
  const { projects, assignInterviewerToProject, removeInterviewerFromProject, getProjectInterviewers } = useProjects();
  const { interviewers } = useInterviewers();
  const [projectInterviewers, setProjectInterviewers] = useState<Interviewer[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleIslandChange = (island: 'Bonaire' | 'Saba' | 'Sint Eustatius' | 'all' | undefined) => {
    if (island === 'all') {
      setSelectedIsland(undefined);
    } else {
      setSelectedIsland(island as 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined);
    }
  };

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const foundProject = projects.find(p => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
      } else {
        toast({
          title: "Error",
          description: "Project not found",
          variant: "destructive"
        });
        navigate("/admin/projects");
      }
    }
  }, [projectId, projects, navigate, toast]);

  const loadProjectInterviewers = useCallback(async () => {
    if (projectId) {
      setLoading(true);
      try {
        const interviewers = await getProjectInterviewers(projectId);
        setProjectInterviewers(interviewers);
      } catch (error) {
        console.error("Error loading project interviewers:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [projectId, getProjectInterviewers]);

  useEffect(() => {
    loadProjectInterviewers();
  }, [loadProjectInterviewers]);

  const handleAssignInterviewer = async (interviewer: Interviewer) => {
    if (!projectId || processingIds.has(interviewer.id)) return;
    setProcessingIds(prev => new Set(prev).add(interviewer.id));
    try {
      await assignInterviewerToProject(projectId, interviewer.id);

      setProjectInterviewers(prev => [...prev, interviewer]);
      toast({
        title: "Success",
        description: "Interviewer assigned successfully"
      });
    } catch (error) {
      console.error("Error assigning interviewer:", error);
      await loadProjectInterviewers();
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(interviewer.id);
        return newSet;
      });
    }
  };

  const handleRemoveInterviewer = async (interviewer: Interviewer) => {
    if (!projectId || processingIds.has(interviewer.id)) return;
    setProcessingIds(prev => new Set(prev).add(interviewer.id));
    try {
      await removeInterviewerFromProject(projectId, interviewer.id);

      setProjectInterviewers(prev => prev.filter(i => i.id !== interviewer.id));
      toast({
        title: "Success",
        description: "Interviewer removed successfully"
      });
    } catch (error) {
      console.error("Error removing interviewer:", error);
      await loadProjectInterviewers();
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(interviewer.id);
        return newSet;
      });
    }
  };

  const filteredInterviewers = interviewers.filter(interviewer => {
    const fullName = `${interviewer.first_name} ${interviewer.last_name}`.toLowerCase();
    const code = interviewer.code.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(query) || code.includes(query);
    const matchesIsland = !selectedIsland || interviewer.island === selectedIsland;

    const isEligible = project && interviewer.island 
      ? !project.excluded_islands?.includes(interviewer.island) 
      : true;
      
    return matchesSearch && matchesIsland && isEligible;
  });

  const isInterviewerAssigned = (interviewerId: string) => {
    return projectInterviewers.some(i => i.id === interviewerId);
  };

  const isProcessing = (interviewerId: string) => {
    return processingIds.has(interviewerId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Button variant="outline" onClick={() => navigate("/admin/projects")} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
            </Button>
            
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cbs to-cbs-light bg-clip-text text-transparent">
              Assign Interviewers
            </h1>
            {project && (
              <p className="text-muted-foreground mt-1 font-bold text-left text-base">
                Project: {project.name}
              </p>
            )}
          </div>
        </div>
        
        {loading && !project ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-cbs" />
          </div>
        ) : (
          <>
            <div className="bg-white p-5 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Current Interviewers</h2>
              
              {projectInterviewers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Island</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectInterviewers.map(interviewer => (
                        <TableRow key={interviewer.id}>
                          <TableCell className="font-medium">{interviewer.code}</TableCell>
                          <TableCell>{`${interviewer.first_name} ${interviewer.last_name}`}</TableCell>
                          <TableCell>
                            {interviewer.island && (
                              <Badge variant={interviewer.island === 'Bonaire' ? 'default' : interviewer.island === 'Saba' ? 'info' : 'purple'}>
                                {interviewer.island}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveInterviewer(interviewer)} 
                              disabled={isProcessing(interviewer.id)}
                            >
                              {isProcessing(interviewer.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <UserMinus className="h-4 w-4 mr-2 text-destructive" />
                              )}
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6">No interviewers assigned to this project yet</p>
              )}
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Available Interviewers</h2>
              
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-4">
                <div className="max-w-md relative grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    placeholder="Search by name or code..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    className="pl-9 border-gray-200 focus:border-cbs focus:ring-1 focus:ring-cbs" 
                  />
                </div>
                
                <div className="w-full md:w-60">
                  <IslandSelector 
                    selectedIsland={selectedIsland} 
                    onIslandChange={handleIslandChange} 
                    placeholder="All Islands" 
                    showAllOption={true} 
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Island</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInterviewers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          No interviewers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInterviewers.map(interviewer => {
                        const assigned = isInterviewerAssigned(interviewer.id);
                        const processing = isProcessing(interviewer.id);
                        return (
                          <TableRow key={interviewer.id} className={assigned ? "bg-muted/30" : ""}>
                            <TableCell className="font-medium">{interviewer.code}</TableCell>
                            <TableCell>{`${interviewer.first_name} ${interviewer.last_name}`}</TableCell>
                            <TableCell>
                              {interviewer.island && (
                                <Badge variant={interviewer.island === 'Bonaire' ? 'default' : interviewer.island === 'Saba' ? 'info' : 'purple'}>
                                  {interviewer.island}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {assigned ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleRemoveInterviewer(interviewer)} 
                                  disabled={processing}
                                >
                                  {processing ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <UserMinus className="h-4 w-4 mr-2 text-destructive" />
                                  )}
                                  Remove
                                </Button>
                              ) : (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleAssignInterviewer(interviewer)} 
                                  disabled={processing}
                                >
                                  {processing ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <UserPlus className="h-4 w-4 mr-2 text-cbs" />
                                  )}
                                  Assign
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default ProjectAssign;
