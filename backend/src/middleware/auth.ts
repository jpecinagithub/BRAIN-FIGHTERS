import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { config } from "../config"

export interface AuthRequest extends Request {
  admin?: {
    id: number
    email: string
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ error: "Missing access token" })
    return
  }

  try {
    const payload = jwt.verify(token, config.jwtAccessSecret) as jwt.JwtPayload & {
      sub?: string | number
      email?: string
    }
    if (!payload || typeof payload !== "object" || !payload.sub || !payload.email) {
      res.status(401).json({ error: "Invalid or expired access token" })
      return
    }
    req.admin = { id: Number(payload.sub), email: payload.email }
    next()
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" })
  }
}
