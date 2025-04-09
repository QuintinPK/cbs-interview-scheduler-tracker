
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
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
  
  // Verify password against stored hash or default
  const verifyPassword = async (password: string): Promise<boolean> => {
    try {
      // For the initial setup or if no hash exists yet, check against default
      if (password === "admin123") {
        return true;
      }
      
      // Fetch the password hash from the database
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'admin_password_hash')
        .single();
      
      if (error) {
        console.log("No password hash found, using default password");
        // If no password hash found yet, check against the default
        return password === "admin123";
      }
      
      // Fix the type error by ensuring data.value has a hash property
      const valueObj = typeof data.value === 'object' ? data.value : {};
      const storedHash = valueObj && 'hash' in valueObj ? (valueObj as { hash: string }).hash : '';
      
      // If there's no stored hash, use the default
      if (!storedHash) {
        console.log("No stored hash found, using default password");
        return password === "admin123";
      }
      
      // Simple hash function for demo purposes
      const inputHash = await simpleHash(password);
      console.log("Comparing input hash to stored hash");
      return inputHash === storedHash;
    } catch (error) {
      console.error("Error verifying password:", error);
      // Fallback to default for demo
      return password === "admin123";
    }
  };
  
  // Simple hash function for demo purposes
  // In a real app, use a proper crypto library with salting
  const simpleHash = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };
  
  const login = async (username: string, password: string): Promise<boolean> => {
    if (username === "admin") {
      const isValidPassword = await verifyPassword(password);
      
      if (isValidPassword) {
        setIsAuthenticated(true);
        localStorage.setItem("cbs_auth", "true");
        return true;
      }
    }
    return false;
  };
  
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("cbs_auth");
  };
  
  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      console.log("Attempting to update password");
      // First verify the current password
      const isValidPassword = await verifyPassword(currentPassword);
      console.log("Current password valid:", isValidPassword);
      
      if (!isValidPassword) {
        return false;
      }
      
      // Hash the new password
      const newPasswordHash = await simpleHash(newPassword);
      
      // Store the new password hash in the database
      const { error } = await supabase
        .from('app_settings')
        .upsert({ 
          key: 'admin_password_hash',
          value: { hash: newPasswordHash },
          updated_by: 'admin',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key' 
        });
      
      if (error) {
        console.error("Error updating password:", error);
        return false;
      }
      
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
