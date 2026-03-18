import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-card">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <img src="/polymilesicon.png" alt="EduNexus Portal Logo" className="w-16 h-16 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">Password Reset</CardTitle>
          <CardDescription>
            Password resets are handled by your school administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-center">
            <p>
              To change your password, please contact your system administrator.
            </p>
            <p className="text-sm text-muted-foreground">
              You can contact them via your school's support email or ask them directly.
            </p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/login')} className="w-full">Back to Login</Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-sm text-muted-foreground text-center">
            © {currentYear} EduNexus School Management Portal. All rights reserved.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
