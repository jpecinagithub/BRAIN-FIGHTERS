import mysql from "mysql2/promise"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required")
}

export const pool = mysql.createPool({
  uri: databaseUrl,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "Z"
})

export async function query<T = any>(sql: string, params: any[] = []) {
  const [rows] = await pool.execute(sql, params)
  return rows as T
}
