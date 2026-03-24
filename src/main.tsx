
import React from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import App from './App.tsx';
import './index.css';

const NGROK_BYPASS_HEADER = 'ngrok-skip-browser-warning';
const NGROK_BYPASS_VALUE = 'true';

const isNgrokHost = (url: string): boolean => {
  try {
    const parsed = new URL(url, window.location.origin);
    return (
      parsed.hostname.endsWith('ngrok-free.dev') ||
      parsed.hostname.endsWith('ngrok.io') ||
      parsed.hostname.endsWith('ngrok.app')
    );
  } catch {
    return false;
  }
};

const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const requestUrl = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
  if (!isNgrokHost(requestUrl)) {
    return originalFetch(input, init);
  }

  const mergedHeaders = new Headers(
    init?.headers || (input instanceof Request ? input.headers : undefined),
  );
  if (!mergedHeaders.has(NGROK_BYPASS_HEADER)) {
    mergedHeaders.set(NGROK_BYPASS_HEADER, NGROK_BYPASS_VALUE);
  }

  return originalFetch(input, { ...init, headers: mergedHeaders });
};

axios.interceptors.request.use((config) => {
  const requestUrl = config.url || '';
  const baseUrl = config.baseURL || '';
  const resolvedUrl = requestUrl.startsWith('http') ? requestUrl : `${baseUrl}${requestUrl}`;

  if (isNgrokHost(resolvedUrl)) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>)[NGROK_BYPASS_HEADER] = NGROK_BYPASS_VALUE;
  }

  return config;
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
