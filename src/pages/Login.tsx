
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";

// Demo credentials for testing
const demoCredentials = [
  { email: 'admin@schoolportal.com', password: 'admin123', role: 'admin' as UserRole },
  { email: 'teacher@schoolportal.com', password: 'teacher123', role: 'teacher' as UserRole },
  { email: 'student@schoolportal.com', password: 'student123', role: 'student' as UserRole },
  { email: 'parent@schoolportal.com', password: 'parent123', role: 'parent' as UserRole },
  { email: 'finance@schoolportal.com', password: 'finance123', role: 'finance' as UserRole },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    
    setIsLoading(true);
    try {
      await login(demoEmail, demoPassword);
      navigate('/dashboard');
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (error) {
      console.error('Demo login failed:', error);
      toast({
        title: "Login Failed",
        description: "Demo login failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 rounded-full bg-sms-primary w-12 h-12 flex items-center justify-center">
            <span className="text-white font-bold">SM</span>
          </div>
          <CardTitle className="text-2xl font-bold">School Portal</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@schoolportal.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm text-sms-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-6">
            <div className="text-center text-sm text-muted-foreground mb-2">
              Or use demo credentials:
            </div>
            <div className="flex flex-col gap-2">
              {demoCredentials.map((demo, index) => (
                <Button 
                  key={index}
                  variant="outline" 
                  className="w-full" 
                  onClick={() => handleDemoLogin(demo.email, demo.password)}
                  disabled={isLoading}
                >
                  Log in as {demo.role.charAt(0).toUpperCase() + demo.role.slice(1)}
                </Button>
              ))}
            </div>
            
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-sm text-muted-foreground text-center">
            © 2023 School Management Portal. All rights reserved.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
