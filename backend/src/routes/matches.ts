import { Router } from "express"
import crypto from "crypto"
import { z } from "zod"
import { pool, query } from "../db"
import { requireAuth, AuthRequest } from "../middleware/auth"
import { assignMissingAvatars, listAvatarFiles } from "../utils/avatars"

const router = Router()

const playerSchema = z.object({
  name: z.string().min(1).max(60),
  teamId: z.number().int().positive().optional().nullable()
})

const teamSchema = z.object({
  name: z.string().min(1).max(60)
})

const gameUpdateSchema = z.object({
  updates: z.array(
    z.object({
      code: z.string().min(1),
      isEnabled: z.boolean()
    })
  )
})

function generatePublicCode() {
  return crypto.randomBytes(16).toString("hex")
}

async function pickAvatar(matchId: number) {
  const files = listAvatarFiles()
  if (files.length === 0) {
    return null
  }
  const usedRows = await query<any[]>(
    "SELECT avatar_path FROM players WHERE match_id = ? AND avatar_path IS NOT NULL",
    [matchId]
  )
  const used = new Set(usedRows.map((row) => row.avatar_path).filter(Boolean))
  const available = files.filter((fileName) => !used.has(fileName))
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)]
  }
  const countRows = await query<any[]>("SELECT COUNT(*) AS count FROM players WHERE match_id = ?", [matchId])
  const count = Number(countRows[0]?.count || 0)
  return files[count % files.length]
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const adminId = req.admin!.id
  const matches = await query<any[]>(
    `SELECT id,
            admin_id AS adminId,
            status,
            public_code AS publicCode,
            created_at AS createdAt,
            ended_at AS endedAt
     FROM matches
     WHERE admin_id = ?
     ORDER BY created_at DESC`,
    [adminId]
  )
  res.json(matches)
})

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const adminId = req.admin!.id
  const counts = await query<any[]>("SELECT COUNT(*) AS count FROM matches WHERE admin_id = ? AND status = 'active'", [
    adminId
  ])
  if ((counts[0]?.count || 0) >= 3) {
    res.status(409).json({ error: "Límite de 3 partidas activas alcanzado" })
    return
  }

  let publicCode = generatePublicCode()
  let attempts = 0
  while (attempts < 5) {
    const existing = await query<any[]>("SELECT id FROM matches WHERE public_code = ? LIMIT 1", [publicCode])
    if (!existing[0]) break
    publicCode = generatePublicCode()
    attempts += 1
  }
  if (attempts >= 5) {
    res.status(500).json({ error: "No se pudo generar un código único" })
    return
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [result] = await connection.execute(
      "INSERT INTO matches (admin_id, status, public_code) VALUES (?, 'active', ?)",
      [adminId, publicCode]
    )
    const matchId = (result as any).insertId as number

    const [games] = await connection.execute("SELECT id FROM games")
    const gameRows = games as { id: number }[]
    if (gameRows.length > 0) {
      const values = gameRows.map((game) => [matchId, game.id, 1])
      await connection.query("INSERT INTO match_games (match_id, game_id, is_enabled) VALUES ?", [values])
    }

    await connection.commit()
    const created = await query<any[]>(
      `SELECT id,
              admin_id AS adminId,
              status,
              public_code AS publicCode,
              created_at AS createdAt,
              ended_at AS endedAt
       FROM matches
       WHERE id = ?`,
      [matchId]
    )
    res.status(201).json(created[0])
  } catch {
    await connection.rollback()
    res.status(500).json({ error: "No se pudo crear la partida" })
  } finally {
    connection.release()
  }
})

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  const adminId = req.admin!.id
  const matchId = Number(req.params.id)
  if (!Number.isInteger(matchId)) {
    res.status(400).json({ error: "ID inválido" })
    return
  }

  const matches = await query<any[]>(
    `SELECT id,
            admin_id AS adminId,
            status,
            public_code AS publicCode,
            created_at AS createdAt,
            ended_at AS endedAt
     FROM matches
     WHERE id = ? AND admin_id = ?
     LIMIT 1`,
    [matchId, adminId]
  )
  const match = matches[0]
  if (!match) {
    res.status(404).json({ error: "Partida no encontrada" })
    return
  }

  await assignMissingAvatars(matchId)
  const players = await query<any[]>(
    `SELECT players.id, players.name, players.team_id AS teamId, players.avatar_path AS avatarPath, teams.name AS teamName
     FROM players
     LEFT JOIN teams ON teams.id = players.team_id
     WHERE players.match_id = ?
     ORDER BY players.name ASC`,
    [matchId]
  )
  const teams = await query<any[]>("SELECT id, name FROM teams WHERE match_id = ? ORDER BY name ASC", [matchId])
  const matchGames = await query<any[]>(
    `SELECT match_games.id, match_games.is_enabled AS isEnabled, games.code, games.name, games.description
     FROM match_games
     INNER JOIN games ON games.id = match_games.game_id
     WHERE match_games.match_id = ?
     ORDER BY games.name ASC`,
    [matchId]
  )

  res.json({
    ...match,
    players: players.map((player) => ({
      id: player.id,
      name: player.name,
      teamId: player.teamId,
      avatarPath: player.avatarPath,
      team: player.teamName ? { name: player.teamName } : null
    })),
    teams,
    matchGames: matchGames.map((mg) => ({
      id: mg.id,
      isEnabled: Boolean(mg.isEnabled),
      game: { code: mg.code, name: mg.name, description: mg.description }
    }))
  })
})

