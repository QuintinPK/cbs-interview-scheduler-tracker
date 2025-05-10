
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useSessions } from "@/hooks/useSessions";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { Interviewer, Interview, Project } from "@/types";

export const useInterviewerDashboard = () => {
  const navigate = useNavigate();
  const { interviewerId } = useParams<{ interviewerId: string }>();
  const [searchParams] = useSearchParams();
  const compareId = searchParams.get('compare');
  // Get the initial tab from the URL if present
  const tabParam = searchParams.get('tab');

  const { interviewers, loading: interviewersLoading } = useInterviewers();
  const { projects } = useProjects();
  
  // Use the useSessions hook directly with the interviewerId parameter
  const { sessions, loading: sessionsLoading } = useSessions(interviewerId);

  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(1)), // First day of current month
    to: new Date()
  });

  const [interviewer, setInterviewer] = useState<Interviewer | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  // Set the default tab based on URL param or defaulting to "overview"
  const [activeTab, setActiveTab] = useState(tabParam || "overview");
  const [compareInterviewer, setCompareInterviewer] = useState<Interviewer | null>(null);
  const [compareSessions, setCompareSessions] = useState<any[]>([]);
  const [compareInterviews, setCompareInterviews] = useState<Interview[]>([]);

  // Debug the interviewerId parameter
  console.log("InterviewerDashboard - interviewerId from params:", interviewerId);
  console.log("CompareId from URL:", compareId);

  // Load interviewer data - only once when component mounts or interviewerId changes
  useEffect(() => {
    const fetchInterviewer = async () => {
      console.log("Attempting to fetch interviewer with ID:", interviewerId);
      
      if (!interviewerId) {
        console.error("No interviewerId provided in URL parameters");
        navigate("/admin/interviewers", { replace: true });
        return;
      }
      
      setLoading(true);
      
      try {
        // First try to find the interviewer in the already loaded interviewers
        if (!interviewersLoading && interviewers.length > 0) {
          console.log("Searching in loaded interviewers array:", interviewers.length, "interviewers");
          const foundInterviewer = interviewers.find(i => i.id === interviewerId);
          
          if (foundInterviewer) {
            console.log("Found interviewer in loaded interviewers:", foundInterviewer);
            setInterviewer(foundInterviewer);
            setLoading(false);
            return;
          } else {
            console.log("Interviewer not found in loaded interviewers, trying direct fetch");
          }
        }
        
        // If not found or interviewers not loaded yet, fetch directly from Supabase
        console.log("Fetching interviewer directly from Supabase");
        const { data, error } = await supabase
          .from('interviewers')
          .select('*')
          .eq('id', interviewerId)
          .single();
          
        if (error) {
          console.error("Error fetching interviewer from Supabase:", error);
          navigate("/admin/interviewers", { replace: true });
          return;
        }
        
        if (!data) {
          console.error("Interviewer not found in database");
          navigate("/admin/interviewers", { replace: true });
          return;
        }
        
        console.log("Successfully fetched interviewer from Supabase:", data);
        
        // Type casting the island property to ensure it matches the expected type
        const typedInterviewer: Interviewer = {
          ...data,
          // Check if island value is one of the valid options, otherwise set to undefined
          island: (data.island === "Bonaire" || data.island === "Saba" || data.island === "Sint Eustatius") 
            ? (data.island as "Bonaire" | "Saba" | "Sint Eustatius") 
            : undefined
        };
        
        setInterviewer(typedInterviewer);
      } catch (error) {
        console.error("Error in fetchInterviewer:", error);
        navigate("/admin/interviewers", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    
    fetchInterviewer();
  }, [interviewerId, interviewers, interviewersLoading, navigate]);

  // Function to fetch projects shared between two interviewers
  const getSharedProjects = async (interviewer1Id: string, interviewer2Id: string) => {
    try {
      // Get projects for first interviewer
      const { data: projects1, error: error1 } = await supabase
        .from('project_interviewers')
        .select('project_id')
        .eq('interviewer_id', interviewer1Id);
        
      if (error1) throw error1;
      
      // Get projects for second interviewer
      const { data: projects2, error: error2 } = await supabase
        .from('project_interviewers')
        .select('project_id')
        .eq('interviewer_id', interviewer2Id);
        
      if (error2) throw error2;
      
      // Find intersection of project IDs
      const projectIds1 = projects1?.map(p => p.project_id) || [];
      const projectIds2 = projects2?.map(p => p.project_id) || [];
      
      return projectIds1.filter(id => projectIds2.includes(id));
      
    } catch (error) {
      console.error("Error getting shared projects:", error);
      return [];
    }
  };

  // Fetch assigned projects for the interviewer
  const getInterviewerProjects = async () => {
    if (!interviewerId) return [];
    
    try {
      const { data, error } = await supabase
        .from('project_interviewers')
        .select('project_id')
        .eq('interviewer_id', interviewerId);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setAssignedProjects([]);
        return [];
      }
      
      const projectIds = data.map(item => item.project_id);
      
      // Fetch the full project details
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds);
      
      if (projectsError) throw projectsError;
      
      const typedProjects = (projectsData || []).map(project => ({
        ...project,
        excluded_islands: (project.excluded_islands || []) as ('Bonaire' | 'Saba' | 'Sint Eustatius')[]
      }));
      
      setAssignedProjects(typedProjects);
      return typedProjects;
    } catch (error) {
      console.error("Error fetching interviewer projects:", error);
      return [];
    }
  };

  // Load projects for the interviewer when the interviewer changes
  useEffect(() => {
    if (interviewerId) {
      getInterviewerProjects();
    }
  }, [interviewerId]);

  // If there's a compare parameter, fetch the comparison interviewer data
  useEffect(() => {
    if (!compareId || !interviewerId) {
      setCompareInterviewer(null);
      setCompareSessions([]);
      setCompareInterviews([]);
      return;
    }
    
    const fetchCompareData = async () => {
      try {
        console.log("Fetching comparison data for interviewer:", compareId);
        
        // Check if interviewers share island and projects before proceeding
        if (interviewer) {
          // Get shared projects
          const sharedProjects = await getSharedProjects(interviewerId, compareId);
          
          if (sharedProjects.length === 0) {
            console.log("No shared projects between interviewers");
            // No shared projects, don't compare
            setCompareInterviewer(null);
            setCompareSessions([]);
            setCompareInterviews([]);
            return;
          }
          
          // First try to find the interviewer in the already loaded interviewers
          if (!interviewersLoading && interviewers.length > 0) {
            const foundInterviewer = interviewers.find(i => i.id === compareId);
            
            if (foundInterviewer) {
              // Check if they're from the same island
              if (foundInterviewer.island !== interviewer.island) {
                console.log("Interviewers are from different islands");
                setCompareInterviewer(null);
                setCompareSessions([]);
                setCompareInterviews([]);
                return;
              }
              
              setCompareInterviewer(foundInterviewer);
              
              // Now fetch sessions for this interviewer
              const { data: compareSessions, error: sessionsError } = await supabase
                .from('sessions')
                .select('*')
                .eq('interviewer_id', compareId)
                .in('project_id', sharedProjects);
                
              if (sessionsError) throw sessionsError;
              setCompareSessions(compareSessions || []);
              
              // Also fetch interviews
              if (compareSessions && compareSessions.length > 0) {
                const sessionIds = compareSessions.map(s => s.id);
                const { data: interviewsData, error: interviewsError } = await supabase
                  .from('interviews')
                  .select('*')
                  .in('session_id', sessionIds);
                  
                if (interviewsError) throw interviewsError;
                setCompareInterviews(interviewsData || []);
              }
              
              return;
            }
          }
          
          // If not found, fetch directly
          const { data: interviewerData, error } = await supabase
            .from('interviewers')
            .select('*')
            .eq('id', compareId)
            .single();
            
          if (error) throw error;
          
          // Check if they're from the same island
          if (interviewerData.island !== interviewer.island) {
            console.log("Interviewers are from different islands");
            setCompareInterviewer(null);
            setCompareSessions([]);
            setCompareInterviews([]);
            return;
          }
          
          // Type casting the island property similar to above
          const typedCompareInterviewer: Interviewer = {
            ...interviewerData,
            island: (interviewerData.island === "Bonaire" || interviewerData.island === "Saba" || 
                    interviewerData.island === "Sint Eustatius") 
              ? (interviewerData.island as "Bonaire" | "Saba" | "Sint Eustatius") 
              : undefined
          };
          
          setCompareInterviewer(typedCompareInterviewer);
          
          // Fetch sessions for shared projects only
          const { data: sessionsData, error: sessionsError } = await supabase
            .from('sessions')
            .select('*')
            .eq('interviewer_id', compareId)
            .in('project_id', sharedProjects);
            
          if (sessionsError) throw sessionsError;
          setCompareSessions(sessionsData || []);
          
          // Also fetch interviews for these sessions
          if (sessionsData && sessionsData.length > 0) {
            const sessionIds = sessionsData.map(s => s.id);
            const { data: interviewsData, error: interviewsError } = await supabase
              .from('interviews')
              .select('*')
              .in('session_id', sessionIds);
              
            if (interviewsError) throw interviewsError;
            setCompareInterviews(interviewsData || []);
          }
        } else {
          console.log("Primary interviewer not loaded yet, deferring comparison");
        }
      } catch (error) {
        console.error("Error fetching comparison data:", error);
        setCompareInterviewer(null);
        setCompareSessions([]);
        setCompareInterviews([]);
      }
    };
    
    fetchCompareData();
  }, [compareId, interviewerId, interviewers, interviewersLoading, interviewer]);

  // Load interviews data based on sessions
  useEffect(() => {
    const fetchInterviews = async () => {
      if (!sessions || sessions.length === 0) {
        setInterviews([]);
        return;
      }
      
      try {
        const sessionIds = sessions.map(s => String(s.id));
        
        const { data: interviewsData, error } = await supabase
          .from('interviews')
          .select('*')
          .in('session_id', sessionIds as string[]);
          
        if (error) throw error;
        setInterviews(interviewsData || []);
      } catch (error) {
        console.error("Error fetching interviews:", error);
        setInterviews([]);
      }
    };
    
    fetchInterviews();
  }, [sessions]);

  // Refresh all data
  const refreshData = async () => {
    if (interviewerId) {
      // Refresh interviewer projects
      await getInterviewerProjects();
    }
  };

  // Filter sessions by date range locally
  const filteredSessions = sessions.filter(session => {
    if (!dateRange.from || !dateRange.to) return true;
    
    const sessionDate = new Date(session.start_time);
    const fromDate = dateRange.from;
    
    const toDate = new Date(dateRange.to.getTime());
    toDate.setHours(23, 59, 59, 999);
    
    return sessionDate >= fromDate && sessionDate <= toDate;
  });

  // Get project name resolver function
  const getProjectName = (projectId: string | null | undefined) => {
    if (!projectId) return "No project";
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown project";
  };

  return {
    interviewer,
    loading: loading || sessionsLoading,
    sessions: filteredSessions, // Return date-filtered sessions
    interviews,
    dateRange,
    setDateRange,
    activeTab,
    setActiveTab,
    getProjectName,
    projects,
    getInterviewerProjects,
    assignedProjects,
    refreshData,
    compareInterviewer,
    compareSessions,
    compareInterviews
  };
};
