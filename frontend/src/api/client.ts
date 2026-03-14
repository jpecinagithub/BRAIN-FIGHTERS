export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

const ACCESS_TOKEN_KEY = "bf_access_token"

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string | null) {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken() {
  if (!refreshing) {
    refreshing = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include"
    })
      .then(async (res) => {
        if (!res.ok) return null
        const data = await res.json()
        return data.accessToken || null
      })
      .catch(() => null)
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = getAccessToken()
  const headers = new Headers(options.headers || {})
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json")
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  })

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      setAccessToken(newToken)
      return apiFetch<T>(path, options, false)
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Error desconocido" }))
    throw new Error(error.error || "Error desconocido")
  }

  return res.json() as Promise<T>
}
