import { useState, useEffect } from "react";
import { Session } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const useInterviewerMetrics = (interviewerId?: string) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [daysSinceLastActive, setDaysSinceLastActive] = useState<number | null>(null);
  const [avgDaysPerWeek, setAvgDaysPerWeek] = useState<number>(0);
  const [daysWorkedInMonth, setDaysWorkedInMonth] = useState<number>(0);
  const [sessionsInPlanTime, setSessionsInPlanTime] = useState<number>(0);
  const [avgSessionDuration, setAvgSessionDuration] = useState<string>("0h 0m");
  const [earliestStartTime, setEarliestStartTime] = useState<string | null>(null);
  const [latestEndTime, setLatestEndTime] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!interviewerId) return;

      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('interviewer_id', interviewerId)
          .order('start_time', { ascending: false });

        if (error) throw error;
        
        // Transform numeric string coordinates to numbers
        const transformedSessions = data.map(session => ({
          ...session,
          start_latitude: session.start_latitude !== null ? Number(session.start_latitude) : null,
          start_longitude: session.start_longitude !== null ? Number(session.start_longitude) : null,
          end_latitude: session.end_latitude !== null ? Number(session.end_latitude) : null,
          end_longitude: session.end_longitude !== null ? Number(session.end_longitude) : null,
        }));
        
        setSessions(transformedSessions);
        calculateMetrics(transformedSessions);
      } catch (error) {
        console.error("Error fetching sessions for metrics:", error);
      }
    };

    fetchSessions();
  }, [interviewerId]);

  const calculateMetrics = (sessions: Session[]) => {
    if (!sessions || sessions.length === 0) {
      setDaysSinceLastActive(null);
      setAvgDaysPerWeek(0);
      setDaysWorkedInMonth(0);
      setSessionsInPlanTime(0);
      setAvgSessionDuration("0h 0m");
      setEarliestStartTime(null);
      setLatestEndTime(null);
      return;
    }

    // Calculate days since last active
    const lastActive = new Date(sessions[0].start_time);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));
    setDaysSinceLastActive(diffInDays);

    // Calculate average days per week
    const sessionsByWeek: { [key: string]: number } = {};
    sessions.forEach(session => {
      const weekKey = new Date(session.start_time).toISOString().slice(0, 10);
      sessionsByWeek[weekKey] = (sessionsByWeek[weekKey] || 0) + 1;
    });
    const avgDays = Object.keys(sessionsByWeek).length / 7;
    setAvgDaysPerWeek(avgDays);

    // Calculate days worked in the current month
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Set<string>();
    sessions.forEach(session => {
      const sessionDate = new Date(session.start_time);
      if (sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear) {
        daysInMonth.add(sessionDate.toISOString().slice(0, 10));
      }
    });
    setDaysWorkedInMonth(daysInMonth.size);

    // Calculate sessions in planned time (example: assuming 9am-5pm is planned time)
    let sessionsInTime = 0;
    sessions.forEach(session => {
      const startTime = new Date(session.start_time);
      const startHour = startTime.getHours();
      if (startHour >= 9 && startHour < 17) {
        sessionsInTime++;
      }
    });
    setSessionsInPlanTime(sessionsInTime);

    // Calculate average session duration
    let totalDuration = 0;
    let validSessionCount = 0;
    sessions.forEach(session => {
      if (session.end_time) {
        const start = new Date(session.start_time).getTime();
        const end = new Date(session.end_time).getTime();
        totalDuration += (end - start);
        validSessionCount++;
      }
    });

    const averageDurationMs = validSessionCount > 0 ? totalDuration / validSessionCount : 0;
    const avgHours = Math.floor(averageDurationMs / (1000 * 60 * 60));
    const avgMinutes = Math.floor((averageDurationMs % (1000 * 60 * 60)) / (1000 * 60));
    setAvgSessionDuration(`${avgHours}h ${avgMinutes}m`);

    // Find earliest start time and latest end time
    const sortedSessions = [...sessions].sort((a, b) => {
      const dateA = new Date(a.start_time).getTime();
      const dateB = new Date(b.start_time).getTime();
      return dateA - dateB;
    });

    setEarliestStartTime(sortedSessions[0]?.start_time || null);

    const sortedSessionsByEndTime = [...sessions].sort((a, b) => {
      const dateA = a.end_time ? new Date(a.end_time).getTime() : 0;
      const dateB = b.end_time ? new Date(b.end_time).getTime() : 0;
      return dateB - dateA;
    });

    setLatestEndTime(sortedSessionsByEndTime[0]?.end_time || null);
  };

  return {
    daysSinceLastActive,
    avgDaysPerWeek,
    daysWorkedInMonth,
    sessionsInPlanTime,
    avgSessionDuration,
    earliestStartTime,
    latestEndTime,
    sessions
  };
};
