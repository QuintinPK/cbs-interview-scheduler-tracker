
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Session, Interviewer } from "@/types";
import { formatDateTime, calculateDuration } from "@/lib/utils";

const InterviewerDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interviewer, setInterviewer] = useState<Interviewer | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch interviewer data
        const { data: interviewerData, error: interviewerError } = await supabase
          .from('interviewers')
          .select('*')
          .eq('id', id)
          .single();
          
        if (interviewerError) throw interviewerError;
        setInterviewer(interviewerData);
        
        // Fetch sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('interviewer_id', id)
          .order('start_time', { ascending: false });
          
        if (sessionsError) throw sessionsError;
        
        const transformedSessions = sessionsData.map(session => ({
          ...session,
          start_latitude: session.start_latitude !== null ? Number(session.start_latitude) : null,
          start_longitude: session.start_longitude !== null ? Number(session.start_longitude) : null,
          end_latitude: session.end_latitude !== null ? Number(session.end_latitude) : null,
          end_longitude: session.end_longitude !== null ? Number(session.end_longitude) : null,
        }));
        
        setSessions(transformedSessions || []);
      } catch (error) {
        console.error("Error fetching interviewer data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Calculate total active time
  const calculateTotalTime = () => {
    if (!sessions.length) return "0h 0m";
    
    let totalMinutes = 0;
    
    sessions.forEach(session => {
      if (session.start_time && session.end_time) {
        const start = new Date(session.start_time);
        const end = new Date(session.end_time);
        totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    
    return `${hours}h ${minutes}m`;
  };
  
  // Active sessions
  const activeSessions = sessions.filter(session => session.is_active);
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              className="mb-2 -ml-4"
              onClick={() => navigate("/admin/interviewers")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Interviewers
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">
              {loading ? "Loading..." : interviewer ? `${interviewer.first_name} ${interviewer.last_name}'s Dashboard` : "Interviewer Not Found"}
            </h1>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate(`/admin/scheduling?interviewer=${interviewer?.code}`)}
              disabled={loading || !interviewer}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          </div>
        </div>
        
        {interviewer && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Interviewer Code</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{interviewer.code}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Active Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-cbs" />
                  <p className="text-2xl font-bold">{calculateTotalTime()}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-2 ${activeSessions.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <p className="text-2xl font-bold">{activeSessions.length > 0 ? 'Active' : 'Inactive'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="contact">Contact Information</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Recent Activity</h3>
                    <p className="text-muted-foreground">
                      {sessions.length > 0 
                        ? `Last active: ${formatDateTime(sessions[0].start_time)}`
                        : "No activity recorded yet"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Current Status</h3>
                    <p className="text-muted-foreground">
                      {activeSessions.length > 0
                        ? `Active since ${formatDateTime(activeSessions[0].start_time)}`
                        : "Not currently active"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Total Sessions</h3>
                    <p className="text-muted-foreground">{sessions.length} sessions recorded</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sessions" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Session History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            No sessions recorded
                          </TableCell>
                        </TableRow>
                      ) : (
                        sessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>{formatDateTime(session.start_time)}</TableCell>
                            <TableCell>
                              {session.end_time ? formatDateTime(session.end_time) : 'Active'}
                            </TableCell>
                            <TableCell>
                              {session.end_time 
                                ? calculateDuration(session.start_time, session.end_time)
                                : 'Ongoing'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className={`h-2 w-2 rounded-full mr-2 ${session.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                {session.is_active ? 'Active' : 'Completed'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {session.start_latitude && session.start_longitude ? (
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {session.start_latitude.toFixed(4)}, {session.start_longitude.toFixed(4)}
                                  </span>
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contact" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Name</h3>
                    <p className="text-muted-foreground">
                      {interviewer?.first_name} {interviewer?.last_name}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Phone</h3>
                    <p className="text-muted-foreground">
                      {interviewer?.phone || 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Email</h3>
                    <p className="text-muted-foreground">
                      {interviewer?.email || 'Not provided'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default InterviewerDashboard;
