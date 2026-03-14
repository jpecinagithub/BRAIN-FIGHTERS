import { Router } from "express"
import { z } from "zod"
import { query } from "../db"
import { assignMissingAvatars } from "../utils/avatars"

const router = Router()

const scoreSchema = z
  .object({
    playerId: z.number().int().positive().optional(),
    playerName: z.string().min(1).optional(),
    gameCode: z.string().min(1),
    points: z.number().int()
  })
  .refine((data) => data.playerId || data.playerName, {
    message: "playerId o playerName requerido"
  })

router.get("/play/:publicCode", async (req, res) => {
  const publicCode = String(req.params.publicCode || "")
  const matches = await query<any[]>(
    "SELECT id, public_code AS publicCode, status FROM matches WHERE public_code = ? AND status = 'active' LIMIT 1",
    [publicCode]
  )
  const match = matches[0]
  if (!match) {
    res.status(404).json({ error: "Partida no encontrada" })
    return
  }

  await assignMissingAvatars(match.id)
  const players = await query<any[]>(
    "SELECT id, name, team_id AS teamId, avatar_path AS avatarPath FROM players WHERE match_id = ? ORDER BY name ASC",
    [match.id]
  )
  const teams = await query<any[]>("SELECT id, name FROM teams WHERE match_id = ? ORDER BY name ASC", [match.id])
  const games = await query<any[]>(
    `SELECT games.code, games.name, games.description, games.icon_path AS iconPath, match_games.is_enabled AS isEnabled
     FROM match_games
     INNER JOIN games ON games.id = match_games.game_id
     WHERE match_games.match_id = ?
     ORDER BY games.name ASC`,
    [match.id]
  )

  res.json({
    id: match.id,
    publicCode: match.publicCode,
    status: match.status,
    players,
    teams,
    games: games.map((game) => ({
      ...game,
      isEnabled: Boolean(game.isEnabled)
    }))
  })
})

router.post("/play/:publicCode/score", async (req, res) => {
  const publicCode = String(req.params.publicCode || "")
  const parsed = scoreSchema.safeParse(req.body || {})
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" })
    return
  }

  const matches = await query<any[]>(
    "SELECT id FROM matches WHERE public_code = ? AND status = 'active' LIMIT 1",
    [publicCode]
  )
  const match = matches[0]
  if (!match) {
    res.status(404).json({ error: "Partida no encontrada" })
    return
  }

  const { playerId, playerName, gameCode, points } = parsed.data
  const playerRows = playerId
    ? await query<any[]>("SELECT id FROM players WHERE id = ? AND match_id = ? LIMIT 1", [playerId, match.id])
    : await query<any[]>("SELECT id FROM players WHERE name = ? AND match_id = ? LIMIT 1", [
        playerName,
        match.id
      ])
  const player = playerRows[0]
  if (!player) {
    res.status(404).json({ error: "Jugador no encontrado" })
    return
  }

  const gameRows = await query<any[]>(
    `SELECT games.id, match_games.is_enabled AS isEnabled
     FROM match_games
     INNER JOIN games ON games.id = match_games.game_id
     WHERE match_games.match_id = ? AND games.code = ? LIMIT 1`,
    [match.id, gameCode]
  )
  const game = gameRows[0]
  if (!game || !game.isEnabled) {
    res.status(400).json({ error: "Juego no habilitado" })
    return
  }

  await query(
    "INSERT INTO scores (match_id, player_id, game_id, points) VALUES (?, ?, ?, ?)",
    [match.id, player.id, game.id, points]
  )

  res.status(201).json({ status: "ok" })
})

router.get("/play/:publicCode/ranking", async (req, res) => {
  const publicCode = String(req.params.publicCode || "")
  const matches = await query<any[]>(
    "SELECT id FROM matches WHERE public_code = ? AND status = 'active' LIMIT 1",
    [publicCode]
  )
  const match = matches[0]
  if (!match) {
    res.status(404).json({ error: "Partida no encontrada" })
    return
  }

  const playerRanking = await query<any[]>(
    `SELECT players.id AS playerId,
            players.name AS name,
            teams.name AS teamName,
            COALESCE(SUM(scores.points), 0) AS points
     FROM players
     LEFT JOIN teams ON teams.id = players.team_id
     LEFT JOIN scores ON scores.player_id = players.id AND scores.match_id = ?
     WHERE players.match_id = ?
     GROUP BY players.id
     ORDER BY points DESC, players.name ASC`,
    [match.id, match.id]
  )

  const teamRanking = await query<any[]>(
    `SELECT teams.id AS teamId,
            teams.name AS name,
            COALESCE(SUM(scores.points), 0) AS points
     FROM teams
     LEFT JOIN players ON players.team_id = teams.id AND players.match_id = ?
     LEFT JOIN scores ON scores.player_id = players.id AND scores.match_id = ?
     WHERE teams.match_id = ?
     GROUP BY teams.id
     ORDER BY points DESC, teams.name ASC`,
    [match.id, match.id, match.id]
  )

  const unassignedRows = await query<any[]>(
    `SELECT COALESCE(SUM(scores.points), 0) AS points,
            COUNT(players.id) AS count
     FROM players
     LEFT JOIN scores ON scores.player_id = players.id AND scores.match_id = ?
     WHERE players.match_id = ? AND players.team_id IS NULL`,
    [match.id, match.id]
  )
  const unassigned = unassignedRows[0]
  if (Number(unassigned?.count || 0) > 0) {
    teamRanking.push({
      teamId: null,
      name: "Sin equipo",
      points: Number(unassigned?.points || 0)
    })
  }

  teamRanking.sort((a, b) => {
    const diff = Number(b.points || 0) - Number(a.points || 0)
    if (diff !== 0) return diff
    return String(a.name || "").localeCompare(String(b.name || ""))
  })

  res.json({
    players: playerRanking.map((row) => ({
      playerId: row.playerId,
      name: row.name,
      teamName: row.teamName || null,
      points: Number(row.points || 0)
    })),
    teams: teamRanking.map((row) => ({
      teamId: row.teamId,
      name: row.name,
      points: Number(row.points || 0)
    }))
  })
})

export default router
