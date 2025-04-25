
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { FilterProvider } from "@/contexts/FilterContext";
import Index from "@/pages/Index";
import Sessions from "@/pages/admin/Sessions";
import Interviewers from "@/pages/admin/Interviewers";
import Projects from "@/pages/admin/Projects";
import Dashboard from "@/pages/admin/Dashboard";
import Login from "@/pages/admin/Login";
import { OfflineProvider } from "@/contexts/OfflineContext";
import SyncStatusBar from "@/components/sync/SyncStatusBar";
import { AuthProvider } from "@/context/AuthContext";
import Costs from "@/pages/admin/Costs";
import InteractiveScheduling from "@/pages/admin/InteractiveScheduling";

function App() {
  return (
    <AuthProvider>
      <OfflineProvider>
        <FilterProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin/sessions" element={<Sessions />} />
              <Route path="/admin/interviewers" element={<Interviewers />} />
              <Route path="/admin/projects" element={<Projects />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/costs" element={<Costs />} />
              <Route path="/admin/scheduling" element={<InteractiveScheduling />} />
            </Routes>
            <Toaster />
          </Router>
          <SyncStatusBar />
        </FilterProvider>
      </OfflineProvider>
    </AuthProvider>
  );
}

export default App;
