import { api } from './api';

export interface Notification {
  id: string;
  title: string;
  message?: string;
  type: 'credentials' | 'system' | 'alert';
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  metadata?: Record<string, any>;
  school?: {
    id: string;
    name: string;
    code: string;
  };
  schoolId?: string;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: {
    credentials: number;
    system: number;
    alert: number;
  };
}

// Get notifications with pagination
export async function getNotifications(page: number = 1, limit: number = 10) {
  return await api.get(`/notifications?page=${page}&limit=${limit}`);
}

// Get notification statistics
export async function getNotificationStats() {
  return await api.get('/notifications/stats');
}

// Mark a specific notification as read
export async function markNotificationAsRead(id: string) {
  return await api.patch(`/notifications/${id}/read`, {});
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  return await api.patch('/notifications/read-all', {});
}

export function isVisibleToPrincipal(notification: Notification): boolean {
  const targetRoles = Array.isArray(notification?.metadata?.targetRoles)
    ? notification.metadata?.targetRoles
    : [];
  const normalizedTargets = targetRoles.map((role: any) => String(role || '').toUpperCase());

  // Hide operational/admin-only credentials and billing invoices from principal view.
  if (notification.type === 'credentials') return false;
  if (notification.metadata?.isBillingInvoice) return false;

  // Respect explicit audience hints when provided.
  if (normalizedTargets.length > 0 && !normalizedTargets.includes('PRINCIPAL')) {
    return false;
  }

  return true;
}