
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { UserCircle } from "lucide-react";

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdminSection = location.pathname.includes('/admin');
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-cbs text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="font-bold text-xl md:text-2xl">
            FieldSync
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
      </header>
      
      <main className="flex-1 container mx-auto p-4 md:p-6">
        {children}
      </main>
      
      <footer className="bg-gray-100 py-4 border-t">
        <div className="container mx-auto text-center text-sm text-gray-600">
          © {new Date().getFullYear()} FieldSync
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
