import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DashboardStats } from './DashboardStats';
import { AdminDashboardCards, TeacherDashboardCards } from './DashboardCards';

import { useAuth } from '@/contexts/AuthContext';
import RecentActivitiesCard from '@/components/dashboard/RecentActivitiesCard';
import { QuickActions } from './DashboardQuickActions';
import { mockActivities } from './mockData';

export const DashboardContent = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';
  const isFinance = user?.role === 'finance';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || user?.email?.split('@')[0]}</p>
      </div>
      
      <DashboardStats />
      
      {isAdmin && <AdminDashboardCards />}
      {isTeacher && <TeacherDashboardCards />}
      {/* ... other role content */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isAdmin && <RecentActivitiesCard activities={mockActivities} />}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActions />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};