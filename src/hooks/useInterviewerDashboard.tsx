import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useSessions } from "@/hooks/useSessions";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { Interviewer } from "@/types";

export const useInterviewerDashboard = () => {
  const navigate = useNavigate();
  const { interviewerId } = useParams<{ interviewerId: string }>();
  const [searchParams] = useSearchParams();
  const compareId = searchParams.get('compare');

  const { interviewers, loading: interviewersLoading } = useInterviewers();
  const { projects } = useProjects();
  
  // Use the useSessions hook directly with the interviewerId parameter
  // This will provide real-time updates just like on the Sessions page
  const { sessions, loading: sessionsLoading } = useSessions(interviewerId);

  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(1)), // First day of current month
    to: new Date()
  });

  const [interviewer, setInterviewer] = useState<Interviewer | null>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [compareInterviewer, setCompareInterviewer] = useState<Interviewer | null>(null);
  const [compareSessions, setCompareSessions] = useState<any[]>([]);

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
          island: data.island as "Bonaire" | "Saba" | "Sint Eustatius" | undefined
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

  // If there's a compare parameter, fetch the comparison interviewer data
  useEffect(() => {
    if (!compareId) {
      setCompareInterviewer(null);
      setCompareSessions([]);
      return;
    }
    
    const fetchCompareData = async () => {
      try {
        // First try to find the interviewer in the already loaded interviewers
        if (!interviewersLoading && interviewers.length > 0) {
          const foundInterviewer = interviewers.find(i => i.id === compareId);
          
          if (foundInterviewer) {
            setCompareInterviewer(foundInterviewer);
            
            // Now fetch sessions for this interviewer
            const { data: compareSessions, error: sessionsError } = await supabase
              .from('sessions')
              .select('*')
              .eq('interviewer_id', compareId);
              
            if (sessionsError) throw sessionsError;
            setCompareSessions(compareSessions || []);
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
        
        setCompareInterviewer(interviewerData);
        
        // Fetch sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('interviewer_id', compareId);
          
        if (sessionsError) throw sessionsError;
        setCompareSessions(sessionsData || []);
        
      } catch (error) {
        console.error("Error fetching comparison data:", error);
        setCompareInterviewer(null);
        setCompareSessions([]);
      }
    };
    
    fetchCompareData();
  }, [compareId, interviewers, interviewersLoading]);

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
    compareInterviewer,
    compareSessions
  };
};
