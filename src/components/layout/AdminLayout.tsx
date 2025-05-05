
import React, { useState } from "react";
import {
  Home as HomeIcon,
  Briefcase as BriefcaseIcon,
  Users as UsersIcon,
  Calendar as CalendarIcon,
  List as ListIcon,
  DollarSign as DollarSignIcon,
  Tag as TagIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
} from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
  showFilters?: boolean;
}

const AdminLayout = ({ children, showFilters = true }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navigationItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: HomeIcon },
    { name: "Projects", href: "/admin/projects", icon: BriefcaseIcon },
    { name: "Interviewers", href: "/admin/interviewers", icon: UsersIcon },
    { name: "Scheduling", href: "/admin/scheduling", icon: CalendarIcon },
    { name: "Sessions", href: "/admin/sessions", icon: ListIcon },
    { name: "Costs", href: "/admin/costs", icon: DollarSignIcon },
    { name: "Tags", href: "/admin/tags", icon: TagIcon },
    { name: "Settings", href: "/admin/settings", icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-100 text-gray-700">
      {/* Sidebar */}
      <div className={`sidebar-container ${isSidebarOpen ? 'open' : 'closed'}`}>
        <Sidebar navigationItems={navigationItems}>
          <div className="py-4 px-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between text-sm font-medium rounded-md focus:outline-none">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar_url || ""} />
                      <AvatarFallback>{user?.email?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <span>{user?.email || "User"}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Sidebar>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
        <main>{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
