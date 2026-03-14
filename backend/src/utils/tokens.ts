import crypto from "crypto"
import jwt from "jsonwebtoken"
import { config } from "../config"

export interface AccessTokenPayload {
  sub: number
  email: string
}

export interface RefreshTokenPayload {
  sub: number
  tid: string
}

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, config.jwtAccessSecret as jwt.Secret, { expiresIn: config.accessTokenTtl })
}

export function signRefreshToken(adminId: number) {
  const tokenId = crypto.randomBytes(16).toString("hex")
  const expiresAt = new Date(Date.now() + config.refreshTokenTtlDays * 24 * 60 * 60 * 1000)
  const token = jwt.sign({ sub: adminId, tid: tokenId }, config.jwtRefreshSecret as jwt.Secret, {
    expiresIn: `${config.refreshTokenTtlDays}d`
  })

  return { token, tokenId, expiresAt }
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}
