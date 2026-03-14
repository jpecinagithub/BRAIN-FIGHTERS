import { API_URL } from "./client"
import { submitScore as submitScorePublic } from "./public"

export function getAvatarUrl(playerName: string, avatarFile?: string | null) {
  if (avatarFile) {
    return `${API_URL}/avatars/${avatarFile}`
  }
  const slug = playerName.toLowerCase().replace(/\s+/g, "-")
  return `${API_URL}/avatars/${slug}.png`
}

export async function generateAvatar(playerName: string) {
  return {
    success: false,
    imageUrl: getAvatarUrl(playerName)
  }
}

function getPublicCodeFromPath() {
  const match = window.location.pathname.match(/\/play\/([^/]+)/)
  return match?.[1] || null
}

export async function submitScore(playerId: string | number, points: number, gameCode: string) {
  const publicCode = getPublicCodeFromPath()
  if (!publicCode) {
    throw new Error("No se encontró el código de partida")
  }
  return submitScorePublic(publicCode, playerId, gameCode, points)
}

export { API_URL }
