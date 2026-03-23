import React, { useEffect, useState, useCallback } from 'react';
import { toFriendlyActivity, RawActivityLog } from '@/lib/activityFormatter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, Clock, Search, Filter, User, Calendar, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '@/config/api';

type LogEntry = RawActivityLog;

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

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchPeriod, setSearchPeriod] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const { token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
      const transformedActivities = data.map(raw => {
        const friendly = toFriendlyActivity(raw);
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

  // buildDescription replaced by shared friendly formatter

  useEffect(() => {
    fetchActivities();
  // Refresh every 20 minutes instead of every minute to minimize backend load
  const interval = setInterval(fetchActivities, 1200000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  const openActivity = (id: string) => {
    navigate(`/activities/${id}`);
  };

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getActionColor = (action: string) => {
    void action;
    return 'text-foreground';
  };

  const getRoleBadgeColor = (role: string) => {
    void role;
    return 'border border-border bg-muted text-muted-foreground';
  };

  // Filter activities based on search and filters
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchPeriod === '' || 
      activity.description.toLowerCase().includes(searchPeriod.toLowerCase()) ||
      activity.user.name.toLowerCase().includes(searchPeriod.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchPeriod.toLowerCase());
    
    const matchesType = filterType === 'all' || activity.type.toLowerCase() === filterType.toLowerCase();
    const matchesRole = filterRole === 'all' || activity.user.role.toLowerCase() === filterRole.toLowerCase();
    
    return matchesSearch && matchesType && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-muted-foreground" />
              <h1 className="text-3xl font-bold text-foreground">
                Activities
              </h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Monitor all system activities and user actions
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search activities..."
                  value={searchPeriod}
                  onChange={(e) => setSearchPeriod(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activities
            </CardTitle>
            <Badge variant="outline">{filteredActivities.length} activities</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading activities...</p>
              </div>
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="group flex items-start space-x-4 p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 cursor-pointer transition-all duration-200 hover:shadow-md bg-white dark:bg-card/80 hover:bg-slate-50 dark:hover:bg-card/90"
                  onClick={() => openActivity(activity.id)}
                >
                  <Avatar className="h-12 w-12 ring-2 ring-slate-200 dark:ring-slate-700">
                    <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-teal-100 to-sky-100 dark:from-slate-900 dark:to-slate-900 dark:border dark:border-slate-700 text-teal-800 dark:text-teal-200 font-semibold">
                      {getInitials(activity.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">
                          <span className="font-semibold">{activity.user.name}</span>{' '}
                          <span className={`ml-1 font-medium ${getActionColor(activity.action)}`}>
                            {activity.action}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug break-words">
                          {activity.description}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                            {new Date(activity.date).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3 text-gray-400" />
                          <Badge className={`text-xs px-2 py-1 ${getRoleBadgeColor(activity.user.role)}`}>
                            {activity.user.role}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No activities found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {searchPeriod || filterType !== 'all' || filterRole !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Check back later for updates'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
