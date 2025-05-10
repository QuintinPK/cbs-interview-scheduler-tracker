
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FilterProvider } from "./contexts/FilterContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/admin/Login";
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

const queryClient = new QueryClient();

// Protected route component needs to be inside the AuthProvider context
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    // Redirect to login page and remember where they were trying to go
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// AppRoutes component needs to be inside the AuthProvider
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/admin/login" element={<Login />} />
      
      {/* Protected Admin Routes */}
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute>
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
          </ProtectedRoute>
        } 
      />
      
      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// App component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
