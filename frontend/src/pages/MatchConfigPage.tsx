import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  assignPlayerTeam,
  createPlayer,
  createTeam,
  deletePlayer,
  deleteTeam,
  getMatch,
  updateMatchGames
} from "../api/matches"

interface MatchData {
  id: number
  status: "active" | "ended"
  publicCode: string
  players: { id: number; name: string; teamId: number | null; team?: { name: string } | null }[]
  teams: { id: number; name: string }[]
  matchGames: { id: number; isEnabled: boolean; game: { code: string; name: string; description: string } }[]
}

export default function MatchConfigPage() {
  const navigate = useNavigate()
  const params = useParams()
  const matchId = Number(params.id)
  const [match, setMatch] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState("")
  const [teamName, setTeamName] = useState("")

  async function loadMatch() {
    setLoading(true)
    setError(null)
    try {
      const data = await getMatch(matchId)
      setMatch(data as MatchData)
    } catch (err: any) {
      setError(err?.message || "No se pudo cargar la partida")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (Number.isNaN(matchId)) {
      navigate("/admin")
      return
    }
    loadMatch()
  }, [matchId])

  async function handleCreatePlayer() {
    if (!playerName.trim()) return
    await createPlayer(matchId, playerName.trim())
    setPlayerName("")
    await loadMatch()
  }

  async function handleCreateTeam() {
    if (!teamName.trim()) return
    await createTeam(matchId, teamName.trim())
    setTeamName("")
    await loadMatch()
  }

  async function handleToggleGame(code: string, isEnabled: boolean) {
    await updateMatchGames(matchId, [{ code, isEnabled }])
    await loadMatch()
  }

  if (loading) {
    return <div className="admin-page">Cargando...</div>
  }

  if (!match) {
    return <div className="admin-page">No se encontró la partida.</div>
  }

  const publicUrl = `${window.location.origin}/play/${match.publicCode}`

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Configurar partida #{match.id}</h1>
          <p>URL pública: {publicUrl}</p>
        </div>
        <div className="admin-actions">
          <button className="secondary" onClick={() => navigate("/admin")}>
            Volver
          </button>
        </div>
      </header>

      {error && <div className="auth-error">{error}</div>}

      <section className="config-grid">
        <div className="config-card">
          <h2>Equipos</h2>
          <div className="form-row">
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Nombre del equipo"
            />
            <button onClick={handleCreateTeam}>Añadir</button>
          </div>
          <ul className="list">
            {match.teams.map((team) => (
              <li key={team.id}>
                {team.name}
                <button className="danger" onClick={() => deleteTeam(matchId, team.id).then(loadMatch)}>
                  Borrar
                </button>
              </li>
            ))}
            {match.teams.length === 0 && <li className="muted">Sin equipos todavía.</li>}
          </ul>
        </div>

        <div className="config-card">
          <h2>Jugadores</h2>
          <div className="form-row">
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Nombre del jugador"
            />
            <button onClick={handleCreatePlayer}>Añadir</button>
          </div>
          <ul className="list">
            {match.players.map((player) => (
              <li key={player.id}>
                <div>
                  <strong>{player.name}</strong>
                </div>
                <div className="row-actions">
                  <select
                    value={player.teamId ?? ""}
                    onChange={(e) =>
                      assignPlayerTeam(matchId, player.id, e.target.value ? Number(e.target.value) : null).then(loadMatch)
                    }
                  >
                    <option value="">Sin equipo</option>
                    {match.teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <button className="danger" onClick={() => deletePlayer(matchId, player.id).then(loadMatch)}>
                    Borrar
                  </button>
                </div>
              </li>
            ))}
            {match.players.length === 0 && <li className="muted">Sin jugadores todavía.</li>}
          </ul>
        </div>

        <div className="config-card">
          <h2>Juegos activos</h2>
          <ul className="list">
            {match.matchGames.map((mg) => (
              <li key={mg.id} className="game-row">
                <div>
                  <strong>{mg.game.name}</strong>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={mg.isEnabled}
                    onChange={(e) => handleToggleGame(mg.game.code, e.target.checked)}
                  />
                  <span />
                </label>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
