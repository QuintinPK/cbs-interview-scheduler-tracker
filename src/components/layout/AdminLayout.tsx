
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FilterProvider } from '@/contexts/FilterContext';
import GlobalFilter from '@/components/GlobalFilter';
import { 
  BarChart, Users, Calendar, ClipboardList, 
  LogOut, Home, Menu, X, DollarSign, Settings, Folder
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
  showFilters?: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, showFilters = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  const handleLogout = () => {
    logout();
    navigate("/");
  };
  
  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: <BarChart className="h-5 w-5" /> },
    { path: "/admin/sessions", label: "Session Logs", icon: <ClipboardList className="h-5 w-5" /> },
    { path: "/admin/interviewers", label: "Interviewers", icon: <Users className="h-5 w-5" /> },
    { path: "/admin/projects", label: "Projects", icon: <Folder className="h-5 w-5" /> },
    { path: "/admin/scheduling", label: "Scheduling", icon: <Calendar className="h-5 w-5" /> },
    { path: "/admin/costs", label: "Costs", icon: <DollarSign className="h-5 w-5" /> },
  ];
  
  // Determine if we should show filters based on the current route
  const shouldShowFilters = () => {
    if (!showFilters) return false;
    
    const routesWithFilters = [
      '/admin/dashboard',
      '/admin/sessions',
      '/admin/interviewers',
      '/admin/projects',
      '/admin/scheduling',
      '/admin/costs'
    ];
    
    return routesWithFilters.some(route => location.pathname === route || location.pathname.startsWith(route + '/'));
  };
  
  return (
    <FilterProvider>
      <div className="min-h-screen flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden bg-cbs text-white p-4 flex justify-between items-center">
          <Link to="/admin/dashboard" className="font-bold text-xl">
            CBS Admin
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-cbs text-white p-4">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md",
                    location.pathname === item.path
                      ? "bg-white/20 font-semibold"
                      : "hover:bg-white/10"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {/* Settings link moved above logout */}
              <Link
                to="/admin/settings"
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md",
                  location.pathname === "/admin/settings"
                    ? "bg-white/20 font-semibold"
                    : "hover:bg-white/10"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 p-2 rounded-md w-full text-left hover:bg-white/10"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
              
              <Link
                to="/"
                className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="h-5 w-5" />
                <span>Main App</span>
              </Link>
            </nav>
          </div>
        )}
        
        <div className="flex-1 flex">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 bg-cbs text-white p-4 h-screen sticky top-0">
            <div className="flex flex-col h-full">
              <Link to="/admin/dashboard" className="font-bold text-xl mb-6">
                CBS Admin
              </Link>
              
              <nav className="space-y-1 flex-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md",
                      location.pathname === item.path
                        ? "bg-white/20 font-semibold"
                        : "hover:bg-white/10"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              
              <div className="pt-4 border-t border-white/20 space-y-1">
                {/* Settings link moved above logout */}
                <Link
                  to="/admin/settings"
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md",
                    location.pathname === "/admin/settings"
                      ? "bg-white/20 font-semibold"
                      : "hover:bg-white/10"
                  )}
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Link>
                
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 w-full justify-start text-white hover:bg-white/10 hover:text-white p-2 h-auto font-normal"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </Button>
                
                <Link
                  to="/"
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10"
                >
                  <Home className="h-5 w-5" />
                  <span>Main App</span>
                </Link>
              </div>
            </div>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 bg-background min-h-screen">
            {shouldShowFilters() && (
              <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
                <h2 className="text-sm font-medium mb-3">Filters</h2>
                <GlobalFilter />
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </FilterProvider>
  );
};

export default AdminLayout;
