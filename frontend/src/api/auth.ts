import { apiFetch, setAccessToken } from "./client"

export interface AuthResponse {
  accessToken: string
  admin: { id: number; email: string }
}

export async function register(email: string, password: string) {
  const data = await apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password })
  }, false)
  setAccessToken(data.accessToken)
  return data
}

export async function login(email: string, password: string) {
  const data = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  }, false)
  setAccessToken(data.accessToken)
  return data
}

export async function logout() {
  await apiFetch("/api/auth/logout", { method: "POST" }, false)
  setAccessToken(null)
}
