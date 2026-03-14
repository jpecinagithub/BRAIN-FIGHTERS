import fs from "fs"
import path from "path"
import { query } from "../db"

const AVATAR_DIR = path.resolve(__dirname, "..", "..", "public", "avatars")
const AVATAR_FILES = fs.existsSync(AVATAR_DIR)
  ? fs
      .readdirSync(AVATAR_DIR)
      .filter((fileName) => /^avatar\\d+\\.png$/i.test(fileName))
      .sort((a, b) => {
        const aNum = Number((a.match(/\\d+/) || [0])[0])
        const bNum = Number((b.match(/\\d+/) || [0])[0])
        return aNum - bNum
      })
  : []

export async function assignMissingAvatars(matchId: number) {
  if (!AVATAR_FILES.length) {
    return
  }

  const players = await query<any[]>(
    "SELECT id, avatar_path AS avatarPath FROM players WHERE match_id = ? ORDER BY id ASC",
    [matchId]
  )

  const used = new Set(players.map((player) => player.avatarPath).filter(Boolean))
  const available = AVATAR_FILES.filter((fileName) => !used.has(fileName))

  let fallbackIndex = 0
  for (const player of players) {
    if (player.avatarPath) continue
    let avatarFile: string | undefined
    if (available.length > 0) {
      avatarFile = available.shift()
    } else {
      avatarFile = AVATAR_FILES[fallbackIndex % AVATAR_FILES.length]
      fallbackIndex += 1
    }
    if (!avatarFile) continue
    await query("UPDATE players SET avatar_path = ? WHERE id = ?", [avatarFile, player.id])
  }
}

export function hasAvatarFiles() {
  return AVATAR_FILES.length > 0
}

export function listAvatarFiles() {
  return [...AVATAR_FILES]
}
