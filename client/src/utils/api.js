export const API_BASE = "http://localhost:5000";

export function authHeaders() {
  const token = localStorage.getItem("servespot_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
