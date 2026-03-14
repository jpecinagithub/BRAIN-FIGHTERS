import { createContext, useContext, useMemo, useState } from "react"
import { login as apiLogin, logout as apiLogout, register as apiRegister } from "../api/auth"
import { getAccessToken, setAccessToken } from "../api/client"

interface Admin {
  id: number
  email: string
}

interface AuthContextValue {
  admin: Admin | null
  accessToken: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const ADMIN_KEY = "bf_admin"

function loadAdmin(): Admin | null {
  const raw = localStorage.getItem(ADMIN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Admin
  } catch {
    return null
  }
}

function saveAdmin(admin: Admin | null) {
  if (!admin) {
    localStorage.removeItem(ADMIN_KEY)
    return
  }
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(loadAdmin)
  const [accessToken, setAccessTokenState] = useState<string | null>(getAccessToken())

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      accessToken,
      login: async (email: string, password: string) => {
        const data = await apiLogin(email, password)
        setAccessTokenState(data.accessToken)
        setAccessToken(data.accessToken)
        setAdmin(data.admin)
        saveAdmin(data.admin)
      },
      register: async (email: string, password: string) => {
        const data = await apiRegister(email, password)
        setAccessTokenState(data.accessToken)
        setAccessToken(data.accessToken)
        setAdmin(data.admin)
        saveAdmin(data.admin)
      },
      logout: async () => {
        await apiLogout()
        setAccessTokenState(null)
        setAccessToken(null)
        setAdmin(null)
        saveAdmin(null)
      }
    }),
    [admin, accessToken]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
