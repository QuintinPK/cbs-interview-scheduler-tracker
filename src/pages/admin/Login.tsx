
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  
  // Get the page they were trying to access
  const from = location.state?.from?.pathname || "/admin/dashboard";
  
  // Generate CSRF token on component mount
  useEffect(() => {
    const token = generateCSRFToken();
    setCsrfToken(token);
    // Store token in localStorage for validation
    localStorage.setItem("csrf_token", token);
  }, []);
  
  // Generate a random CSRF token
  const generateCSRFToken = (): string => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  // Sanitize input to prevent XSS
  const sanitizeInput = (input: string): string => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate CSRF token
    const storedToken = localStorage.getItem("csrf_token");
    if (csrfToken !== storedToken) {
      toast({
        title: "Security Error",
        description: "Invalid session. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate inputs
    const sanitizedUsername = sanitizeInput(username.trim());
    if (!sanitizedUsername || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Rate limit login attempts (simulated)
      const lastAttempt = localStorage.getItem("last_login_attempt");
      const now = Date.now();
      if (lastAttempt && now - parseInt(lastAttempt) < 2000) {
        toast({
          title: "Too Many Attempts",
          description: "Please wait before trying again",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      localStorage.setItem("last_login_attempt", now.toString());
      
      const success = await login(sanitizedUsername, password);
      
      if (success) {
        // Generate a new CSRF token after successful login
        const newToken = generateCSRFToken();
        localStorage.setItem("csrf_token", newToken);
        
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        navigate(from, { replace: true });
      } else {
        toast({
          title: "Error",
          description: "Invalid credentials. Please check your username and password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="flex justify-center items-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-cbs">Admin Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="csrf_token" value={csrfToken} />
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-cbs hover:bg-cbs-light"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
              
              <div className="p-3 bg-muted/30 rounded-md mt-4">
                <p className="text-sm text-center font-medium">Default credentials</p>
                <p className="text-sm text-center text-muted-foreground">
                  Username: <span className="font-mono">admin</span><br />
                  Password: <span className="font-mono">admin123</span>
                </p>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  (Or your most recently updated password)
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Login;
