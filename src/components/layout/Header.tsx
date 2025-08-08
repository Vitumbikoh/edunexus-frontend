
import React, { useState } from 'react';
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

const mockNotifications = [
  {
    id: 1,
    title: "New Student Registered",
    description: "Sarah Connor has joined Class 9A",
    time: "2 mins ago"
  },
  {
    id: 2,
    title: "Fee Payment Received",
    description: "Payment from Michael Grant",
    time: "30 mins ago"
  },
  {
    id: 3,
    title: "Event Reminder",
    description: "PTA Meeting tomorrow at 4pm",
    time: "1 hour ago"
  },
  {
    id: 4,
    title: "Schedule Updated",
    description: "Class 10B timetable changed",
    time: "Yesterday"
  }
];

export default function Header() {
  const { toggle, isOpen } = useSidebar();
  const { user, logout } = useAuth();
  const [notifications] = useState(mockNotifications);

  if (!user) return null;
  
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

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
                Notifications
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <DropdownMenuItem>
                  <span className="text-sm text-muted-foreground">No new notifications</span>
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
