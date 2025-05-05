
import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  user: any | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  
  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const auth = localStorage.getItem("cbs_auth");
      if (auth === "true") {
        setIsLoggedIn(true);
      } else {
        // Clear any stale auth state
        setIsLoggedIn(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const login = async (username: string, password: string): Promise<boolean> => {
    console.log("Attempting login with username:", username);
    
    if (username === "admin" && password === "admin123") {
      setIsLoggedIn(true);
      setUser({ email: username });
      localStorage.setItem("cbs_auth", "true");
      return true;
    }
    
    return false;
  };
  
  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem("cbs_auth");
  };
  
  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
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
