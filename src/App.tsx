import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Session } from '@/pages/Session';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/admin/Dashboard';
import { Interviewers } from '@/pages/admin/Interviewers';
import { Projects } from '@/pages/admin/Projects';
import { Scheduling } from '@/pages/admin/Scheduling';
import { Sessions } from '@/pages/admin/Sessions';
import { Costs } from '@/pages/admin/Costs';
import { Settings } from '@/pages/admin/Settings';
import { NotFound } from '@/pages/NotFound';
import { useAuth } from '@/hooks/useAuth';
import { InterviewerDashboard } from '@/pages/admin/InterviewerDashboard';
import { Tags } from "@/pages/admin/Tags";

const App = () => {
  const { isLoggedIn } = useAuth();

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isLoggedIn ? <>{children}</> : <Navigate to="/login" />;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Mobile Interviewer Routes */}
          <Route path="/session" element={<Session />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/interviewers" element={<Interviewers />} />
          <Route path="/admin/interviewer/:id" element={<InterviewerDashboard />} />
          <Route path="/admin/projects" element={<Projects />} />
          <Route path="/admin/scheduling" element={<Scheduling />} />
          <Route path="/admin/sessions" element={<Sessions />} />
          <Route path="/admin/costs" element={<Costs />} />
          <Route path="/admin/tags" element={<Tags />} />
          <Route path="/admin/settings" element={<Settings />} />
        </Route>
        
        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
