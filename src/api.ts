const configuredBase = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api';

export const API_BASE = configuredBase;

export async function fetchJSON(path: string, opts: RequestInit = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${API_BASE}${normalizedPath}`, opts);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}
