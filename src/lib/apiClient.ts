import { API_CONFIG } from '@/config/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setAccessToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

function setRefreshToken(t: string) {
  localStorage.setItem(REFRESH_KEY, t);
}

let refreshing: Promise<void> | null = null;

async function refreshTokens() {
  if (!refreshing) {
    refreshing = (async () => {
      const rt = getRefreshToken();
      if (!rt) throw new Error('No refresh token');
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) {
        throw new Error('Refresh failed');
      }
      const data = await res.json();
      if (data?.access_token) setAccessToken(data.access_token);
      if (data?.refresh_token) setRefreshToken(data.refresh_token);
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

export async function apiFetch<T = any>(path: string, options: RequestInit & { method?: HttpMethod } = {}) {
  const url = path.startsWith('http') ? path : `${API_CONFIG.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    try {
      await refreshTokens();
      const token2 = getAccessToken();
      const headers2 = { ...headers };
      if (token2) headers2['Authorization'] = `Bearer ${token2}`;
      res = await fetch(url, { ...options, headers: headers2 });
    } catch (e) {
      // Give up; propagate 401
      throw new Error('Unauthorized');
    }
  }
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
    throw new Error(msg);
  }
  try { return await res.json() as T; } catch { return undefined as unknown as T; }
}

export const tokenStore = { getAccessToken, setAccessToken, getRefreshToken, setRefreshToken };
