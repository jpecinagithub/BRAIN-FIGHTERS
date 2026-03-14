import "dotenv/config"
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import path from "path"
import { config } from "./config"
import authRoutes from "./routes/auth"
import matchRoutes from "./routes/matches"
import publicRoutes from "./routes/public"

const app = express()
const baseDir = path.resolve(__dirname, "..")
const publicDir = path.join(baseDir, "public")

const allowedOrigins =
  config.corsOrigins.length > 0 ? config.corsOrigins : ["http://localhost:5173", "http://127.0.0.1:5173"]

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true)
        return
      }
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(null, false)
    },
    credentials: true
  })
)

app.use(express.json())
app.use(cookieParser())
app.use("/games", express.static(path.join(publicDir, "games")))
app.use("/avatars", express.static(path.join(publicDir, "avatars")))

app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

app.use("/api/auth", authRoutes)
app.use("/api/matches", matchRoutes)
app.use("/api", publicRoutes)

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" })
})

app.listen(config.port, config.host, () => {
  console.log(`API running on http://${config.host}:${config.port}`)
})
