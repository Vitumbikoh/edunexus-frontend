import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/api';

interface ActivityLog {
  id: string;
  action: string;
  module?: string;
  level?: string;
  performedBy?: { id?: string; email?: string; role?: string; name?: string } | null;
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

  const renderJSON = (obj: any) => {
    if (!obj) return <p className="text-sm text-muted-foreground">N/A</p>;
    return (
      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-64">{JSON.stringify(obj, null, 2)}</pre>
    );
  };

  if (loading) {
    return <div className="p-6">Loading activity...</div>;
  }
  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }
  if (!activity) {
    return <div className="p-6 text-sm text-muted-foreground">Activity not found.</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <Button variant="outline" size="sm" onClick={() => navigate(-1)}>Back</Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-1">
            <span>Activity Detail</span>
            <span className="text-sm font-normal text-muted-foreground">{activity.action}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Module</p>
              <p>{activity.module || '—'}</p>
            </div>
            <div>
              <p className="font-medium">Level</p>
              <p className={activity.level === 'error' ? 'text-red-600' : ''}>{activity.level || '—'}</p>
            </div>
            <div>
              <p className="font-medium">Performed By</p>
              <p>{activity.performedBy?.email || 'System'}</p>
            </div>
            <div>
              <p className="font-medium">Timestamp</p>
              <p>{new Date(activity.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-medium">Entity</p>
              <p>{activity.entityType || '—'} {activity.entityId ? `(${activity.entityId})` : ''}</p>
            </div>
            <div>
              <p className="font-medium">IP Address</p>
              <p>{activity.ipAddress || '—'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Description</p>
            <p className="text-sm text-muted-foreground">{activity.metadata?.description || '—'}</p>
          </div>

          <div className="space-y-2">
            <p className="font-medium">New Values</p>
            {renderJSON(activity.newValues)}
          </div>
          <div className="space-y-2">
            <p className="font-medium">Old Values</p>
            {renderJSON(activity.oldValues)}
          </div>
          {activity.metadata?.errorMessage && (
            <div className="space-y-2">
              <p className="font-medium text-red-600">Error Message</p>
              <p className="text-sm text-red-600 whitespace-pre-wrap">{activity.metadata.errorMessage}</p>
            </div>
          )}
          {activity.metadata?.stackTrace && (
            <div className="space-y-2">
              <p className="font-medium">Stack Trace</p>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-64">{activity.metadata.stackTrace}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityDetail;