router.patch("/:id/finish", requireAuth, async (req: AuthRequest, res) => {
  const adminId = req.admin!.id
  const matchId = Number(req.params.id)

  const matches = await query<any[]>("SELECT status FROM matches WHERE id = ? AND admin_id = ? LIMIT 1", [
    matchId,
    adminId
  ])
  const match = matches[0]
  if (!match) {
    res.status(404).json({ error: "Partida no encontrada" })
    return
  }

  if (match.status !== "ended") {
    await query("UPDATE matches SET status = 'ended', ended_at = NOW() WHERE id = ?", [matchId])
  }

  const updated = await query<any[]>(
    `SELECT id,
            admin_id AS adminId,
            status,
            public_code AS publicCode,
            created_at AS createdAt,
            ended_at AS endedAt
     FROM matches
     WHERE id = ?`,
    [matchId]
  )
  res.json(updated[0])
})

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  const adminId = req.admin!.id
  const matchId = Number(req.params.id)

  const matches = await query<any[]>("SELECT status FROM matches WHERE id = ? AND admin_id = ? LIMIT 1", [
    matchId,
    adminId
  ])
  const match = matches[0]
  if (!match) {
    res.status(404).json({ error: "Partida no encontrada" })
    return
  }
  if (match.status !== "ended") {
    res.status(400).json({ error: "Solo se pueden borrar partidas finalizadas" })
    return
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    await connection.execute("DELETE FROM scores WHERE match_id = ?", [matchId])
    await connection.execute("DELETE FROM players WHERE match_id = ?", [matchId])
    await connection.execute("DELETE FROM teams WHERE match_id = ?", [matchId])
    await connection.execute("DELETE FROM match_games WHERE match_id = ?", [matchId])
    await connection.execute("DELETE FROM matches WHERE id = ?", [matchId])
    await connection.commit()
    res.json({ status: "ok" })
  } catch {
    await connection.rollback()
    res.status(500).json({ error: "No se pudo borrar la partida" })
  } finally {
    connection.release()
  }
})

