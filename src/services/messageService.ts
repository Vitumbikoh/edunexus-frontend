import { API_CONFIG } from '@/config/api';

export type MessageItem = {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  date: string;
  read: boolean;
};

export type RecipientOption = {
  id: string;
  label: string;
  email?: string;
  username?: string;
};

type InboxResponse = {
  success: boolean;
  messages: MessageItem[];
  unreadCount: number;
};

type SentResponse = {
  success: boolean;
  messages: MessageItem[];
};

type RecipientsResponse = {
  success: boolean;
  recipients: RecipientOption[];
};

type SendResponse = {
  success: boolean;
  message: MessageItem;
};

const jsonHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const handle = async <T>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.info || 'Request failed');
  }
  return data as T;
};

export const messageService = {
  async getInbox(token: string, search = ''): Promise<InboxResponse> {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    const response = await fetch(`${API_CONFIG.BASE_URL}/messages/inbox${query}`, {
      headers: jsonHeaders(token),
    });
    return handle<InboxResponse>(response);
  },

  async getSent(token: string, search = ''): Promise<SentResponse> {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    const response = await fetch(`${API_CONFIG.BASE_URL}/messages/sent${query}`, {
      headers: jsonHeaders(token),
    });
    return handle<SentResponse>(response);
  },

  async searchRecipients(token: string, search = ''): Promise<RecipientOption[]> {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    const response = await fetch(`${API_CONFIG.BASE_URL}/messages/recipients${query}`, {
      headers: jsonHeaders(token),
    });
    const payload = await handle<RecipientsResponse>(response);
    return payload.recipients || [];
  },

  async sendMessage(token: string, payload: { to: string; subject: string; content: string }): Promise<MessageItem> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/messages`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await handle<SendResponse>(response);
    return data.message;
  },

  async markAsRead(token: string, messageId: string): Promise<void> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/messages/${messageId}/read`, {
      method: 'PATCH',
      headers: jsonHeaders(token),
    });
    await handle(response);
  },
};
