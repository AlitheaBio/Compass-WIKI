// Lightweight single-origin API client for dev and real API calls
// Usage:
//   import { apiGet, apiPost, devGet, devPost } from './api';
//   const data = await apiGet('/data/...');
//   const res  = await devPost('/execute', { input: {...} });

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function apiPost<T>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(init?.headers || {}) },
    body: body != null ? JSON.stringify(body) : undefined,
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function devGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/dev${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET /dev${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Note: local module actions are mounted under /api (e.g., /api/execute)
export async function devPost<T>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(init?.headers || {}) },
    body: body != null ? JSON.stringify(body) : undefined,
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

