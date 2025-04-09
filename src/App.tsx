
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Sessions from "./pages/admin/Sessions";
import Interviewers from "./pages/admin/Interviewers";
import InterviewerDashboard from "./pages/admin/InterviewerDashboard";
import Scheduling from "./pages/admin/Scheduling";
import Costs from "./pages/admin/Costs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    // Redirect to login page and remember where they were trying to go
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// Routes component needs to be inside AuthProvider
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/admin/login" element={<Login />} />
      
      {/* Protected Admin Routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/sessions" 
        element={
          <ProtectedRoute>
            <Sessions />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/interviewers" 
        element={
          <ProtectedRoute>
            <Interviewers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/interviewer/:id" 
        element={
          <ProtectedRoute>
            <InterviewerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/scheduling" 
        element={
          <ProtectedRoute>
            <Scheduling />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/costs" 
        element={
          <ProtectedRoute>
            <Costs />
          </ProtectedRoute>
        } 
      />
      
      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

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
