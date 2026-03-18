import React from 'react';
import { Menu, Bell, Clock, AlertCircle, School, FileText } from 'lucide-react';
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
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { useNotifications, useNotificationStats, useMarkNotificationAsRead } from '@/hooks/useNotifications';
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from '@/hooks/use-mobile';

export default function Header() {
  const { toggle, isOpen } = useSidebar();
  const { user, logout, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const enableNotifications = Boolean(token && user);
  const { data: notifications = [], isLoading } = useNotifications(enableNotifications);
  const { data: stats } = useNotificationStats(enableNotifications);
  const markAsReadMutation = useMarkNotificationAsRead();

  const handleNotificationClick = async (notification: any) => {
    // Mark as read when clicked
    if (!notification.read) {
      try {
        await markAsReadMutation.mutateAsync(notification.id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
        toast({
          title: "Error",
          description: "Failed to mark notification as read",
          variant: "destructive",
        });
      }
    }
    // Open notifications page and keep selected item highlighted.
    navigate(`/notifications?selected=${encodeURIComponent(notification.id)}`);
  };

  const getNotificationIcon = (type: string, metadata?: Record<string, any>) => {
    if (metadata?.isBillingInvoice) {
      return <FileText className="h-4 w-4 text-amber-500" />;
    }
    switch (type) {
      case 'credentials':
        return <School className="h-4 w-4" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatTime = (timestamp: string): string => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
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

  return (
    <header className="h-16 flex items-center justify-between gap-2 px-3 sm:px-4 border-b border-border bg-background">
      <div className="flex min-w-0 items-center">
        {(isMobile || !isOpen) && (
          <Button variant="ghost" size="icon" onClick={toggle} className="mr-4">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h1 className="max-w-[40vw] truncate text-base font-bold text-foreground sm:max-w-none sm:text-xl">
          {isMobile ? 'EduNexus' : 'School Management Portal'}
        </h1>
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {enableNotifications && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {stats?.unread > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white border-white">
                    {stats.unread > 99 ? '99+' : stats.unread}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[min(20rem,calc(100vw-1rem))] sm:w-80" align="end" forceMount>
              <DropdownMenuLabel>
                Notifications ({stats?.unread || 0} unread)
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isLoading ? (
                <DropdownMenuItem>
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </DropdownMenuItem>
              ) : notifications.length === 0 ? (
                <DropdownMenuItem>
                  <span className="text-sm text-muted-foreground">No notifications</span>
                </DropdownMenuItem>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start py-3 hover:bg-accent cursor-pointer transition-all relative ${!notification.read ? 'bg-accent/40' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className={`flex-shrink-0 mt-0.5 ${notification.metadata?.isBillingInvoice ? 'text-amber-500' : getPriorityColor(notification.priority)}`}>
                        {getNotificationIcon(notification.type, notification.metadata)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 w-full mb-1 flex-wrap">
                          <span className="font-medium text-sm truncate">
                            {notification.title}
                          </span>
                          {notification.metadata?.isBillingInvoice && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 rounded px-1 py-0.5 font-semibold whitespace-nowrap">Invoice</span>
                          )}
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        {notification.message && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                            {notification.message}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(notification.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              {notifications.length > 5 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate('/notifications')}
                    className="text-center justify-center text-xs font-medium"
                  >
                    View all notifications
                  </DropdownMenuItem>
                </>
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
              <Link to="/settings/system">Settings</Link>
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
