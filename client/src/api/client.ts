import { ApiError } from "@/lib/apiError";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:8080/api"
  : "/api";

const OWNER_TOKEN_KEY = "key_token";
const CUSTOMER_TOKEN_KEY = "key_customer_token";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: "owner" | "customer" | "none";
  raw?: boolean;
};

async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = "owner", raw, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);

  if (!raw && body !== undefined && !(body instanceof FormData)) {
    finalHeaders.set("Content-Type", "application/json");
  }

if (auth === "owner") {
  const token = localStorage.getItem(OWNER_TOKEN_KEY);
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
} else if (auth === "customer") {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
}

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    requestBody = raw ? (body as BodyInit) : JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: requestBody,
  });

  let data: unknown = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text().catch(() => null);
  }

  if (res.status === 401) {
    const isAuthEndpoint = path.startsWith("/auth/");
    if (!isAuthEndpoint) {
      if (auth === "owner") {
        localStorage.removeItem(OWNER_TOKEN_KEY);
        window.dispatchEvent(new Event("key:logout"));
      } else if (auth === "customer") {
        localStorage.removeItem(CUSTOMER_TOKEN_KEY);
        window.dispatchEvent(new Event("key:customer-logout"));
      }
    }
  }

  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ||
      `Ошибка запроса (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

export const customerApi = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET", auth: "customer" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body, auth: "customer" }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body, auth: "customer" }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE", auth: "customer" }),
};

export const publicApi = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET", auth: "none" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body, auth: "none" }),
};

export const tokens = {
  owner: {
    get: () => localStorage.getItem(OWNER_TOKEN_KEY),
    set: (t: string) => localStorage.setItem(OWNER_TOKEN_KEY, t),
    clear: () => localStorage.removeItem(OWNER_TOKEN_KEY),
  },
  customer: {
    get: () => localStorage.getItem(CUSTOMER_TOKEN_KEY),
    set: (t: string) => localStorage.setItem(CUSTOMER_TOKEN_KEY, t),
    clear: () => localStorage.removeItem(CUSTOMER_TOKEN_KEY),
  },
};

export const API_BASE_URL = API_BASE;