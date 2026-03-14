import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { createMatch, deleteMatch, finishMatch, getMatches } from "../api/matches"
import type { Match } from "../api/matches"
import { useAuth } from "../contexts/AuthContext"

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { admin, logout } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedMatchId, setCopiedMatchId] = useState<number | null>(null)
  const copyTimeoutRef = useRef<number | null>(null)

  const activeCount = useMemo(() => matches.filter((m) => m.status === "active").length, [matches])

  async function loadMatches() {
    setLoading(true)
    setError(null)
    try {
      const data = await getMatches()
      setMatches(data)
    } catch (err: any) {
      setError(err?.message || "No se pudieron cargar las partidas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMatches()
  }, [])

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  async function handleCreateMatch() {
    setError(null)
    try {
      await createMatch()
      await loadMatches()
    } catch (err: any) {
      setError(err?.message || "No se pudo crear la partida")
    }
  }

  async function handleFinishMatch(matchId: number) {
    await finishMatch(matchId)
    await loadMatches()
  }

  async function handleDeleteMatch(matchId: number) {
    await deleteMatch(matchId)
    await loadMatches()
  }

  async function handleCopyUrl(matchId: number, publicUrl: string) {
    setError(null)
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopiedMatchId(matchId)
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current)
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopiedMatchId(null)
      }, 2000)
    } catch (err: any) {
      setError(err?.message || "No se pudo copiar la URL")
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Panel de Admin</h1>
          <p>Bienvenido, {admin?.email}</p>
        </div>
        <div className="admin-actions">
          <button onClick={handleCreateMatch} disabled={activeCount >= 3}>
            Crear nueva partida
          </button>
          <button className="secondary" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="admin-summary">
        <div className="summary-card">
          <span>Partidas activas</span>
          <strong>{activeCount} / 3</strong>
        </div>
        <div className="summary-card">
          <span>Total de partidas</span>
          <strong>{matches.length}</strong>
        </div>
      </section>

      {error && <div className="auth-error">{error}</div>}

      <section className="match-list">
        {loading && <p>Cargando partidas...</p>}
        {!loading && matches.length === 0 && <p>No hay partidas todavía.</p>}
        {matches.map((match) => {
          const publicUrl = `${window.location.origin}/play/${match.publicCode}`
          return (
            <article key={match.id} className={`match-card ${match.status}`}>
              <div>
                <h3>Partida #{match.id}</h3>
                <p>Estado: {match.status === "active" ? "Activa" : "Finalizada"}</p>
                <div className="public-url">
                  <span className="label">URL pública</span>
                  <span className={`value ${copiedMatchId === match.id ? "copied" : ""}`}>{publicUrl}</span>
                  <button className="copy-btn" onClick={() => handleCopyUrl(match.id, publicUrl)}>
                    Copiar URL
                  </button>
                </div>
              </div>
              <div className="match-actions">
                <button onClick={() => navigate(`/admin/matches/${match.id}`)}>Configurar</button>
                {match.status === "active" ? (
                  <button className="secondary" onClick={() => handleFinishMatch(match.id)}>
                    Finalizar
                  </button>
                ) : (
                  <button className="danger" onClick={() => handleDeleteMatch(match.id)}>
                    Borrar
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