router.post("/:id/players", requireAuth, async (req: AuthRequest, res) => {
  const adminId = req.admin!.id
  const matchId = Number(req.params.id)
  const parsed = playerSchema.safeParse(req.body || {})
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" })
    return
  }

  const matches = await query<any[]>("SELECT id FROM matches WHERE id = ? AND admin_id = ? LIMIT 1", [
    matchId,
    adminId
  ])
  if (!matches[0]) {
    res.status(404).json({ error: "Partida no encontrada" })
    return
  }

  const { name, teamId } = parsed.data
  if (teamId) {
    const teams = await query<any[]>("SELECT id FROM teams WHERE id = ? AND match_id = ? LIMIT 1", [teamId, matchId])
    if (!teams[0]) {
      res.status(404).json({ error: "Equipo no encontrado" })
      return
    }
  }

  try {
    const avatarPath = await pickAvatar(matchId)
    const [result] = await pool.execute(
      "INSERT INTO players (match_id, name, team_id, avatar_path) VALUES (?, ?, ?, ?)",
      [matchId, name, teamId ?? null, avatarPath]
    )
    const id = (result as any).insertId as number
    const created = await query<any[]>(
      "SELECT id, match_id AS matchId, name, team_id AS teamId, avatar_path AS avatarPath FROM players WHERE id = ?",
      [id]
    )
    res.status(201).json(created[0])
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      res.status(409).json({ error: "Jugador ya existe en esta partida" })
      return
    }
    res.status(500).json({ error: "No se pudo crear el jugador" })
  }
})

router.delete("/:id/players/:playerId", requireAuth, async (req: AuthRequest, res) => {
  const adminId = req.admin!.id
  const matchId = Number(req.params.id)
  const playerId = Number(req.params.playerId)

  const matches = await query<any[]>("SELECT id FROM matches WHERE id = ? AND admin_id = ? LIMIT 1", [
    matchId,
    adminId
  ])
  if (!matches[0]) {
    res.status(404).json({ error: "Partida no encontrada" })
    return
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    await connection.execute("DELETE FROM scores WHERE match_id = ? AND player_id = ?", [matchId, playerId])
    await connection.execute("DELETE FROM players WHERE id = ? AND match_id = ?", [playerId, matchId])
    await connection.commit()
    res.json({ status: "ok" })
  } catch {
    await connection.rollback()
    res.status(500).json({ error: "No se pudo borrar el jugador" })
  } finally {
    connection.release()
  }
})

router.post("/:id/teams", requireAuth, async (req: AuthRequest, res) => {
  const adminId = req.admin!.id
  const matchId = Number(req.params.id)
  const parsed = teamSchema.safeParse(req.body || {})
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" })
    return
  }

  const matches = await query<any[]>("SELECT id FROM matches WHERE id = ? AND admin_id = ? LIMIT 1", [
    matchId,
    adminId
  ])
  if (!matches[0]) {
    res.status(404).json({ error: "Partida no encontrada" })
    return
  }

  try {
    const [result] = await pool.execute("INSERT INTO teams (match_id, name) VALUES (?, ?)", [
      matchId,
      parsed.data.name
    ])
    const id = (result as any).insertId as number
    const created = await query<any[]>("SELECT * FROM teams WHERE id = ?", [id])
    res.status(201).json(created[0])
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      res.status(409).json({ error: "Equipo ya existe en esta partida" })
      return
    }
    res.status(500).json({ error: "No se pudo crear el equipo" })
  }
})

router.delete("/:id/teams/:teamId", requireAuth, async (req: AuthRequest, res) => {
  const adminId = req.admin!.id
  const matchId = Number(req.params.id)
  const teamId = Number(req.params.teamId)

  const matches = await query<any[]>("SELECT id FROM matches WHERE id = ? AND admin_id = ? LIMIT 1", [
    matchId,
    adminId
  ])
  if (!matches[0]) {
    res.status(404).json({ error: "Partida no encontrada" })
    return
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    await connection.execute("UPDATE players SET team_id = NULL WHERE match_id = ? AND team_id = ?", [matchId, teamId])
    await connection.execute("DELETE FROM teams WHERE id = ? AND match_id = ?", [teamId, matchId])
    await connection.commit()
    res.json({ status: "ok" })
  } catch {
    await connection.rollback()
    res.status(500).json({ error: "No se pudo borrar el equipo" })
  } finally {
    connection.release()
  }
})

