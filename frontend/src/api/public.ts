import { apiFetch } from "./client"

export interface PublicMatch {
  id: number
  publicCode: string
  status: "active" | "ended"
  players: { id: number; name: string; teamId: number | null; avatarPath?: string | null }[]
  teams: { id: number; name: string }[]
  games: { code: string; name: string; description: string; iconPath: string; isEnabled: boolean }[]
}

export interface PublicRanking {
  players: { playerId: number; name: string; teamName: string | null; points: number }[]
  teams: { teamId: number | null; name: string; points: number }[]
}

export async function getPublicMatch(publicCode: string) {
  return apiFetch<PublicMatch>(`/api/play/${publicCode}`, { method: "GET" }, false)
}

export async function submitScore(
  publicCode: string,
  player: number | string,
  gameCode: string,
  points: number
) {
  const body: Record<string, unknown> = { gameCode, points }
  if (typeof player === "number") {
    body.playerId = player
  } else {
    body.playerName = player
  }

  return apiFetch(
    `/api/play/${publicCode}/score`,
    {
      method: "POST",
      body: JSON.stringify(body)
    },
    false
  )
}

export async function getPublicRanking(publicCode: string) {
  return apiFetch<PublicRanking>(`/api/play/${publicCode}/ranking`, { method: "GET" }, false)
}
