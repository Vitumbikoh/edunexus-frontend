import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DashboardStats } from './DashboardStats';
import { AdminDashboardCards, TeacherDashboardCards, FinanceDashboardCards, StudentDashboardCards } from './DashboardCards';
import { MobileStudentDashboardContent } from './MobileStudentDashboardContent';
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User } from "lucide-react";

import { useAuth } from '@/contexts/AuthContext';
import RecentActivitiesCard from '@/components/dashboard/RecentActivitiesCard';
import { QuickActions } from './DashboardQuickActions';
import { API_CONFIG } from '@/config/api';
import { getAdminDashboardPalette } from './adminPalette';


export const DashboardContent = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';
  const isFinance = user?.role === 'finance';
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const adminColors = getAdminDashboardPalette(isDarkMode);

  // Use mobile-first dashboard for students
  if (isStudent) {
    return <MobileStudentDashboardContent />;
  }

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
    <div className="space-y-4">
      {/* Enhanced Header Section */}
      <div
        className="rounded-lg px-4 py-3 border shadow-sm bg-card"
        style={isAdmin ? { borderColor: `${adminColors.neutral}66` } : undefined}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1
                className="text-xl font-bold text-foreground"
              >
                Dashboard
              </h1>
              {user?.role && (
                <Badge variant={getRoleBadgeVariant(user.role) as any} className="px-2 py-0.5 text-xs">
                  <User className="h-3 w-3 mr-1" />
                  {getRoleDisplayName(user.role)}
                </Badge>
              )}
            </div>
            <p
              className={isAdmin ? "text-sm" : "text-sm text-gray-600 dark:text-gray-300"}
              style={isAdmin ? { color: isDarkMode ? '#FFFFFF' : adminColors.black } : undefined}
            >
              Welcome back, <span
                className={isAdmin ? "font-semibold" : "font-semibold text-gray-900 dark:text-gray-100"}
                style={isAdmin ? { color: adminColors.green } : undefined}
              >
                {getDisplayName()}
              </span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 lg:text-right">
            <div
              className={isAdmin ? "flex items-center gap-2 text-sm" : "flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm"}
              style={isAdmin ? { color: isDarkMode ? adminColors.neutral : adminColors.grey } : undefined}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="font-medium">{getCurrentDate()}</span>
            </div>
            <div
              className={isAdmin ? "flex items-center gap-2 text-sm" : "flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm"}
              style={isAdmin ? { color: isDarkMode ? adminColors.neutral : adminColors.grey } : undefined}
            >
              <Clock className="h-4 w-4" />
              <span className="font-medium">{getCurrentTime()}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <DashboardStats />
      
      {/* Role-specific Content */}
      {isAdmin && <AdminDashboardCards />}
      {isTeacher && <TeacherDashboardCards />}
      {isStudent && <StudentDashboardCards />}
      {isFinance && <FinanceDashboardCards />}
      {/* ... other role content */}
    </div>
  );
};