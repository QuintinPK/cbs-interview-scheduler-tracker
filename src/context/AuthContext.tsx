
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  verifyPassword: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const auth = localStorage.getItem("cbs_auth");
      // Only check localStorage if it exists
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
      // Fetch the password hash from the database - use anonymous access
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'admin_password_hash')
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching password hash:", error);
        // Instead of defaulting to plain text comparison, use timing-safe comparison
        return await secureCompare(password, "admin123");
      }
      
      // Safely access the hash property, handling different types of values
      let storedHash = '';
      if (typeof data?.value === 'object' && data.value !== null) {
        storedHash = (data.value as any).hash || '';
      }
      
      // If there's no stored hash, use secure comparison for the default
      if (!storedHash) {
        return await secureCompare(password, "admin123");
      }
      
      // Hash the input password and compare with stored hash using timing-safe comparison
      const inputHash = await simpleHash(password);
      return await secureCompare(inputHash, storedHash);
    } catch (error) {
      console.error("Error verifying password:", error);
      // Use secure comparison even in error cases
      return await secureCompare(password, "admin123");
    }
  };
  
  // Secure comparison function to prevent timing attacks
  const secureCompare = async (a: string, b: string): Promise<boolean> => {
    // Convert strings to Uint8Arrays for constant-time comparison
    const encoder = new TextEncoder();
    const aBytes = encoder.encode(a);
    const bBytes = encoder.encode(b);
    
    // If lengths are different, return false but still take the same amount of time
    if (aBytes.length !== bBytes.length) {
      // Perform comparison anyway to maintain constant time
      let result = 0;
      const minLength = Math.min(aBytes.length, bBytes.length);
      for (let i = 0; i < minLength; i++) {
        result |= aBytes[i] ^ bBytes[i];
      }
      return false;
    }
    
    // Constant-time comparison
    let result = 0;
    for (let i = 0; i < aBytes.length; i++) {
      result |= aBytes[i] ^ bBytes[i];
    }
    return result === 0;
  };
  
  // Simple hash function using SHA-256
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
        
        // Set auth state and persist it in localStorage
        setIsAuthenticated(true);
        localStorage.setItem("cbs_auth", "true");
        return true;
      }
    }
    return false;
  };
  
  const logout = () => {
    // Remove authenticated state
    setIsAuthenticated(false);
    localStorage.removeItem("cbs_auth");
    // Sign out from Supabase
    supabase.auth.signOut();
  };
  
  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      // First verify the current password
      const isValidPassword = await verifyPassword(currentPassword);
      
      if (!isValidPassword) {
        return false;
      }
      
      // Hash the new password
      const newPasswordHash = await simpleHash(newPassword);
      
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
      
      return true;
    } catch (error) {
      console.error("Error updating password:", error);
      return false;
    }
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, updatePassword, verifyPassword }}>
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
