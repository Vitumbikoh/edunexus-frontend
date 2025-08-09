// RecentActivitiesCard.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

type LogEntry = {
  id: string;
  action: string;
  performedBy: {
    id?: string;
    email: string;
    role: string;
  };
  studentCreated?: {
    id: string;
    fullName: string;
  };
  timestamp: string;
  ipAddress: string;
  userAgent: string;
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

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/v1/activities/recent', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error(`Failed to fetch activities`);
      
      const data: LogEntry[] = await response.json();
      
      // Transform log entries to activities
      const transformedActivities = data.map(log => ({
        id: log.id,
        type: 'Student', // Could be dynamic based on action
        action: log.action.toLowerCase().replace('_', ' '),
        description: getDescription(log),
        entityId: log.studentCreated?.id,
        date: log.timestamp,
        user: {
          id: log.performedBy.id,
          name: log.performedBy.email.split('@')[0], // Use email prefix as name
          email: log.performedBy.email,
          role: log.performedBy.role,
        }
      }));
      
      setActivities(transformedActivities);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fetch activities',
        variant: "destructive",
      });
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDescription = (log: LogEntry): string => {
    switch (log.action) {
      case 'CREATE_STUDENT':
        return `student ${log.studentCreated?.fullName}`;
      case 'ENROLL_STUDENT':
        return `student ${log.studentCreated?.fullName} in a program`;
      default:
        return 'performed an action';
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'text-green-600';
    if (action.includes('update') || action.includes('enroll')) return 'text-blue-600';
    if (action.includes('delete')) return 'text-red-600';
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
              <div key={activity.id} className="flex items-start space-x-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                  <AvatarFallback>{getInitials(activity.user.name)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium">
                    <span className="font-semibold">{activity.user.name}</span> 
                    <span className={`ml-1 ${getActionColor(activity.action)}`}>
                      {activity.action.split(' ')[0]}ed
                    </span> {activity.description}
                  </p>
                  <div className="flex justify-between">
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleString()}
                    </p>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {activity.type}
                    </span>
                  </div>
                </div>
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