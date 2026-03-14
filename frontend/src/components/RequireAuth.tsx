import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export function RequireAuth({ children }: { children: ReactNode }) {
  const { accessToken, admin } = useAuth()
  if (!accessToken || !admin) {
    return <Navigate to="/login" replace />
  }
  return children
}
