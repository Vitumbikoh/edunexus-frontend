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
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread?: boolean;
}

export default function Header() {
  const { toggle, isOpen } = useSidebar();
  const { user, logout, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/v1/activities/recent', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data = await response.json();
      setNotifications(prev => {
        const existing = new Map(prev.map(p => [p.id, p]));
        return transformActivitiesToNotifications(data).map(n => ({
          ...n,
          unread: existing.has(n.id) ? existing.get(n.id)!.unread : true,
        }));
      });
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
    return activities.map(activity => {
      const { action, level, newValues, metadata } = activity;
      let title = getNotificationTitle(action, level);
      let description = getNotificationDescription(activity, newValues, metadata, level);
      return {
        id: activity.id,
        title,
        description,
        time: formatTime(activity.timestamp || activity.date),
      };
    });
  };

  const getNotificationTitle = (action: string, level?: string): string => {
    if (level === 'error') return 'Error Event';
    if (action.includes('fee payment')) return 'Fee Payment';
    switch(action) {
      case 'CREATE_STUDENT': return 'New Student Registration';
      case 'ENROLL_STUDENT': return 'Student Enrollment';
      default: return 'System Activity';
    }
  };

  const getNotificationDescription = (activity: any, newValues: any, metadata: any, level?: string): string => {
    if (level === 'error') return metadata?.errorMessage || metadata?.description || 'System error occurred';
    if (activity.action.includes('fee payment')) {
      const amount = newValues?.amount || metadata?.dto?.amount;
      const student = newValues?.studentName || metadata?.dto?.studentId || 'student';
      return `Payment of ${amount} for ${student}`;
    }
    if (activity.studentCreated) return `Student: ${activity.studentCreated.fullName}`;
    return metadata?.description || `By ${activity.performedBy?.username || activity.performedBy?.email || 'system'}`;
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
                {notifications.some(n => n.unread) && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] rounded-full px-1.5 py-0.5 border border-white font-bold animate-pulse">
                    {notifications.filter(n => n.unread).length}
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
                  <DropdownMenuItem
                    key={note.id}
                    className={`flex flex-col items-start py-3 hover:bg-accent cursor-pointer transition-all relative ${note.unread ? 'bg-accent/40' : ''}`}
                    onClick={() => {
                      setNotifications(ns => ns.map(n => n.id === note.id ? { ...n, unread: false } : n));
                      navigate(`/activities/${note.id}`);
                    }}
                  >
                    <span className="font-medium text-foreground flex items-center gap-2">
                      {note.title}
                      {note.unread && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-2 w-full text-left">{note.description}</span>
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
                <p className="text-xs leading-none text-muted-foreground">{user.username || user.email}</p>
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
