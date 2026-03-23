import React, { useEffect, useState } from 'react';
import { toFriendlyActivity, buildFieldChanges, RawActivityLog } from '@/lib/activityFormatter';
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

type ActivityLog = RawActivityLog;

const ActivityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [activity, setActivity] = useState<ActivityLog | null>(null);
  const [friendly, setFriendly] = useState<any>(null);
  const [showTechnical, setShowTechnical] = useState(false);
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
          if (found) setFriendly(toFriendlyActivity(found));
        } else if (res.ok) {
          const data = await res.json();
          setActivity(data);
          setFriendly(toFriendlyActivity(data));
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
        <div className="p-4 bg-card rounded-lg border border-border">
          <p className="text-sm text-muted-foreground italic">No {title.toLowerCase()} available</p>
        </div>
      );
    }
    return (
      <div className="p-4 bg-card rounded-lg border border-border">
        <pre className="text-xs text-foreground overflow-x-auto max-h-64 whitespace-pre-wrap">
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
    void action;
    return 'bg-muted text-foreground border border-border';
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
        <div className="p-4 bg-red-100 dark:bg-transparent dark:border dark:border-border rounded-full">
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
        <div className="p-4 bg-gray-100 dark:bg-card rounded-full">
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

  const fieldChanges = buildFieldChanges(activity.oldValues, activity.newValues);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
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
              <Activity className="h-8 w-8 text-muted-foreground" />
              <h1 className="text-3xl font-bold text-foreground">
                Activity Details
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Complete information about this system activity
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{new Date(activity.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Activity Card */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-foreground flex items-center gap-3">
                {getLevelIcon(activity.level || 'info')}
                {friendly?.verb || activity.action}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getActionColor(activity.action)}>
                  {friendly?.verb || activity.action}
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
          {/* Actor & Primary Summary */}
          {activity.performedBy && (
            <div className="flex items-center space-x-4 p-4 bg-card rounded-lg border border-border">
              <Avatar className="h-12 w-12 ring-1 ring-border">
                <AvatarImage src="" alt={activity.performedBy.name || activity.performedBy.username || activity.performedBy.email} />
                <AvatarFallback className="bg-muted text-foreground font-semibold">
                  {getInitials(activity.performedBy.name || activity.performedBy.username || activity.performedBy.email || 'System')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {friendly?.actor || activity.performedBy.name || activity.performedBy.username || activity.performedBy.email || 'System'}
                  </span>
                </div>
                {(activity.performedBy.email || activity.performedBy.username) && (
                  <p className="text-sm text-muted-foreground">{activity.performedBy.username || activity.performedBy.email}</p>
                )}
                {activity.performedBy.role && (
                  <Badge className="text-xs" variant="secondary">
                    {activity.performedBy.role}
                  </Badge>
                )}
                {friendly?.summary && (
                  <p className="text-xs text-muted-foreground pt-1">{friendly.summary}</p>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Human Friendly Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Info className="h-5 w-5" />
                Basic Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                  <span className="font-medium text-muted-foreground">Module</span>
                  <span className="text-foreground">{activity.module || 'System'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                  <span className="font-medium text-muted-foreground">Action</span>
                  <span className="text-foreground">{friendly?.verb || activity.action}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                  <span className="font-medium text-muted-foreground">Performed On</span>
                  <span className="text-foreground">{friendly?.target || activity.entityType || '—'}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                  <span className="font-medium text-muted-foreground">Level</span>
                  <div className="flex items-center gap-2">
                    {getLevelIcon(activity.level || 'info')}
                    <span className="font-medium text-foreground">
                      {activity.level || 'Info'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                  <span className="font-medium text-muted-foreground">Timestamp</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Database className="h-5 w-5" />
                Changed Fields
              </h3>
              {fieldChanges.length === 0 ? (
                <div className="p-4 bg-card rounded-lg border border-border text-sm text-muted-foreground italic">No data changes captured</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Field</th>
                        <th className="text-left px-3 py-2 font-medium">Previous</th>
                        <th className="text-left px-3 py-2 font-medium">New</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fieldChanges.map(fc => (
                        <tr key={fc.field} className="border-t border-border">
                          <td className="px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">{fc.field}</td>
                          <td className="px-3 py-2 text-muted-foreground max-w-xs truncate">{fc.oldValue ?? '—'}</td>
                          <td className="px-3 py-2 text-foreground max-w-xs truncate">{fc.newValue ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
              <div className="p-4 bg-card rounded-lg border border-border">
                <p className="text-foreground">{activity.metadata.description}</p>
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
              <div className="p-4 bg-red-50 dark:bg-transparent rounded-lg border border-red-200 dark:border-border">
                <p className="text-red-800 dark:text-red-300 whitespace-pre-wrap">{activity.metadata.errorMessage}</p>
              </div>
            </div>
          )}

          {/* Technical details toggle */}
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowTechnical(s => !s)}>
              {showTechnical ? 'Hide Technical Details' : 'Show Technical Details'}
            </Button>
            {showTechnical && (
              <div className="mt-4 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Raw New Values
                    </h3>
                    {renderJSON(activity.newValues, 'new values')}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Raw Old Values
                    </h3>
                    {renderJSON(activity.oldValues, 'previous values')}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {activity.entityId && <div><span className="font-semibold">Entity ID:</span> {activity.entityId}</div>}
                  {activity.metadata?.ipAddress && <div><span className="font-semibold">IP:</span> {activity.metadata?.ipAddress}</div>}
                  {activity.metadata?.userAgent && <div className="col-span-2 md:col-span-3 break-all"><span className="font-semibold">Agent:</span> {activity.metadata?.userAgent}</div>}
                </div>
              </div>
            )}
          </div>

          {/* User agent now inside technical toggle */}

          {showTechnical && activity.metadata?.stackTrace && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Stack Trace
              </h3>
              <div className="p-4 bg-red-50 dark:bg-transparent rounded-lg border border-red-200 dark:border-border max-h-96 overflow-y-auto">
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
