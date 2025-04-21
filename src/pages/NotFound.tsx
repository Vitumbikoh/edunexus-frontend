
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-9xl font-bold text-sms-primary">404</h1>
        <h2 className="text-2xl font-bold mt-4">Page Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link to="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
