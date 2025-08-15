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
        return `created student ${log.studentCreated?.fullName}`;
      case 'ENROLL_STUDENT':
        return `enrolled student ${log.studentCreated?.fullName} in a course`;
      case 'UPDATE_STUDENT':
        return `updated student ${log.studentCreated?.fullName}'s information`;
      case 'DELETE_STUDENT':
        return `removed student ${log.studentCreated?.fullName}`;
      case 'CREATE_COURSE':
        return `created a new course`;
      case 'UPDATE_COURSE':
        return `updated course information`;
      case 'DELETE_COURSE':
        return `deleted a course`;
      case 'CREATE_CLASS':
        return `created a new class`;
      case 'UPDATE_CLASS':
        return `updated class information`;
      case 'DELETE_CLASS':
        return `deleted a class`;
      case 'SUBMIT_ATTENDANCE':
        return `submitted attendance for a class`;
      case 'CREATE_EXAM':
        return `created a new exam`;
      case 'GRADE_EXAM':
        return `graded exam submissions`;
      case 'PROCESS_PAYMENT':
        return `processed a fee payment`;
      case 'CREATE_INVOICE':
        return `generated an invoice`;
      case 'LOGIN':
        return `logged into the system`;
      case 'LOGOUT':
        return `logged out of the system`;
      case 'UPDATE_PROFILE':
        return `updated their profile`;
      case 'RESET_PASSWORD':
        return `reset their password`;
      case 'CREATE_ANNOUNCEMENT':
        return `posted a new announcement`;
      case 'UPDATE_ANNOUNCEMENT':
        return `updated an announcement`;
      case 'DELETE_ANNOUNCEMENT':
        return `deleted an announcement`;
      case 'GENERATE_REPORT':
        return `generated a report`;
      case 'EXPORT_DATA':
        return `exported data`;
      case 'IMPORT_DATA':
        return `imported data`;
      case 'CREATE_SCHEDULE':
        return `created a class schedule`;
      case 'UPDATE_SCHEDULE':
        return `updated class schedule`;
      case 'CANCEL_CLASS':
        return `cancelled a class`;
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