import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, type Notification } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Bell, AlertCircle, School } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const getIcon = (type: string, metadata?: Record<string, any>) => {
  if (metadata?.isBillingInvoice) return <FileText className="h-4 w-4 text-amber-500" />;
  switch (type) {
    case 'credentials': return <School className="h-4 w-4" />;
    case 'alert': return <AlertCircle className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
};

export default function Notifications() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resp, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: async () => {
      const r = await getNotifications(page, limit);
      return r;
    },
    keepPreviousData: true,
  });

  // Normalize different possible API response shapes
  const respAny: any = resp;
  let notifications: Notification[] = [];
  if (!respAny) {
    notifications = [];
  } else if (Array.isArray(respAny)) {
    notifications = respAny;
  } else if (Array.isArray(respAny.notifications)) {
    notifications = respAny.notifications;
  } else if (Array.isArray(respAny.data?.notifications)) {
    notifications = respAny.data.notifications;
  } else if (Array.isArray(respAny.items)) {
    notifications = respAny.items;
  } else {
    notifications = [];
  }

  const total = respAny?.total ?? respAny?.data?.total ?? respAny?.meta?.total ?? notifications.length ?? 0;

  const markOne = useMutation({
    mutationFn: async (id: string) => await markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to mark notification as read', variant: 'destructive' });
    }
  });

  const markAll = useMutation({
    mutationFn: async () => await markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to mark all as read', variant: 'destructive' });
    }
  });

  const formatTime = (t: string) => {
    const now = new Date();
    const then = new Date(t);
    const diff = Math.floor((now.getTime() - then.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} mins ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Notifications</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => markAll.mutate()}>Mark all as read</Button>
          <Badge>{total} total</Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-sm text-muted-foreground">No notifications</div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className={`p-4 border rounded-md ${!n.read ? 'bg-accent/30' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(n.type, n.metadata)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{n.title}</span>
                      {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(n.createdAt)}</div>
                  </div>
                  {n.message && <p className="text-sm text-muted-foreground mb-2">{n.message}</p>}
                  <div className="flex items-center gap-2">
                    {!n.read && (
                      <Button size="sm" onClick={() => markOne.mutate(n.id)}>Mark as read</Button>
                    )}
                    {n.metadata?.isBillingInvoice && (
                      <Button size="sm" variant="ghost">View invoice</Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">Page {page}</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
          <Button size="sm" variant="outline" disabled={notifications.length < limit} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
