// @ts-nocheck
// src/services/api.ts

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/api';

// ── Token storage ─────────────────────────────────────────────
const getToken  = ()    => localStorage.getItem('access_token');
const setTokens = (a,r) => {
  localStorage.setItem('access_token', a);
  localStorage.setItem('refresh_token', r);
};
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// ── Core fetch with auto-refresh ──────────────────────────────
async function request(endpoint: string, options: any = {}) {
  const token = getToken();
  // Allow caller to pass Content-Type: undefined to let browser set multipart boundary
  const contentType = options.headers?.['Content-Type'] === undefined
    ? undefined
    : (options.headers?.['Content-Type'] ?? 'application/json');

  const headers: Record<string, string> = {
    ...(contentType !== undefined ? { 'Content-Type': contentType } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  // Remove explicitly-undefined headers passed by caller
  if (options.headers) {
    for (const [k, v] of Object.entries(options.headers)) {
      if (v !== undefined) (headers as any)[k] = v;
    }
  }

  let res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.Authorization = `Bearer ${getToken()}`;
      res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    } else {
      clearTokens();
      window.location.href = '/login';
      return;
    }
  }

  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message, errors: data.errors };
  return data.data;
}

async function tryRefresh() {
  const rt = localStorage.getItem('refresh_token');
  if (!rt) return false;
  try {
    const res  = await fetch(`${BASE_URL}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refresh_token: rt }),
    });
    const data = await res.json();
    if (res.ok) { setTokens(data.data.access_token, data.data.refresh_token); return true; }
  } catch {}
  return false;
}

// ── Auth ──────────────────────────────────────────────────────
export const auth = {
  register: (
    name: string,
    username: string,
    email: string,
    password: string | null,
    location: string,
    onboarding_token: string | null = null
  ) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ name, username, email, password, location, onboarding_token }) })
      .then(d => { setTokens(d.access_token, d.refresh_token); return d; }),

  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
      .then(d => { setTokens(d.access_token, d.refresh_token); return d; }),

  logout: async () => {
    await request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: localStorage.getItem('refresh_token') }),
    }).catch(() => {});
    clearTokens();
  },

  me: () => request('/users/me'),

  google: (credential) =>
    request('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) })
      .then(d => { if (d.exists) setTokens(d.access_token, d.refresh_token); return d; }),

  github: (code, redirect_uri, code_verifier) =>
    request('/auth/github', { method: 'POST', body: JSON.stringify({ code, redirect_uri, code_verifier }) })
      .then(d => { if (d.exists) setTokens(d.access_token, d.refresh_token); return d; }),
};

// ── Skills ────────────────────────────────────────────────────
export const skills = {
  list:   ()       => request('/skills'),
  search: (params) => request('/skills/search?' + new URLSearchParams(params)),
  addUserSkill:    (data)   => request('/skills/user', { method: 'POST', body: JSON.stringify(data) }),
  getUserSkills:   ()       => request('/skills/user'),
  deleteUserSkill: (id)     => request(`/skills/user/${id}`, { method: 'DELETE' }),
  recommendations: ()       => request('/skills/recommendations'),
};

// ── Swap Requests ─────────────────────────────────────────────
export const swaps = {
  create:  (data)         => request('/swaps/request', { method: 'POST',  body: JSON.stringify(data) }),
  list:    (params = {})  => request('/swaps?' + new URLSearchParams(params)),
  get:     (id)           => request(`/swaps/${id}`),
  accept:  (id, data = {})=> request(`/swaps/${id}/accept`,  { method: 'PUT', body: JSON.stringify(data) }),
  reject:  (id)           => request(`/swaps/${id}/reject`,  { method: 'PUT', body: '{}' }),
  cancel:  (id)           => request(`/swaps/${id}/cancel`,  { method: 'PUT', body: '{}' }),
};

// ── Sessions ──────────────────────────────────────────────────
export const sessions = {
  list:     (params = {}) => request('/sessions?' + new URLSearchParams(params)),
  complete: (id)          => request(`/sessions/${id}/complete`, { method: 'PUT', body: '{}' }),
  feedback: (id, score, text) =>
    request(`/sessions/${id}/feedback`, { method: 'POST', body: JSON.stringify({ score, text }) }),
};

// ── Credits ───────────────────────────────────────────────────
export const credits = {
  balance: () => request('/credits/balance'),
  history: (page = 1) => request(`/credits/history?page=${page}`),
  buy: (amount: number) => request('/credits/buy', { method: 'POST', body: JSON.stringify({ credits: amount }) }),
};

// ── Uploads ───────────────────────────────────────────────────
export const uploads = {
  video: (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('video', file);
    return fetch(`${BASE_URL}/uploads/video`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw { status: res.status, message: data.message };
      return data.data;
    });
  },
};

// ── Skill Circles ─────────────────────────────────────────────
export const circles = {
  list:   ()     => request('/circles'),
  nearby: (lat, lng, radius = 25) =>
    request(`/circles/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  create: (data) => request('/circles', { method: 'POST', body: JSON.stringify(data) }),
  get:    (id)   => request(`/circles/${id}`),
  join:   (id)   => request(`/circles/${id}/join`, { method: 'POST', body: '{}' }),
  leave:  (id)   => request(`/circles/${id}/leave`, { method: 'DELETE' }),
};

// ── Users ─────────────────────────────────────────────────────
export const users = {
  profile:      (id)   => request(`/users/${id}/profile`),
  update:       (data) => request('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  notifications: (unreadOnly = false) =>
    request(`/notifications${unreadOnly ? '?unread=true' : ''}`),
};

// ── Roadmap ───────────────────────────────────────────────────
export const roadmap = {
  generate: (goal?: string, source = 'recent_swaps') =>
    request('/roadmap/generate?' + new URLSearchParams(goal ? { goal } : { source })),
};
