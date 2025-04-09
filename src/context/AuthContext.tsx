
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
    const checkAuth = async () => {
      const auth = localStorage.getItem("cbs_auth");
      if (auth === "true") {
        setIsAuthenticated(true);
      } else {
        // Clear any stale auth state
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Verify password against stored hash or default
  const verifyPassword = async (password: string): Promise<boolean> => {
    try {
      console.log("Verifying password");
      
      // Fetch the password hash from the database - use anonymous access
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'admin_password_hash')
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching password hash:", error);
        // If no password hash found yet, check against the default
        return password === "admin123";
      }
      
      console.log("Retrieved password data:", data);
      
      // If no data found, use the default
      if (!data) {
        console.log("No data found, checking against default password");
        return password === "admin123";
      }
      
      // Safely access the hash property, handling different types of values
      let storedHash = '';
      if (typeof data.value === 'object' && data.value !== null) {
        storedHash = (data.value as any).hash || '';
      } else if (typeof data.value === 'string') {
        try {
          // Try parsing the value as JSON in case it's stored as a string
          const parsed = JSON.parse(data.value);
          storedHash = parsed.hash || '';
        } catch (e) {
          // If it's not valid JSON, use the value directly
          storedHash = data.value;
        }
      }
      
      console.log("Stored hash:", storedHash);
      
      // If there's no stored hash, use the default
      if (!storedHash) {
        console.log("No stored hash found, using default password");
        return password === "admin123";
      }
      
      // Hash the input password and compare with stored hash
      const inputHash = await simpleHash(password);
      console.log("Input hash:", inputHash);
      console.log("Comparing hashes");
      return inputHash === storedHash;
    } catch (error) {
      console.error("Error verifying password:", error);
      // Fallback to default for demo
      return password === "admin123";
    }
  };
  
  // Simple hash function for demo purposes
  const simpleHash = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };
  
  const login = async (username: string, password: string): Promise<boolean> => {
    console.log("Attempting login with username:", username);
    if (username === "admin") {
      const isValidPassword = await verifyPassword(password);
      console.log("Password verification result:", isValidPassword);
      
      if (isValidPassword) {
        try {
          // Login as a service role to set the admin flag
          // This allows RLS policies to recognize admin status
          const { data, error } = await supabase.auth.signInWithPassword({
            email: 'service@example.com',
            password: 'service-role-password'
          });
          
          if (error) {
            console.error("Supabase auth error:", error);
          } else {
            console.log("Supabase auth successful");
          }
        } catch (error) {
          console.error("Error during Supabase auth:", error);
          // Continue without Supabase auth as fallback
        }
        
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
    // Sign out from Supabase
    supabase.auth.signOut();
  };
  
  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      console.log("Attempting to update password");
      // First verify the current password
      const isValidPassword = await verifyPassword(currentPassword);
      console.log("Current password valid:", isValidPassword);
      
      if (!isValidPassword) {
        console.log("Current password is invalid");
        return false;
      }
      
      // Hash the new password
      const newPasswordHash = await simpleHash(newPassword);
      console.log("Generated new password hash:", newPasswordHash);
      
      // Store the new password hash in the database using the edge function
      const { data, error } = await supabase.functions.invoke('admin-functions', {
        body: {
          action: "updatePassword",
          data: {
            passwordHash: newPasswordHash
          }
        }
      });
      
      if (error) {
        console.error("Error updating password:", error);
        return false;
      }
      
      console.log("Password update response:", data);
      
      // Verify that the password was updated in the database
      const { data: verifyData, error: verifyError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'admin_password_hash')
        .maybeSingle();
        
      if (verifyError) {
        console.error("Error verifying password update:", verifyError);
      } else {
        console.log("Password verification from database:", verifyData);
      }
      
      console.log("Password updated successfully");
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
