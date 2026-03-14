import { apiFetch } from "./client"

export interface Match {
  id: number
  adminId: number
  status: "active" | "ended"
  publicCode: string
  createdAt: string
  endedAt: string | null
}

export async function getMatches() {
  return apiFetch<Match[]>("/api/matches")
}

export async function createMatch() {
  return apiFetch<Match>("/api/matches", { method: "POST" })
}

export async function getMatch(id: number) {
  return apiFetch(`/api/matches/${id}`)
}

export async function finishMatch(id: number) {
  return apiFetch(`/api/matches/${id}/finish`, { method: "PATCH" })
}

export async function deleteMatch(id: number) {
  return apiFetch(`/api/matches/${id}`, { method: "DELETE" })
}

export async function createPlayer(matchId: number, name: string, teamId?: number | null) {
  return apiFetch(`/api/matches/${matchId}/players`, {
    method: "POST",
    body: JSON.stringify({ name, teamId })
  })
}

export async function deletePlayer(matchId: number, playerId: number) {
  return apiFetch(`/api/matches/${matchId}/players/${playerId}`, { method: "DELETE" })
}

export async function createTeam(matchId: number, name: string) {
  return apiFetch(`/api/matches/${matchId}/teams`, {
    method: "POST",
    body: JSON.stringify({ name })
  })
}

export async function deleteTeam(matchId: number, teamId: number) {
  return apiFetch(`/api/matches/${matchId}/teams/${teamId}`, { method: "DELETE" })
}

export async function assignPlayerTeam(matchId: number, playerId: number, teamId: number | null) {
  return apiFetch(`/api/matches/${matchId}/players/${playerId}/team`, {
    method: "PATCH",
    body: JSON.stringify({ teamId })
  })
}

export async function updateMatchGames(matchId: number, updates: { code: string; isEnabled: boolean }[]) {
  return apiFetch(`/api/matches/${matchId}/games`, {
    method: "PATCH",
    body: JSON.stringify({ updates })
  })
}

export async function getRanking(matchId: number) {
  return apiFetch(`/api/matches/${matchId}/ranking`)
}
