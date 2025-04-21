
import React from 'react';
import StatCard from '@/components/dashboard/StatCard';
import RecentActivitiesCard from '@/components/dashboard/RecentActivitiesCard';
import { Users, BookOpen, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Mock data
const mockActivities = [
  {
    id: '1',
    user: {
      name: 'Jane Cooper',
      avatar: 'https://ui-avatars.com/api/?name=Jane+Cooper&background=0D8ABC&color=fff',
    },
    action: 'submitted the math assignment',
    time: '2 hours ago',
  },
  {
    id: '2',
    user: {
      name: 'Robert Fox',
      avatar: 'https://ui-avatars.com/api/?name=Robert+Fox&background=2563EB&color=fff',
    },
    action: 'created a new event: Parent-Teacher Meeting',
    time: '4 hours ago',
  },
  {
    id: '3',
    user: {
      name: 'Leslie Alexander',
      avatar: 'https://ui-avatars.com/api/?name=Leslie+Alexander&background=10B981&color=fff',
    },
    action: 'updated the science curriculum',
    time: 'Yesterday at 2:30 PM',
  },
  {
    id: '4',
    user: {
      name: 'Kristin Watson',
      avatar: 'https://ui-avatars.com/api/?name=Kristin+Watson&background=F59E0B&color=fff',
    },
    action: 'completed grade submission for Class 10B',
    time: 'Yesterday at 11:15 AM',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Students" 
          value="1,235" 
          icon={<Users size={24} />} 
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          title="Total Courses" 
          value="42" 
          icon={<BookOpen size={24} />} 
          trend={{ value: 4, isPositive: true }}
        />
        <StatCard 
          title="Upcoming Events" 
          value="8" 
          icon={<Calendar size={24} />} 
        />
        <StatCard 
          title="Fee Collection" 
          value="$24,500" 
          icon={<DollarSign size={24} />} 
          trend={{ value: 8, isPositive: false }}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivitiesCard activities={mockActivities} />
        
        {/* You can add more cards/sections here as needed */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.role === 'admin' && (
              <>
                <Button className="w-full">Add New Student</Button>
                <Button className="w-full">Add New Teacher</Button>
                <Button className="w-full">Create New Course</Button>
                <Button className="w-full">View Fee Reports</Button>
              </>
            )}
            
            {user?.role === 'teacher' && (
              <>
                <Button className="w-full">Take Attendance</Button>
                <Button className="w-full">Upload Learning Materials</Button>
                <Button className="w-full">Submit Grades</Button>
                <Button className="w-full">View Class Schedule</Button>
              </>
            )}
            
            {user?.role === 'student' && (
              <>
                <Button className="w-full">View Assignments</Button>
                <Button className="w-full">Check Grades</Button>
                <Button className="w-full">View Schedule</Button>
                <Button className="w-full">Download Learning Materials</Button>
              </>
            )}
            
            {user?.role === 'parent' && (
              <>
                <Button className="w-full">View Child's Performance</Button>
                <Button className="w-full">Pay Fees</Button>
                <Button className="w-full">Contact Teachers</Button>
                <Button className="w-full">View Attendance</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
