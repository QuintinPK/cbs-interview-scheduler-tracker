
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SecureAuthProvider } from "./context/SecureAuthContext";
import { FilterProvider } from "./contexts/FilterContext";
import SecureProtectedRoute from "./components/auth/SecureProtectedRoute";

// Pages
import Index from "./pages/Index";
import SecureLogin from "./pages/admin/SecureLogin";
import Dashboard from "./pages/admin/Dashboard";
import Sessions from "./pages/admin/Sessions";
import Interviewers from "./pages/admin/Interviewers";
import InterviewerDashboard from "./pages/admin/InterviewerDashboard";
import InteractiveScheduling from "./pages/admin/InteractiveScheduling";
import Costs from "./pages/admin/Costs";
import Settings from "./pages/admin/Settings";
import Projects from "./pages/admin/Projects"; 
import ProjectAssign from "./pages/admin/ProjectAssign";
import NotFound from "./pages/NotFound";

// AppRoutes component with secure authentication
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/admin/secure-login" element={<SecureLogin />} />
      
      {/* Redirect old login route to new secure login */}
      <Route path="/admin/login" element={<Navigate to="/admin/secure-login" replace />} />
      
      {/* Admin Routes - authentication disabled */}
      <Route 
        path="/admin/*" 
        element={
          <FilterProvider>
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="interviewers" element={<Interviewers />} />
              <Route path="interviewer/:interviewerId" element={<InterviewerDashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/assign/:projectId" element={<ProjectAssign />} />
              <Route path="costs" element={<Costs />} />
              <Route path="settings" element={<Settings />} />
              <Route path="scheduling" element={<InteractiveScheduling />} />
              <Route path="interactive-scheduling" element={<InteractiveScheduling />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </FilterProvider>
        } 
      />
      
      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Create a new QueryClient instance outside of component rendering
const queryClient = new QueryClient();

// App component with secure authentication
const App = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SecureAuthProvider>
          <TooltipProvider>
            <AppRoutes />
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </SecureAuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
