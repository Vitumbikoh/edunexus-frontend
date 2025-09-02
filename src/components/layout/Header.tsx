import React from 'react';
import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user } = useAuth();

  return (
    <div className="flex flex-1 items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold text-foreground">
          Welcome back, {user?.firstName || 'User'}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative">
            <Bell size={18} />
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs">
              3
            </Badge>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <User size={18} />
          </Button>
          <div className="text-sm">
            <div className="font-medium">{user?.firstName} {user?.lastName}</div>
            <div className="text-muted-foreground text-xs capitalize">{user?.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
