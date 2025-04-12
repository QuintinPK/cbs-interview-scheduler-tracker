
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Calendar,
  Settings,
  DollarSign,
  Building
} from "lucide-react";

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function AdminNav() {
  const { pathname } = useLocation();
  
  const links: NavLink[] = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: "Sessions",
      href: "/admin/sessions",
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      label: "Interviewers",
      href: "/admin/interviewers",
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Projects",
      href: "/admin/projects",
      icon: <Building className="h-4 w-4" />,
    },
    {
      label: "Scheduling",
      href: "/admin/scheduling",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      label: "Costs",
      href: "/admin/costs",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <nav className="grid gap-1 md:pt-0">
      {links.map((link) => (
        <Link 
          key={link.href} 
          to={link.href} 
          aria-current={pathname === link.href ? "page" : undefined}
        >
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start font-normal",
              pathname === link.href && "bg-muted font-medium"
            )}
          >
            {link.icon}
            <span className="ml-2">{link.label}</span>
          </Button>
        </Link>
      ))}
    </nav>
  );
}
