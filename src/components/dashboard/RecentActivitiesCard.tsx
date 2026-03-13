// RecentActivitiesCard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { toFriendlyActivity, RawActivityLog } from '@/lib/activityFormatter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '@/config/api';

type LogEntry = RawActivityLog; // reuse shared type

type Activity = {
  id: string;
  type: string;
  action: string;
  description: string;
  entityId?: string;
  date: string;
  user: {
    id?: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
};

export default function RecentActivitiesCard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RECENT_ACTIVITIES}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch activities`);
      const data: LogEntry[] = await response.json();
      
      // DEBUG: Log the raw data to see what we're actually getting
      console.log('Raw activity data:', data.slice(0, 3));
      
      const transformedActivities = data
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8) // keep only first 8 for performance
        .map(raw => {
          const friendly = toFriendlyActivity(raw);
          console.log('Raw log:', raw);
          console.log('Friendly result:', friendly);
          return {
            id: friendly.id,
            type: friendly.module,
            action: friendly.verb,
            description: friendly.summary,
            entityId: raw.entityId || undefined,
            date: friendly.time,
            user: {
              id: raw.performedBy?.id,
              name: friendly.actor,
              email: raw.performedBy?.email || 'system',
              role: raw.performedBy?.role || 'SYSTEM'
            }
          };
        });
      setActivities(transformedActivities);
      setUnreadIds(prev => {
        const next = new Set(prev);
        transformedActivities.forEach(a => { if (!prev.has(a.id)) next.add(a.id); });
        return next;
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch activities',
        variant: 'destructive',
      });
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, toast]);

  // buildDescription moved to shared util (toFriendlyActivity); kept minimal here.

  useEffect(() => {
  fetchActivities();
  // Refresh every 20 minutes (1,200,000 ms) per updated requirement
  const interval = setInterval(fetchActivities, 1200000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  const markAsRead = (id: string) => {
    setUnreadIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const openActivity = (id: string) => {
    markAsRead(id);
    navigate(`/activities/${id}`);
  };

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getActionColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('create') || lowerAction.includes('add') || lowerAction.includes('enroll')) return 'text-green-600';
    if (lowerAction.includes('update') || lowerAction.includes('edit') || lowerAction.includes('grade') || lowerAction.includes('submit')) return 'text-blue-600';
    if (lowerAction.includes('delete') || lowerAction.includes('remove') || lowerAction.includes('cancel')) return 'text-red-600';
    if (lowerAction.includes('login') || lowerAction.includes('logout')) return 'text-purple-600';
    if (lowerAction.includes('payment') || lowerAction.includes('invoice') || lowerAction.includes('process')) return 'text-emerald-600';
    if (lowerAction.includes('export') || lowerAction.includes('import') || lowerAction.includes('generate') || lowerAction.includes('report')) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <Card className="bg-gradient-to-br from-white via-gray-50/30 to-gray-100/50 dark:from-gray-900 dark:via-gray-800/10 dark:to-gray-800/20 border-gray-200/50 shadow-lg h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Activities</CardTitle>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Latest system activities and updates</p>
          </div>
          <div className="p-2 bg-gray-100 dark:bg-card/70 rounded-full">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading activities...</p>
            </div>
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0,4).map((activity) => (
              <div
                key={activity.id}
                className={`group flex items-start space-x-4 p-3 rounded-lg border border-gray-200 dark:border-border hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  unreadIds.has(activity.id) 
                    ? 'bg-blue-50 dark:bg-transparent border-blue-200 dark:border-border' 
                    : 'bg-white dark:bg-card/80 hover:bg-gray-50 dark:hover:bg-card/90'
                }`}
                onClick={() => openActivity(activity.id)}
              >
                <Avatar className="h-8 w-8 ring-2 ring-gray-200 dark:ring-gray-700">
                  <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-transparent dark:to-transparent dark:bg-transparent dark:border dark:border-border text-blue-700 dark:text-blue-300 font-semibold text-xs">
                    {getInitials(activity.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">
                      <span className="font-semibold">{activity.user.name}</span>{' '}
                      <span className={`ml-1 font-medium ${getActionColor(activity.action)}`}>
                        {activity.action}
                      </span>
                    </p>
                    {unreadIds.has(activity.id) && (
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">New</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug break-words">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                      {new Date(activity.date).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <span className="text-xs px-3 py-1 bg-gray-100 dark:bg-transparent dark:border dark:border-border text-gray-700 dark:text-foreground rounded-full font-medium">
                      {activity.type}
                    </span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
            {activities.length > 4 && (
              <div className="pt-3 border-t border-gray-200 dark:border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-white dark:bg-transparent border-gray-300 dark:border-border hover:bg-gray-50 dark:hover:bg-transparent text-gray-700 dark:text-foreground"
                  onClick={() => navigate('/activities')}
                >
                  View All Activities
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 bg-gray-100 dark:bg-transparent dark:border dark:border-border rounded-full mb-3">
              <Clock className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No recent activities found</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Check back later for updates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}