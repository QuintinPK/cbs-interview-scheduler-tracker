
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSecureAuth } from "@/context/SecureAuthContext";

interface SecureProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const SecureProtectedRoute: React.FC<SecureProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, isAdmin, isLoading } = useSecureAuth();
  const location = useLocation();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cbs mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/secure-login" state={{ from: location }} replace />;
  }
  
  // Redirect to unauthorized page if admin access required but user is not admin
  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have admin privileges to access this page.</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

export default SecureProtectedRoute;
