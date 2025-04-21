
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, UserRole } from '@/contexts/AuthContext';

// Demo users, now including Finance for strict roles
const demoUsers = [
  {
    id: '1',
    name: 'Demo Admin',
    email: 'admin@schoolportal.com',
    role: 'admin' as UserRole,
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
  },
  {
    id: '2',
    name: 'Demo Teacher',
    email: 'teacher@schoolportal.com',
    role: 'teacher' as UserRole,
    avatar: 'https://ui-avatars.com/api/?name=Teacher+User&background=F59E0B&color=fff'
  },
  {
    id: '3',
    name: 'Demo Student',
    email: 'student@schoolportal.com',
    role: 'student' as UserRole,
    avatar: 'https://ui-avatars.com/api/?name=Student+User&background=10B981&color=fff'
  },
  {
    id: '4',
    name: 'Demo Parent',
    email: 'parent@schoolportal.com',
    role: 'parent' as UserRole,
    avatar: 'https://ui-avatars.com/api/?name=Parent+User&background=2563EB&color=fff'
  },
  {
    id: '5',
    name: 'Demo Finance',
    email: 'finance@schoolportal.com',
    role: 'finance' as UserRole,
    avatar: 'https://ui-avatars.com/api/?name=Finance+User&background=EC4899&color=fff'
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(demoUsers[0]); // Admin login by default
    navigate('/dashboard');
  };

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
              <Button variant="outline" className="w-full" onClick={() => handleDemoLogin(4)}>
                Log in as Finance
              </Button>
            </div>
            <div className="mt-6 border rounded-lg p-3 bg-gray-50 overflow-x-auto">
              <h3 className="text-sm font-bold mb-2 text-gray-700">Demo Credentials & Role Permissions</h3>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr>
                    <th className="font-bold py-1 pr-3">Role</th>
                    <th className="font-bold py-1 pr-3">Email</th>
                    <th className="font-bold py-1 pr-3">Sample Abilities</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="py-1 pr-3 font-semibold text-gray-800">Admin</td>
                    <td className="py-1 pr-3">admin@schoolportal.com</td>
                    <td className="py-1 pr-3">All access</td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-1 pr-3 font-semibold text-yellow-600">Teacher</td>
                    <td className="py-1 pr-3">teacher@schoolportal.com</td>
                    <td className="py-1 pr-3">View students, subjects, schedules</td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-1 pr-3 font-semibold text-green-600">Student</td>
                    <td className="py-1 pr-3">student@schoolportal.com</td>
                    <td className="py-1 pr-3">View students & subjects, edit only own profile</td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-1 pr-3 font-semibold text-blue-600">Parent</td>
                    <td className="py-1 pr-3">parent@schoolportal.com</td>
                    <td className="py-1 pr-3">View child grades & attendance, pay fees</td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-1 pr-3 font-semibold text-pink-600">Finance</td>
                    <td className="py-1 pr-3">finance@schoolportal.com</td>
                    <td className="py-1 pr-3">View & manage finance only</td>
                  </tr>
                </tbody>
              </table>
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
