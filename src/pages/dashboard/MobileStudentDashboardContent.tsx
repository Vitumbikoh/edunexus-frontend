import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, User, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MobileStudentDashboardCards from '@/components/dashboard/MobileStudentDashboardCards';
import { API_CONFIG } from '@/config/api';

export const MobileStudentDashboardContent = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

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
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const displayData = profile || user;

  const getDisplayName = () => {
    if (profileLoading) return "Loading...";
    
    if (displayData?.firstName && displayData?.lastName) {
      return `${displayData.firstName} ${displayData.lastName}`;
    }
    
    if (displayData?.fullName) {
      return displayData.fullName;
    }
    
    if (displayData?.name) {
      return displayData.name;
    }
    
    return displayData?.username || displayData?.email?.split('@')[0] || 'Student';
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
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Mobile-Optimized Welcome Header */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="space-y-4">
          {/* Greeting */}
          <div className="space-y-1">
            <p className="text-blue-100 text-sm font-medium">Good morning!</p>
            <h1 className="text-2xl font-bold leading-tight">
              Welcome back, {getDisplayName()}
            </h1>
          </div>
          
          {/* Date and Time Row */}
          <div className="flex items-center justify-between text-blue-100">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-4 w-4" />
              <span className="text-sm font-medium">{getCurrentDate()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">{getCurrentTime()}</span>
            </div>
          </div>

          {/* Student Badge */}
          <div className="flex items-center space-x-2">
            <Badge 
              variant="secondary" 
              className="bg-white bg-opacity-20 text-white border-white border-opacity-20 backdrop-blur-sm"
            >
              <User className="h-3 w-3 mr-1" />
              Student
            </Badge>
            <Badge 
              variant="secondary" 
              className="bg-white bg-opacity-20 text-white border-white border-opacity-20 backdrop-blur-sm"
            >
              <Smartphone className="h-3 w-3 mr-1" />
              Mobile Optimized
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Mobile Dashboard Cards */}
      <MobileStudentDashboardCards />
      
      {/* Study Tip of the Day */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-green-700 dark:text-green-400">
            💡 Study Tip of the Day
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            Break your study sessions into 25-minute focused blocks with 5-minute breaks. 
            This Pomodoro Technique helps maintain concentration and improves retention!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};