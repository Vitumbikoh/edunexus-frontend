
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For demo, we'll just log the user in with the mock user
    login({
      id: '1',
      name: 'Demo User',
      email: 'admin@schoolportal.com',
      role: 'admin',
      avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
    });
    
    navigate('/dashboard');
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
              <Input id="email" type="email" placeholder="admin@schoolportal.com" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm text-sms-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input id="password" type="password" placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
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
