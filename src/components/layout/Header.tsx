import React, { useState, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { API_CONFIG } from "@/config/api";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
}

export default function Header() {
  const { toggle, isOpen } = useSidebar();
  const { user, logout, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.role === "admin") {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/activities/recent`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data = await response.json();
      setNotifications(transformActivitiesToNotifications(data));
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fetch notifications',
        variant: "destructive",
      });
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const transformActivitiesToNotifications = (activities: any[]): Notification[] => {
    return activities.map(activity => ({
      id: activity.id,
      title: getNotificationTitle(activity.action),
      description: getNotificationDescription(activity),
      time: formatTime(activity.timestamp || activity.date),
    }));
  };

  const getNotificationTitle = (action: string): string => {
    switch(action) {
      case 'CREATE_STUDENT':
        return 'New Student Registration';
      case 'ENROLL_STUDENT':
        return 'Student Enrollment';
      default:
        return 'System Activity';
    }
  };

  const getNotificationDescription = (activity: any): string => {
    if (activity.studentCreated) {
      return `Student: ${activity.studentCreated.fullName}`;
    }
    return `Action performed by ${activity.performedBy?.email || 'system'}`;
  };

  const formatTime = (timestamp: string): string => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  if (!user) return null;
  
  const isAdmin = user.role === "admin";

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-border bg-background">
      <div className="flex items-center">
        {!isOpen && (
          <Button variant="ghost" size="icon" onClick={toggle} className="mr-4">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-xl font-bold text-foreground">School Management Portal</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] rounded-full px-1.5 py-0.5 border border-white font-bold animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 max-w-sm" align="end" forceMount>
              <DropdownMenuLabel>
                Recent Activities
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loading ? (
                <DropdownMenuItem>
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </DropdownMenuItem>
              ) : notifications.length === 0 ? (
                <DropdownMenuItem>
                  <span className="text-sm text-muted-foreground">No recent activities</span>
                </DropdownMenuItem>
              ) : (
                notifications.map((note) => (
                  <DropdownMenuItem key={note.id} className="flex flex-col items-start py-3 hover:bg-accent cursor-pointer transition-all">
                    <span className="font-medium text-foreground">{note.title}</span>
                    <span className="text-xs text-muted-foreground">{note.description}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">{note.time}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
