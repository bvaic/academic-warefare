/**
 * api.js — thin wrapper around fetch for the Academic Warfare backend
 *
 * Set VITE_API_URL in your .env (defaults to http://localhost:4000)
 */

const BASE = import.meta.env?.VITE_API_URL ?? "http://localhost:3001";

async function request(path, options = {}) {
  const token = localStorage.getItem("aw_token");
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

/* ── Auth ── */
export const apiRegister = (body) =>
  request("/api/auth/register", { method: "POST", body: JSON.stringify(body) });

export const apiLogin = (body) =>
  request("/api/auth/login", { method: "POST", body: JSON.stringify(body) });

export const apiMe = () => request("/api/auth/me");
