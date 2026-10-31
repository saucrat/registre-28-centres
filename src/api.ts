import type { Registry } from "./types";

const API = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchRegistry(): Promise<Registry> {
  return request<Registry>("/registry");
}

export async function putRegistry(data: Registry): Promise<Registry> {
  return request<Registry>("/registry", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function resetRegistryRemote(): Promise<Registry> {
  return request<Registry>("/registry/reset", { method: "POST" });
}

export async function pingApi(): Promise<boolean> {
  try {
    const health = await request<{ ok: boolean }>("/health");
    return health.ok === true;
  } catch {
    return false;
  }
}
