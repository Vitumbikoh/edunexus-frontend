// RecentActivitiesCard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '@/config/api';

type LogEntry = {
  id: string;
  action: string;
  performedBy: {
    id?: string;
    email: string;
    role: string;
    name?: string;
  };
  studentCreated?: {
    id: string;
    fullName: string;
  };
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  metadata?: {
    errorMessage?: string;
    description?: string;
    dto?: {
      amount?: number | string;
      studentId?: string;
    };
  };
  newValues?: {
    amount?: number | string;
    studentName?: string;
  };
  entityId?: string;
  module?: string;
  level?: string;
};

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
      const transformedActivities = data.map(log => ({
        id: log.id,
        type: log.module || 'System',
        action: log.action,
        description: buildDescription(log),
        entityId: log.entityId || undefined,
        date: log.timestamp,
        user: {
          id: log.performedBy?.id,
          name: (log.performedBy?.name || log.performedBy?.email?.split('@')[0] || 'System'),
          email: log.performedBy?.email || 'system',
          role: log.performedBy?.role || 'SYSTEM',
        }
      }));
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

  const buildDescription = (log: LogEntry): string => {
    // Attempt richer finance-related messages
    if (log.action.includes('fee payment') && log.newValues) {
      const amount = log.newValues.amount || log.metadata?.dto?.amount;
      const student = log.newValues.studentName || log.metadata?.dto?.studentId || 'student';
      return `processed fee payment of ${amount} for ${student}`;
    }
    if (log.level === 'error') {
      return log.metadata?.errorMessage || log.metadata?.description || 'system error occurred';
    }
    if (log.studentCreated?.fullName) {
      return `${log.action.toLowerCase().replace(/_/g,' ')}: ${log.studentCreated.fullName}`;
    }
    return log.metadata?.description || log.action.toLowerCase().replace(/_/g,' ');
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000);
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
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <p>Loading activities...</p>
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start space-x-4 p-2 rounded-md hover:bg-accent cursor-pointer transition ${unreadIds.has(activity.id) ? 'bg-accent/40' : ''}`}
                onClick={() => openActivity(activity.id)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                  <AvatarFallback>{getInitials(activity.user.name)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-snug">
                    <span className="font-semibold">{activity.user.name}</span>{' '}
                    <span className={`ml-1 ${getActionColor(activity.action)}`}>{activity.action.toLowerCase().replace(/_/g,' ')}</span>
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug break-words">{activity.description}</p>
                  <div className="flex justify-between">
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleString()}
                    </p>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {activity.type}
                    </span>
                  </div>
                </div>
                {unreadIds.has(activity.id) && <span className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center py-4">
            <p className="text-muted-foreground">No recent activities found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}