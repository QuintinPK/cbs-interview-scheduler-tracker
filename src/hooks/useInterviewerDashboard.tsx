
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useSessions } from "@/hooks/useSessions";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { Interviewer } from "@/types";

export const useInterviewerDashboard = () => {
  const navigate = useNavigate();
  const { interviewerId } = useParams<{ interviewerId: string }>();

  const { interviewers, loading: interviewersLoading } = useInterviewers();
  // Use the same sessions hook that is used on the Sessions page
  const { sessions: allSessions, loading: sessionsLoading } = useSessions(interviewerId);
  const { projects } = useProjects();

  const [interviewer, setInterviewer] = useState<Interviewer | null>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Debug the interviewerId parameter
  console.log("InterviewerDashboard - interviewerId from params:", interviewerId);

  // Function to fetch interviewer data
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

  // Load interviewer data - initial load and when interviewerId changes
  useEffect(() => {
    fetchInterviewer();
  }, [interviewerId, interviewers, interviewersLoading, navigate]);

  // Load interviews data when sessions are available
  useEffect(() => {
    const fetchInterviews = async () => {
      if (!interviewerId || allSessions.length === 0) {
        setInterviews([]);
        return;
      }
      
      try {
        // Fetch interviews based on session IDs
        const sessionIds = allSessions
          .filter(session => session.interviewer_id === interviewerId)
          .map(s => String(s.id));
        
        if (sessionIds.length === 0) {
          setInterviews([]);
          return;
        }
        
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
    };
    
    fetchInterviews();
  }, [interviewerId, allSessions]);

  // Get project name resolver function
  const getProjectName = (projectId: string | null | undefined) => {
    if (!projectId) return "No project";
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown project";
  };

  // Function to refresh interviewer data
  const refreshInterviewer = () => {
    fetchInterviewer();
  };

  return {
    interviewer,
    loading: loading || sessionsLoading,
    sessions: allSessions.filter(session => session.interviewer_id === interviewerId),
    interviews,
    activeTab,
    setActiveTab,
    getProjectName,
    projects,
    refreshInterviewer
  };
};
