
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';

// Demo users for testing role-based access
const demoUsers = [
  {
    id: '1',
    name: 'Demo Admin',
    email: 'admin@schoolportal.com',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
  },
  {
    id: '2',
    name: 'Demo Teacher',
    email: 'teacher@schoolportal.com',
    role: 'teacher',
    avatar: 'https://ui-avatars.com/api/?name=Teacher+User&background=F59E0B&color=fff'
  },
  {
    id: '3',
    name: 'Demo Student',
    email: 'student@schoolportal.com',
    role: 'student',
    avatar: 'https://ui-avatars.com/api/?name=Student+User&background=10B981&color=fff'
  },
  {
    id: '4',
    name: 'Demo Parent',
    email: 'parent@schoolportal.com',
    role: 'parent',
    avatar: 'https://ui-avatars.com/api/?name=Parent+User&background=2563EB&color=fff'
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Optionally, still handle manual form, but default to Admin
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(demoUsers[0]); // Admin login by default
    navigate('/dashboard');
  };

  // Handler for demo user login
  const handleDemoLogin = (userIdx: number) => {
    login(demoUsers[userIdx]);
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
            <Button type="submit" className="w-full">Sign In (as Admin)</Button>
          </form>
          <div className="mt-6">
            <div className="text-center text-sm text-muted-foreground mb-2">
              Or use demo credentials:
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full" onClick={() => handleDemoLogin(0)}>
                Log in as Admin
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleDemoLogin(1)}>
                Log in as Teacher
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleDemoLogin(2)}>
                Log in as Student
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleDemoLogin(3)}>
                Log in as Parent
              </Button>
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

