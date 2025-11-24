import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, getNotificationStats, markNotificationAsRead, markAllNotificationsAsRead, type Notification, type NotificationStats } from '@/lib/notifications';

async function fetchNotifications(): Promise<Notification[]> {
  try {
    const response = await getNotifications(1, 50); // Get more notifications for the dropdown
    if (response.success && response.notifications) {
      return response.notifications;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
}

async function fetchNotificationStats(): Promise<NotificationStats> {
  try {
    const response = await getNotificationStats();
    if (response.success && response.stats) {
      return response.stats;
    }
    return {
      total: 0,
      unread: 0,
      read: 0,
      byType: { credentials: 0, system: 0, alert: 0 }
    };
  } catch (error) {
    console.error('Failed to fetch notification stats:', error);
    return {
      total: 0,
      unread: 0,
      read: 0,
      byType: { credentials: 0, system: 0, alert: 0 }
    };
  }
}

export function useNotifications(enabled: boolean = true) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 30_000, // Refresh every 30 seconds
    refetchInterval: 60_000, // Auto-refetch every minute
    enabled, // Only run if enabled
  });
}

export function useNotificationStats(enabled: boolean = true) {
  return useQuery({
    queryKey: ['notification-stats'],
    queryFn: fetchNotificationStats,
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled, // Only run if enabled
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications and stats
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications and stats
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });
}