import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { accessToken, admin } = useAuth()
  if (!accessToken || !admin) {
    return <Navigate to="/login" replace />
  }
  return children
}
