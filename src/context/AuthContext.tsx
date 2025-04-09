
import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updatePassword: (newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Check if user is already logged in
  useEffect(() => {
    const auth = localStorage.getItem("cbs_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);
  
  const login = async (username: string, password: string): Promise<boolean> => {
    // For demo purposes, hardcoded credentials
    if (username === "admin" && password === localStorage.getItem("cbs_admin_password") || password === "admin") {
      setIsAuthenticated(true);
      localStorage.setItem("cbs_auth", "true");
      return true;
    }
    return false;
  };
  
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("cbs_auth");
  };
  
  const updatePassword = async (newPassword: string): Promise<boolean> => {
    try {
      // In a real app, this would call an API to update the password
      // For this demo app, we're just storing it in localStorage
      localStorage.setItem("cbs_admin_password", newPassword);
      return true;
    } catch (error) {
      console.error("Error updating password:", error);
      return false;
    }
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
