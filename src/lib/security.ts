
import { supabase } from "@/integrations/supabase/client";

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; lastAttempt: number }>();

// Rate limiting function
export const checkRateLimit = (key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record) {
    rateLimitStore.set(key, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Reset if window has passed
  if (now - record.lastAttempt > windowMs) {
    rateLimitStore.set(key, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Check if limit exceeded
  if (record.count >= maxAttempts) {
    return false;
  }
  
  // Increment counter
  record.count++;
  record.lastAttempt = now;
  return true;
};

// Clear rate limit for a key
export const clearRateLimit = (key: string): void => {
  rateLimitStore.delete(key);
};

// Audit logging function
export const logAuditEvent = async (
  action: string,
  tableName?: string,
  recordId?: string,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;
    
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues || null,
      new_values: newValues || null,
      ip_address: null, // Would need server-side implementation for real IP
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};

// Secure session storage
export const secureStorage = {
  setItem: (key: string, value: string): void => {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to store item securely:', error);
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('Failed to retrieve item securely:', error);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove item securely:', error);
    }
  },
  
  clear: (): void => {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Check if user has required role
export const hasRequiredRole = async (requiredRole: 'admin' | 'interviewer'): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', requiredRole)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user role:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
};

// Generate secure random string
export const generateSecureId = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomArray[i] % chars.length);
  }
  
  return result;
};
