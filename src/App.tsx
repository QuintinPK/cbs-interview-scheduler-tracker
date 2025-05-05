
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Changed from @/hooks/useAuth
import NotFound from '@/pages/NotFound'; // Changed from destructured import
import Dashboard from '@/pages/admin/Dashboard'; // Changed from destructured import
import Interviewers from '@/pages/admin/Interviewers'; // Changed from destructured import
import Projects from '@/pages/admin/Projects'; // Changed from destructured import
import InteractiveScheduling from '@/pages/admin/InteractiveScheduling'; // Changed from Scheduling
import Sessions from '@/pages/admin/Sessions'; // Changed from destructured import
import Costs from '@/pages/admin/Costs'; // Changed from destructured import
import Settings from '@/pages/admin/Settings'; // Changed from destructured import
import InterviewerDashboard from '@/pages/admin/InterviewerDashboard'; // Changed from destructured import
import Tags from '@/pages/admin/Tags'; // Changed from destructured import

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
        <Route path="/login" element={<div>Login Page</div>} /> {/* Placeholder until Login page is created */}
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute children={<></>} />}>
          {/* Mobile Interviewer Routes */}
          <Route path="/session" element={<div>Session Page</div>} /> {/* Placeholder until Session page is created */}
          
          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/interviewers" element={<Interviewers />} />
          <Route path="/admin/interviewer/:id" element={<InterviewerDashboard />} />
          <Route path="/admin/projects" element={<Projects />} />
          <Route path="/admin/scheduling" element={<InteractiveScheduling />} />
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
