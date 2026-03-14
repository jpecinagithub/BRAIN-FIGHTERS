import { Response, Router } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { z } from "zod"
import { pool, query } from "../db"
import { config } from "../config"
import { hashToken, signAccessToken, signRefreshToken } from "../utils/tokens"

const router = Router()

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

function setRefreshCookie(res: Response, token: string) {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSecure ? "none" : "lax",
    maxAge: config.refreshTokenTtlDays * 24 * 60 * 60 * 1000
  })
}

router.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" })
    return
  }

  const { email, password } = parsed.data
  const passwordHash = await bcrypt.hash(password, 10)

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [result] = await connection.execute(
      "INSERT INTO admins (email, password_hash) VALUES (?, ?)",
      [email, passwordHash]
    )
    const insertId = (result as any).insertId as number

    const accessToken = signAccessToken({ sub: insertId, email })
    const refresh = signRefreshToken(insertId)
    await connection.execute(
      "INSERT INTO sessions (admin_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [insertId, hashToken(refresh.token), refresh.expiresAt]
    )
    await connection.commit()

    setRefreshCookie(res, refresh.token)
    res.status(201).json({ accessToken, admin: { id: insertId, email } })
  } catch (err: any) {
    await connection.rollback()
    if (err?.code === "ER_DUP_ENTRY") {
      res.status(409).json({ error: "El email ya está registrado" })
      return
    }
    res.status(500).json({ error: "No se pudo crear el usuario" })
  } finally {
    connection.release()
  }
})

router.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" })
    return
  }

  const { email, password } = parsed.data
  const rows = await query<any[]>("SELECT id, email, password_hash FROM admins WHERE email = ? LIMIT 1", [email])
  const admin = rows[0]
  if (!admin) {
    res.status(401).json({ error: "Credenciales inválidas" })
    return
  }

  const ok = await bcrypt.compare(password, admin.password_hash)
  if (!ok) {
    res.status(401).json({ error: "Credenciales inválidas" })
    return
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const accessToken = signAccessToken({ sub: admin.id, email: admin.email })
    const refresh = signRefreshToken(admin.id)
    await connection.execute(
      "INSERT INTO sessions (admin_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [admin.id, hashToken(refresh.token), refresh.expiresAt]
    )
    await connection.execute("UPDATE admins SET last_login_at = NOW() WHERE id = ?", [admin.id])
    await connection.commit()

    setRefreshCookie(res, refresh.token)
    res.json({ accessToken, admin: { id: admin.id, email: admin.email } })
  } catch {
    await connection.rollback()
    res.status(500).json({ error: "No se pudo iniciar sesión" })
  } finally {
    connection.release()
  }
})

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refresh_token
  if (!token) {
    res.status(401).json({ error: "Refresh token faltante" })
    return
  }

  try {
    const payload = jwt.verify(token, config.jwtRefreshSecret) as jwt.JwtPayload & {
      sub?: string | number
      tid?: string
    }
    if (!payload || typeof payload !== "object" || !payload.sub || !payload.tid) {
      res.status(401).json({ error: "Refresh token inválido" })
      return
    }
    const tokenHash = hashToken(token)

    const sessions = await query<any[]>(
      "SELECT id, expires_at FROM sessions WHERE admin_id = ? AND token_hash = ? LIMIT 1",
      [Number(payload.sub), tokenHash]
    )
    const session = sessions[0]
    if (!session || new Date(session.expires_at) < new Date()) {
      res.status(401).json({ error: "Refresh token inválido" })
      return
    }

    const adminRows = await query<any[]>("SELECT email FROM admins WHERE id = ? LIMIT 1", [payload.sub])
    const admin = adminRows[0]
    if (!admin) {
      res.status(401).json({ error: "Refresh token inválido" })
      return
    }

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      await connection.execute("DELETE FROM sessions WHERE id = ?", [session.id])
      const refresh = signRefreshToken(payload.sub)
      await connection.execute(
        "INSERT INTO sessions (admin_id, token_hash, expires_at) VALUES (?, ?, ?)",
        [payload.sub, hashToken(refresh.token), refresh.expiresAt]
      )
      await connection.commit()

      const accessToken = signAccessToken({ sub: payload.sub, email: admin.email })
      setRefreshCookie(res, refresh.token)
      res.json({ accessToken })
    } catch {
      await connection.rollback()
      res.status(401).json({ error: "Refresh token inválido" })
    } finally {
      connection.release()
    }
  } catch {
    res.status(401).json({ error: "Refresh token inválido" })
  }
})

router.post("/logout", async (req, res) => {
  const token = req.cookies?.refresh_token
  if (token) {
    const tokenHash = hashToken(token)
    await query("DELETE FROM sessions WHERE token_hash = ?", [tokenHash])
  }

  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSecure ? "none" : "lax"
  })
  res.json({ status: "ok" })
})

export default router
