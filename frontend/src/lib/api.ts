import type { ApiEnvelope } from "../types/api";

const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

function shouldSetJsonContentType(body: BodyInit | null | undefined) {
  return body !== undefined && body !== null && !(body instanceof FormData);
}

async function requestEnvelope<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init?.headers ?? {});

  if (shouldSetJsonContentType(init?.body) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include"
  });

  if (response.status === 401 && path !== "/auth/refresh" && path !== "/auth/login") {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });

    if (refreshed.ok) {
      const refreshBody = (await refreshed.json()) as ApiEnvelope<{ accessToken: string }>;
      setAccessToken(refreshBody.data.accessToken);
      return requestEnvelope<T>(path, init);
    }
  }

  const body = (await response.json()) as ApiEnvelope<T> & {
    error?: { message?: string };
  };

  if (!response.ok || !body.success) {
    throw new Error(body.error?.message ?? "Request failed");
  }

  return body;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const body = await requestEnvelope<T>(path, init);
  return body.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  getEnvelope: <T>(path: string) => requestEnvelope<T>(path),
  post: <T>(path: string, payload?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: payload ? JSON.stringify(payload) : undefined
    }),
  postForm: <T>(path: string, payload: FormData) =>
    request<T>(path, {
      method: "POST",
      body: payload
    }),
  patch: <T>(path: string, payload?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: payload ? JSON.stringify(payload) : undefined
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: "DELETE"
    })
};
