import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DashboardStats } from './DashboardStats';
import { AdminDashboardCards, TeacherDashboardCards } from './DashboardCards';
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User } from "lucide-react";

import { useAuth } from '@/contexts/AuthContext';
import RecentActivitiesCard from '@/components/dashboard/RecentActivitiesCard';
import { QuickActions } from './DashboardQuickActions';
import { API_CONFIG } from '@/config/api';


export const DashboardContent = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';
  const isFinance = user?.role === 'finance';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setProfileLoading(false);
        return;
      }
      
      try {
        setProfileLoading(true);
        const response = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const profileData = await response.json();
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Continue with user data from auth context as fallback
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  // Use profile data if available, otherwise fallback to user data
  const displayData = profile || user;

  const getDisplayName = () => {
    if (profileLoading) return "Loading...";
    
    if (displayData?.role === 'admin' || displayData?.role === 'super_admin') {
      return displayData?.role === 'admin' ? 'Admin' : 'Super Admin';
    }
    
    // Try firstName + lastName first
    if (displayData?.firstName && displayData?.lastName) {
      return `${displayData.firstName} ${displayData.lastName}`;
    }
    
    // Try fullName field (common in profile responses)
    if (displayData?.fullName) {
      return displayData.fullName;
    }
    
    // If no separate names, use the name field
    if (displayData?.name) {
      return displayData.name;
    }
    
    // Use username if available, otherwise fallback to email username or 'User'
    return displayData?.username || displayData?.email?.split('@')[0] || 'User';
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'admin': 'Administrator',
      'teacher': 'Teacher',
      'student': 'Student',
      'parent': 'Parent',
      'finance': 'Finance Officer'
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    const variantMap: Record<string, string> = {
      'admin': 'destructive',
      'teacher': 'default',
      'student': 'secondary',
      'parent': 'outline',
      'finance': 'default'
    };
    return variantMap[role] || 'outline';
  };

  return (
    <div className="space-y-8">
      {/* Professional Header Section */}
      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-light text-foreground tracking-tight">
                  Dashboard
                </h1>
                {user?.role && (
                  <Badge variant="secondary" className="px-3 py-1.5 font-medium">
                    <User className="h-3 w-3 mr-2" />
                    {getRoleDisplayName(user.role)}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xl text-muted-foreground">
                  Welcome back, <span className="font-medium text-foreground">
                    {getDisplayName()}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Manage your institution with confidence and precision
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span className="text-sm font-medium">{getCurrentDate()}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">{getCurrentTime()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <DashboardStats />
      
      {/* Role-specific Content */}
      {isAdmin && <AdminDashboardCards />}
      {isTeacher && <TeacherDashboardCards />}
      {/* ... other role content */}
    </div>
  );
};