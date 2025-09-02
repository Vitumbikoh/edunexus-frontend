import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Globe, 
  Monitor, 
  AlertTriangle, 
  Info, 
  Shield, 
  Activity,
  FileText,
  Database,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/api';

interface ActivityLog {
  id: string;
  action: string;
  module?: string;
  level?: string;
  performedBy?: { id?: string; email?: string; role?: string; name?: string; username?: string } | null;
  entityId?: string | null;
  entityType?: string | null;
  newValues?: any;
  oldValues?: any;
  metadata?: any;
  timestamp: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const ActivityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [activity, setActivity] = useState<ActivityLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        let res = await fetch(`${API_CONFIG.BASE_URL}/activities/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 404) {
          res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RECENT_ACTIVITIES}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed to load activity');
          const arr: ActivityLog[] = await res.json();
          const found = arr.find(a => a.id === id) || null;
          setActivity(found);
        } else if (res.ok) {
          const data = await res.json();
          setActivity(data);
        } else {
          throw new Error('Failed to load activity');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load activity');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchActivity();
  }, [id, token]);

  const renderJSON = (obj: any, title: string) => {
    if (!obj || (typeof obj === 'object' && Object.keys(obj).length === 0)) {
      return (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No {title.toLowerCase()} available</p>
        </div>
      );
    }
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto max-h-64 whitespace-pre-wrap">
          {JSON.stringify(obj, null, 2)}
        </pre>
      </div>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getActionColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('create') || lowerAction.includes('add') || lowerAction.includes('enroll')) 
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    if (lowerAction.includes('update') || lowerAction.includes('edit') || lowerAction.includes('grade') || lowerAction.includes('submit')) 
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    if (lowerAction.includes('delete') || lowerAction.includes('remove') || lowerAction.includes('cancel')) 
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    if (lowerAction.includes('login') || lowerAction.includes('logout')) 
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    if (lowerAction.includes('payment') || lowerAction.includes('invoice') || lowerAction.includes('process')) 
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (lowerAction.includes('export') || lowerAction.includes('import') || lowerAction.includes('generate') || lowerAction.includes('report')) 
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const getLevelIcon = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading activity details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-4">
        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Error Loading Activity</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }
  
  if (!activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-4">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Activity Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">The requested activity could not be found.</p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="px-3 py-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Activity Details
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Complete information about this system activity
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{new Date(activity.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Activity Card */}
      <Card className="bg-gradient-to-br from-white via-gray-50/30 to-gray-100/50 dark:from-gray-900 dark:via-gray-800/10 dark:to-gray-800/20 border-gray-200/50 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                {getLevelIcon(activity.level || 'info')}
                {activity.action}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getActionColor(activity.action)}>
                  {activity.action.toLowerCase().replace(/_/g, ' ')}
                </Badge>
                {activity.module && (
                  <Badge variant="outline">
                    {activity.module}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* User Information */}
          {activity.performedBy && (
            <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <Avatar className="h-12 w-12 ring-2 ring-gray-200 dark:ring-gray-700">
                <AvatarImage src="" alt={activity.performedBy.name || activity.performedBy.username || activity.performedBy.email} />
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-700 dark:text-blue-300 font-semibold">
                  {getInitials(activity.performedBy.name || activity.performedBy.username || activity.performedBy.email || 'System')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {activity.performedBy.name || activity.performedBy.username || activity.performedBy.email || 'System'}
                  </span>
                </div>
                {(activity.performedBy.email || activity.performedBy.username) && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{activity.performedBy.username || activity.performedBy.email}</p>
                )}
                {activity.performedBy.role && (
                  <Badge className="text-xs" variant="secondary">
                    {activity.performedBy.role}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Activity Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Basic Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Module</span>
                  <span className="text-gray-900 dark:text-gray-100">{activity.module || 'System'}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Level</span>
                  <div className="flex items-center gap-2">
                    {getLevelIcon(activity.level || 'info')}
                    <span className={`font-medium ${activity.level === 'error' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {activity.level || 'Info'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Timestamp</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Technical Details
              </h3>
              
              <div className="space-y-3">
                {activity.entityType && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Entity Type</span>
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">{activity.entityType}</span>
                    </div>
                  </div>
                )}
                
                {activity.entityId && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Entity ID</span>
                    <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">{activity.entityId}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <span className="font-medium text-gray-700 dark:text-gray-300">IP Address</span>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                      {activity.ipAddress || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          {activity.metadata?.description && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description
              </h3>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-gray-700 dark:text-gray-300">{activity.metadata.description}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {activity.metadata?.errorMessage && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Error Message
              </h3>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-800 dark:text-red-300 whitespace-pre-wrap">{activity.metadata.errorMessage}</p>
              </div>
            </div>
          )}

          {/* Data Changes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Database className="h-5 w-5" />
                New Values
              </h3>
              {renderJSON(activity.newValues, 'new values')}
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Previous Values
              </h3>
              {renderJSON(activity.oldValues, 'previous values')}
            </div>
          </div>

          {/* User Agent */}
          {activity.userAgent && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                User Agent
              </h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-mono break-all">{activity.userAgent}</p>
              </div>
            </div>
          )}

          {/* Stack Trace */}
          {activity.metadata?.stackTrace && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Stack Trace
              </h3>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 max-h-96 overflow-y-auto">
                <pre className="text-xs text-red-800 dark:text-red-300 whitespace-pre-wrap">{activity.metadata.stackTrace}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityDetail;
