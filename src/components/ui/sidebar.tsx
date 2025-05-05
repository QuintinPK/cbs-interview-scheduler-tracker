
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  navigationItems: NavigationItem[];
  children?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ navigationItems, children }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col w-64 border-r bg-white h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Admin Portal</h2>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
            
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-blue-100 text-blue-800" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-blue-800" : "text-gray-500")} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {children && (
        <div className="border-t mt-auto">
          {children}
        </div>
      )}
    </div>
  );
};
