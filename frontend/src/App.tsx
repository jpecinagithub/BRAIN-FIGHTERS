import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { GameProvider } from "./contexts/GameContext.jsx"
import { RequireAuth } from "./components/RequireAuth"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import AdminDashboard from "./pages/AdminDashboard"
import MatchConfigPage from "./pages/MatchConfigPage"
import PlayLobby from "./pages/PlayLobby"
import GamePage from "./pages/GamePage"

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/matches/:id"
              element={
                <RequireAuth>
                  <MatchConfigPage />
                </RequireAuth>
              }
            />
            <Route path="/play/:publicCode" element={<PlayLobby />} />
            <Route path="/play/:publicCode/game/:gameId/:player" element={<GamePage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </AuthProvider>
  )
}
