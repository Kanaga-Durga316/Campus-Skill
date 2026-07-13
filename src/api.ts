const configuredBase = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api';

export const API_BASE = configuredBase;

export function getToken(): string | null {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

export async function fetchJSON(path: string, opts: RequestInit = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const headers: Record<string, string> = {};
  if (opts.headers && !(opts.headers instanceof Headers)) {
    Object.assign(headers, opts.headers);
  }

  // Add Content-Type header if body is present (but not for FormData, where the
  // browser must set the multipart boundary itself)
  if (
    opts.body &&
    !(opts.body instanceof FormData) &&
    !headers['Content-Type'] &&
    !headers['content-type']
  ) {
    headers['Content-Type'] = 'application/json';
  }

  // Auto-attach the auth token when available
  const token = getToken();
  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${normalizedPath}`, { ...opts, headers });

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message);
  }

  return res.json();
}
