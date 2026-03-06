import { API_CONFIG } from "@/config/api";

type ParseAs = "json" | "text" | "blob" | "none";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface ApiRequestOptions
  extends Omit<RequestInit, "body" | "headers" | "method"> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string | null;
  params?: Record<string, string | number | boolean | null | undefined>;
  headers?: HeadersInit;
  body?: BodyInit | Record<string, unknown> | null;
  parseAs?: ParseAs;
}

const isBodyInit = (value: unknown): value is BodyInit =>
  value instanceof FormData ||
  value instanceof URLSearchParams ||
  value instanceof Blob ||
  value instanceof ArrayBuffer ||
  ArrayBuffer.isView(value) ||
  typeof value === "string";

const buildUrl = (
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>
) => {
  const configuredBase = API_CONFIG.BASE_URL;

  // Ensure we can always construct a valid URL:
  // - allow absolute URLs (http/https)
  // - allow protocol-relative URLs (//host/path)
  // - allow host-only values (localhost:5000/api/v1)
  // - allow relative paths (/api/v1)
  const normalizeBase = (base: string) => {
    const trimmed = String(base || "").trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    if (trimmed.startsWith("//")) {
      const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
      return `${protocol}${trimmed}`;
    }
    // If it looks like a host[:port]/path without protocol, prefix protocol.
    if (/^[a-z0-9.-]+(:\d+)?(\/|$)/i.test(trimmed)) {
      const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
      return `${protocol}//${trimmed}`;
    }
    return trimmed;
  };

  const base = normalizeBase(configuredBase);
  const basePath = path.startsWith("http://") || path.startsWith("https://")
    ? path
    : `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  // Use window origin as a fallback base for relative URLs.
  const fallbackOrigin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const url = new URL(basePath, fallbackOrigin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
};

const parseResponse = async <T>(response: Response, parseAs: ParseAs): Promise<T> => {
  if (parseAs === "none") {
    return undefined as T;
  }

  if (parseAs === "blob") {
    return (await response.blob()) as T;
  }

  if (parseAs === "text") {
    return (await response.text()) as T;
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return (await response.text()) as T;
  }

  return (await response.json()) as T;
};

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    token,
    params,
    headers,
    body,
    parseAs = "json",
    ...rest
  } = options;

  const requestHeaders = new Headers(headers);
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let requestBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (isBodyInit(body)) {
      requestBody = body;
    } else {
      requestHeaders.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers: requestHeaders,
    body: requestBody,
    ...rest,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    let details: unknown = null;
    let message = `Request failed with status ${response.status}`;

    try {
      if (contentType?.includes("application/json")) {
        details = await response.json();
        const apiMessage =
          (details as { message?: string; error?: string })?.message ||
          (details as { message?: string; error?: string })?.error;
        if (apiMessage) {
          message = apiMessage;
        }
      } else {
        const text = await response.text();
        details = text;
        if (text) {
          message = text;
        }
      }
    } catch {
      // Ignore parse errors and keep default message.
    }

    throw new ApiError(message, response.status, details);
  }

  return parseResponse<T>(response, parseAs);
}

export const api = {
  get: <T>(path: string, options: Omit<ApiRequestOptions, "method"> = {}) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, options: Omit<ApiRequestOptions, "method"> = {}) =>
    apiRequest<T>(path, { ...options, method: "POST" }),
  put: <T>(path: string, options: Omit<ApiRequestOptions, "method"> = {}) =>
    apiRequest<T>(path, { ...options, method: "PUT" }),
  patch: <T>(path: string, options: Omit<ApiRequestOptions, "method"> = {}) =>
    apiRequest<T>(path, { ...options, method: "PATCH" }),
  delete: <T>(path: string, options: Omit<ApiRequestOptions, "method"> = {}) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};
