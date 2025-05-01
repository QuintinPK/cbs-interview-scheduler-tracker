
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useSessions } from "@/hooks/useSessions";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { Interviewer } from "@/types";

export const useInterviewerDashboard = () => {
  const navigate = useNavigate();
  const { interviewerId } = useParams<{ interviewerId: string }>();

  const { interviewers, loading: interviewersLoading } = useInterviewers();
  const { sessions: allSessions } = useSessions();
  const { projects } = useProjects();

  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(1)), // First day of current month
    to: new Date()
  });

  const [interviewer, setInterviewer] = useState<Interviewer | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Debug the interviewerId parameter
  console.log("InterviewerDashboard - interviewerId from params:", interviewerId);

  // Load interviewer data
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

  // Load sessions and interviews data based on date range
  useEffect(() => {
    const fetchData = async () => {
      if (!interviewerId || !dateRange.from || !dateRange.to) return;
      
      setLoading(true);
      try {
        // Format dates for filtering
        const fromDate = dateRange.from;
        const toDate = new Date(dateRange.to.getTime());
        toDate.setHours(23, 59, 59, 999);
        
        // Filter sessions by interviewer and date range
        const filteredSessions = allSessions.filter(session => 
          session.interviewer_id === interviewerId &&
          new Date(session.start_time) >= fromDate &&
          new Date(session.start_time) <= toDate
        );
        setSessions(filteredSessions);
        
        // Fetch interviews based on session IDs
        try {
          // Check if we have any sessions before trying to fetch interviews
          if (filteredSessions.length === 0) {
            setInterviews([]);
            setLoading(false);
            return;
          }
          
          const sessionIds = filteredSessions.map(s => String(s.id));
          
          // Fix the type error by explicitly casting the sessionIds array to string[]
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
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [interviewerId, dateRange, allSessions]);

  // Get project name resolver function
  const getProjectName = (projectId: string | null | undefined) => {
    if (!projectId) return "No project";
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown project";
  };

  return {
    interviewer,
    loading,
    sessions,
    interviews,
    dateRange,
    setDateRange,
    activeTab,
    setActiveTab,
    getProjectName,
    projects
  };
};
