import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getPublicMatch, getPublicRanking } from "../api/public"
import type { PublicMatch, PublicRanking } from "../api/public"
import { API_URL } from "../api/client"

export default function PlayLobby() {
  const { publicCode } = useParams()
  const navigate = useNavigate()
  const [match, setMatch] = useState<PublicMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [ranking, setRanking] = useState<PublicRanking | null>(null)
  const [rankingLoading, setRankingLoading] = useState(false)
  const [rankingError, setRankingError] = useState<string | null>(null)

  useEffect(() => {
    if (!publicCode) return
    setLoading(true)
    setError(null)
    getPublicMatch(publicCode)
      .then((data) => {
        setMatch(data)
      })
      .catch((err: any) => setError(err?.message || "No se pudo cargar la partida"))
      .finally(() => setLoading(false))
  }, [publicCode])

  async function loadRanking(code: string) {
    setRankingLoading(true)
    setRankingError(null)
    try {
      const data = await getPublicRanking(code)
      setRanking(data)
    } catch (err: any) {
      setRankingError(err?.message || "No se pudo cargar la clasificación")
    } finally {
      setRankingLoading(false)
    }
  }

  useEffect(() => {
    if (!publicCode) return
    loadRanking(publicCode)
  }, [publicCode])

  const enabledGames = useMemo(
    () => match?.games.filter((game) => game.isEnabled) || [],
    [match]
  )

  if (loading) {
    return <div className="play-page">Cargando...</div>
  }

  if (!match || !publicCode) {
    return <div className="play-page">Partida no encontrada.</div>
  }

  return (
    <div className="play-page">
      <header className="play-header">
        <h1>Brain Fighters</h1>
        <p>Selecciona jugador y juego</p>
      </header>

      {error && <div className="auth-error">{error}</div>}

      <section className="player-select">
        <h2>Jugadores</h2>
        <div className="player-grid">
          {match.players.map((player, index) => {
            const fallbackAvatar = `avatar${(index % 12) + 1}.png`
            const avatarFile = player.avatarPath || fallbackAvatar
            return (
            <button
              key={player.id}
              className={selectedPlayer === player.name ? "player-card active" : "player-card"}
              onClick={() => setSelectedPlayer(player.name)}
            >
              <img src={`${API_URL}/avatars/${avatarFile}`} alt={player.name} />
              <span>{player.name}</span>
            </button>
          )})}
        </div>
      </section>

      <section className="games-section">
        <h2>Juegos disponibles</h2>
        {selectedPlayer ? (
          <div className="games-grid">
            {enabledGames.map((game) => (
              <button
                key={game.code}
                className="game-card"
                onClick={() =>
                  navigate(`/play/${publicCode}/game/${game.code}/${encodeURIComponent(selectedPlayer)}`)
                }
              >
                <div className="game-icon">
                  <img src={`${API_URL}${game.iconPath}`} alt={game.name} />
                </div>
                <div>
                  <h3>{game.name}</h3>
                  <p>{game.description}</p>
                </div>
              </button>
            ))}
            {enabledGames.length === 0 && <p className="muted">No hay juegos activos.</p>}
          </div>
        ) : (
          <p className="muted">Selecciona un jugador para desbloquear los juegos.</p>
        )}
      </section>

      <section className="ranking-section">
        <div className="ranking-header">
          <h2>Clasificación</h2>
          <button className="secondary" onClick={() => publicCode && loadRanking(publicCode)} disabled={rankingLoading}>
            {rankingLoading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
        {rankingError && <div className="auth-error">{rankingError}</div>}
        <div className="ranking-grid">
          <div className="ranking-card">
            <h3>Individual</h3>
            {rankingLoading && <p className="muted">Cargando...</p>}
            {!rankingLoading && (!ranking?.players || ranking.players.length === 0) && (
              <p className="muted">Sin puntuaciones todavía.</p>
            )}
            {!rankingLoading && ranking?.players && ranking.players.length > 0 && (
              <ol className="ranking-list">
                {ranking.players.map((player, index) => (
                  <li key={player.playerId} className="ranking-row">
                    <span className="ranking-pos">#{index + 1}</span>
                    <div className="ranking-name">
                      <strong>{player.name}</strong>
                      {player.teamName && <small>{player.teamName}</small>}
                    </div>
                    <span className="ranking-points">{player.points}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="ranking-card">
            <h3>Equipos</h3>
            {rankingLoading && <p className="muted">Cargando...</p>}
            {!rankingLoading && (!ranking?.teams || ranking.teams.length === 0) && (
              <p className="muted">Sin puntuaciones todavía.</p>
            )}
            {!rankingLoading && ranking?.teams && ranking.teams.length > 0 && (
              <ol className="ranking-list">
                {ranking.teams.map((team, index) => (
                  <li key={`${team.teamId ?? "none"}-${team.name}`} className="ranking-row">
                    <span className="ranking-pos">#{index + 1}</span>
                    <div className="ranking-name">
                      <strong>{team.name}</strong>
                    </div>
                    <span className="ranking-points">{team.points}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
