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
  // Rotating study tips (10 total)
  const tips: string[] = [
    'Use the Pomodoro approach: focus for 25–40 minutes, then take a short 5–10 minute break. This cadence keeps your mind fresh and reduces fatigue while improving long‑term retention.',
    'After each study block, write a two‑sentence summary in your own words and one follow‑up question. Summarizing boosts comprehension; the question guides your next review.',
    'Explain the topic to a friend or an imaginary class. Teaching forces clarity, exposes gaps, and strengthens memory through active recall rather than passive reading.',
    'Practice with past questions or small exercises as soon as you learn a concept. Turning theory into application makes knowledge stick and highlights weak spots early.',
    'Start with a tiny, doable task—like opening your notes or outlining a heading—then build momentum. Small wins reduce friction and help you overcome procrastination.',
    'Space your reviews over several days (spaced repetition). Short, repeated sessions beat long cramming marathons and help ideas move from short‑term to long‑term memory.',
    'Break big goals into daily steps, then track completion in minutes, not hours. Measurable progress keeps motivation high and makes improvement visible.',
    'Create a distraction‑free zone: silence notifications, clear your desk, and set a timer. Reducing context switches saves mental energy and deepens focus.',
    'Protect sleep and hydration—they are part of studying. Good rest consolidates memory, while water keeps your brain alert and improves problem‑solving.',
    'Celebrate small milestones and show up consistently. Sustainable habits beat intense bursts; consistency compounds and turns effort into mastery.'
  ];
  const initialTipIndex = Math.abs(new Date().getDate() + new Date().getMonth()) % tips.length;
  const [tipIndex, setTipIndex] = useState<number>(initialTipIndex);
  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 15000); // rotate every 15s for better readability
    return () => clearInterval(id);
  }, []);

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
    <div className="space-y-6 pb-6 md:pb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h1 className="text-xl font-bold text-foreground">
              Welcome back, {getDisplayName()}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {getCurrentDate()}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {getCurrentTime()}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                Student
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Smartphone className="h-3 w-3 mr-1" />
                Mobile Optimized
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Mobile Dashboard Cards */}
      <MobileStudentDashboardCards />
      
      {/* Study Tip of the Day */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-green-700 dark:text-green-400">
            💡 Study Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed flex-1">
              {tips[tipIndex]}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};