router.patch("/:id/players/:playerId/team", requireAuth, async (req: AuthRequest, res) => {
  const adminId = req.admin!.id
  const matchId = Number(req.params.id)
  const playerId = Number(req.params.playerId)
  const teamId = req.body?.teamId ?? null

  const matches = await query<any[]>("SELECT id FROM matches WHERE id = ? AND admin_id = ? LIMIT 1", [
    matchId,
    adminId
  ])
  if (!matches[0]) {
    res.status(404).json({ error: "Partida no encontrada" })
    return
  }

  if (teamId !== null) {
    const teams = await query<any[]>("SELECT id FROM teams WHERE id = ? AND match_id = ? LIMIT 1", [
      Number(teamId),
      matchId
    ])
    if (!teams[0]) {
      res.status(404).json({ error: "Equipo no encontrado" })
      return
    }
  }

  await query("UPDATE players SET team_id = ? WHERE id = ? AND match_id = ?", [
    teamId === null ? null : Number(teamId),
    playerId,
    matchId
  ])
  const updated = await query<any[]>("SELECT * FROM players WHERE id = ?", [playerId])
  res.json(updated[0])
})

router.patch("/:id/games", requireAuth, async (req: AuthRequest, res) => {
  const adminId = req.admin!.id
  const matchId = Number(req.params.id)
  const parsed = gameUpdateSchema.safeParse(req.body || {})
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" })
    return
  }

  const matches = await query<any[]>("SELECT id FROM matches WHERE id = ? AND admin_id = ? LIMIT 1", [
    matchId,
    adminId
  ])
  if (!matches[0]) {
    res.status(404).json({ error: "Partida no encontrada" })
    return
  }

  const updates = parsed.data.updates
  const codes = updates.map((u) => u.code)
  const placeholders = codes.map(() => "?").join(",")
  const games = await query<any[]>(`SELECT id, code FROM games WHERE code IN (${placeholders})`, codes)
  const gameMap = new Map(games.map((game) => [game.code, game.id]))

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    for (const update of updates) {
      const gameId = gameMap.get(update.code)
      if (!gameId) continue
      await connection.execute(
        `INSERT INTO match_games (match_id, game_id, is_enabled)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)`,
        [matchId, gameId, update.isEnabled ? 1 : 0]
      )
    }
    await connection.commit()
  } catch {
    await connection.rollback()
    res.status(500).json({ error: "No se pudieron actualizar los juegos" })
    return
  } finally {
    connection.release()
  }

  const matchGames = await query<any[]>(
    `SELECT match_games.id, match_games.is_enabled AS isEnabled, games.code, games.name, games.description
     FROM match_games
     INNER JOIN games ON games.id = match_games.game_id
     WHERE match_games.match_id = ?
     ORDER BY games.name ASC`,
    [matchId]
  )
  res.json(
    matchGames.map((mg) => ({
      id: mg.id,
      isEnabled: Boolean(mg.isEnabled),
      game: { code: mg.code, name: mg.name, description: mg.description }
    }))
  )
})

router.get("/:id/ranking", requireAuth, async (req: AuthRequest, res) => {
  const adminId = req.admin!.id
  const matchId = Number(req.params.id)

  const matches = await query<any[]>("SELECT id FROM matches WHERE id = ? AND admin_id = ? LIMIT 1", [
    matchId,
    adminId
  ])
  if (!matches[0]) {
    res.status(404).json({ error: "Partida no encontrada" })
    return
  }

  const ranking = await query<any[]>(
    `SELECT players.id AS playerId, players.name AS name, COALESCE(SUM(scores.points), 0) AS points
     FROM players
     LEFT JOIN scores ON scores.player_id = players.id AND scores.match_id = ?
     WHERE players.match_id = ?
     GROUP BY players.id
     ORDER BY points DESC, players.name ASC`,
    [matchId, matchId]
  )
  res.json(ranking)
})

export default router
