
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { UserCircle } from "lucide-react";
import { useFilter } from "@/contexts/FilterContext";
import { useProjects } from "@/hooks/useProjects";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import IslandSelector from '@/components/ui/IslandSelector';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdminSection = location.pathname.includes('/admin');
  const { selectedProject, selectedIsland, setSelectedProject, setSelectedIsland } = useFilter();
  const { projects, loading } = useProjects();

  const handleProjectChange = (projectId: string) => {
    const project = projectId === 'all' ? null : projects.find(p => p.id === projectId) || null;
    setSelectedProject(project);
  };

  const handleIslandChange = (island: 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined) => {
    setSelectedIsland(island);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-cbs text-white p-4 shadow-md">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-4">
            <Link to="/" className="font-bold text-xl md:text-2xl">
              CBS Interviewer Tracker
            </Link>
            
            {isAdminSection ? (
              <Link to="/" className="flex items-center gap-2 hover:text-accent">
                <span>Exit Admin</span>
              </Link>
            ) : (
              <Link to="/admin/login" className="hover:text-accent">
                <UserCircle size={28} />
              </Link>
            )}
          </div>
          
          {!isAdminSection && (
            <div className="flex flex-wrap gap-3 items-center">
              <div className="w-48">
                <Select
                  value={selectedProject?.id || 'all'}
                  onValueChange={handleProjectChange}
                  disabled={loading}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-48">
                <IslandSelector
                  selectedIsland={selectedIsland}
                  onIslandChange={handleIslandChange}
                  placeholder="All Islands"
                  disabled={loading}
                  includeAll={true}
                />
              </div>
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 container mx-auto p-4 md:p-6">
        {children}
      </main>
      
      <footer className="bg-gray-100 py-4 border-t">
        <div className="container mx-auto text-center text-sm text-gray-600">
          © {new Date().getFullYear()} CBS Interviewer Time Tracking System
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
