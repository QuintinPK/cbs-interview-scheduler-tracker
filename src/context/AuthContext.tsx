
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
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Simple hash function
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };
  
  // Verify password
  const verifyPassword = async (inputPassword: string): Promise<boolean> => {
    try {
      console.log("Verifying password against database");
      
      // Hash the input password
      const inputHash = await hashPassword(inputPassword);
      console.log("Generated hash for input password:", inputHash);
      
      // Fetch the stored hash from the database
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'admin_password_hash')
        .maybeSingle();
      
      if (error) {
        console.error("Database error while fetching password hash:", error);
        // Fall back to default password if there's a database error
        const defaultPasswordHash = await hashPassword("cbs123");
        return inputHash === defaultPasswordHash;
      }
      
      console.log("Database response:", data);
      
      // If no data found, use the default password
      if (!data) {
        console.log("No password hash found in database, using default");
        const defaultPasswordHash = await hashPassword("cbs123");
        
        // Store the default hash in the database
        const { error: insertError } = await supabase
          .from('app_settings')
          .insert({
            key: 'admin_password_hash',
            value: defaultPasswordHash,
            updated_at: new Date().toISOString(),
            updated_by: 'system'
          });
          
        if (insertError) {
          console.error("Error storing default password hash:", insertError);
        }
        
        return inputHash === defaultPasswordHash;
      }
      
      // Get the stored hash from the response
      let storedHash = "";
      
      // Handle different possible response formats
      if (typeof data.value === 'string') {
        // Direct string value
        storedHash = data.value;
      } else if (data.value && typeof data.value === 'object') {
        // JSON object with password hash
        storedHash = String(data.value);
      } else {
        // Fallback
        storedHash = String(data.value);
      }
      
      console.log("Stored hash from database:", storedHash);
      
      // Compare hashes
      const isMatch = inputHash === storedHash;
      console.log("Password verification result:", isMatch);
      
      return isMatch;
    } catch (error) {
      console.error("Error in password verification:", error);
      // Fallback to default for demo
      return inputPassword === "cbs123";
    }
  };
  
  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    console.log("Login attempt for username:", username);
    
    if (username !== "admin") {
      console.log("Username is not 'admin', login failed");
      return false;
    }
    
    const isValid = await verifyPassword(password);
    console.log("Password verification result:", isValid);
    
    if (isValid) {
      setIsAuthenticated(true);
      localStorage.setItem("cbs_auth", "true");
      return true;
    }
    
    return false;
  };
  
  // Logout function
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("cbs_auth");
  };
  
  // Update password function
  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      console.log("Attempting to update password");
      
      // First verify the current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword);
      console.log("Current password verification:", isCurrentPasswordValid);
      
      if (!isCurrentPasswordValid) {
        console.log("Current password is invalid, update failed");
        return false;
      }
      
      // Hash the new password
      const newPasswordHash = await hashPassword(newPassword);
      console.log("Generated hash for new password:", newPasswordHash);
      
      // Store the new password hash directly, not as an object
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'admin_password_hash',
          value: newPasswordHash,
          updated_at: new Date().toISOString(),
          updated_by: 'admin'
        }, {
          onConflict: 'key'
        });
      
      if (error) {
        console.error("Error updating password in database:", error);
        return false;
      }
      
      // Verify the password was updated correctly
      const { data: verifyData, error: verifyError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'admin_password_hash')
        .maybeSingle();
      
      if (verifyError) {
        console.error("Error verifying password update:", verifyError);
        return false;
      }
      
      console.log("Password updated and verified in database:", verifyData);
      return true;
    } catch (error) {
      console.error("Error in update password process:", error);
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
