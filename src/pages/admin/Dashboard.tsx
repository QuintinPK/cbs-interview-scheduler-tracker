
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import ActiveInterviewersCard from "@/components/admin/ActiveInterviewersCard";
import RecentlyActiveCard from "@/components/admin/RecentlyActiveCard";
import { Session, Interviewer } from "@/types";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load interviewers
        const { data: interviewersData, error: interviewersError } = await supabase
          .from('interviewers')
          .select('*');
          
        if (interviewersError) throw interviewersError;
        setInterviewers(interviewersData || []);
        
        // Load sessions from today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .gte('start_time', today.toISOString());
          
        if (sessionsError) throw sessionsError;
        setSessions(sessionsData || []);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Calculate stats
  const activeSessionsCount = sessions.filter(s => s.is_active).length;
  const totalSessionsToday = sessions.length;
  const hoursToday = sessions.reduce((total, session) => {
    if (!session.end_time) return total;
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return total + durationHours;
  }, 0);
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActiveInterviewersCard />
          <RecentlyActiveCard sessions={sessions} interviewers={interviewers} />
        </div>
        
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Interviewers</p>
              <p className="text-2xl font-bold text-cbs">{interviewers.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Active Sessions</p>
              <p className="text-2xl font-bold text-cbs">{activeSessionsCount}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Sessions Today</p>
              <p className="text-2xl font-bold text-cbs">{totalSessionsToday}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Hours Today</p>
              <p className="text-2xl font-bold text-cbs">{Math.round(hoursToday)}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
