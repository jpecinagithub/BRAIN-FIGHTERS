# Plan de Especificaciones — Brain Fighters (base: Brain Soldiers)

Fecha: 2026-03-14

## 1) Análisis rápido de Brain Soldiers (referencia)
- Stack actual: Vite + React en frontend, Node.js + Express en backend, base de datos SQLite.
- Estructura frontend: `src/pages`, `src/games` (minijuegos), `src/data/games.js` (catálogo), `src/contexts`, `src/components`.
- Estructura backend: `backend/server.js` concentra API + DB; no hay autenticación.
- Funcionalidad actual: gestión básica de jugadores y equipos, modo de juego (individual/equipos), ranking, activación/desactivación de juegos.
- Catálogo de 12 juegos (IDs y nombres):
- `simon` — Misión Simon
- `puzzle` — Misión Puzzle
- `memory` — Misión Memoria
- `math` — Misión Cálculo
- `stroop` — Stroop Express
- `sequence` — Secuencia Lógica
- `path` — Camino Fantasma
- `search` — Búsqueda Visual
- `rotation` — Rotación Rápida
- `compare` — Comparación Relámpago
- `rule` — Parejas con Regla
- `echo` — Eco Numérico

## 2) Objetivo del nuevo proyecto
- Crear un sistema basado en Brain Soldiers, con modificaciones estructurales.
- Mantener los mismos 12 juegos.
- Nuevo stack backend con MySQL y autenticación robusta.
- Los usuarios serán administradores de partidas.

## 3) Alcance funcional (MVP)
- Autenticación:
- Registro de administrador.
- Login de administrador.
- Sin recuperación de contraseña.
- Administración de partidas:
- Crear partida con configuración de jugadores, equipos y juegos.
- Generar URL única por partida.
- Límite: máximo 3 partidas simultáneas activas por administrador.
- Finalizar partida y eliminarla para liberar cupo.
- Gestión de configuración:
- Administrador define jugadores.
- Administrador define equipos.
- Administrador selecciona juegos (subconjunto de los 12).

## 4) Reglas de negocio clave
- Un administrador solo puede tener 3 partidas activas simultáneas.
- Una partida tiene estado `active` o `ended`.
- Solo se pueden borrar partidas `ended`.
- Cada partida tiene URL única no predecible (token o slug seguro).
- No existe flujo de recuperación de contraseña.
- Catálogo fijo de 12 juegos (se puede activar/desactivar por partida).

## 5) Modelo de datos propuesto (MySQL)
- `admins`
- `id` (PK)
- `email` (UNIQUE)
- `password_hash`
- `created_at`
- `last_login_at`
- `sessions` (si se usa refresh tokens en DB)
- `id` (PK)
- `admin_id` (FK)
- `refresh_token_hash`
- `expires_at`
- `created_at`
- `matches`
- `id` (PK)
- `admin_id` (FK)
- `status` (`active` | `ended`)
- `public_code` (UNIQUE, token seguro)
- `created_at`
- `ended_at`
- `games`
- `id` (PK)
- `code` (UNIQUE, ej. `simon`)
- `name`
- `description`
- `icon_path`
- `match_games`
- `id` (PK)
- `match_id` (FK)
- `game_id` (FK)
- `is_enabled`
- `players`
- `id` (PK)
- `match_id` (FK)
- `name`
- `team_id` (FK, nullable)
- `avatar_path` (opcional)
- `teams`
- `id` (PK)
- `match_id` (FK)
- `name`
- `scores`
- `id` (PK)
- `match_id` (FK)
- `player_id` (FK)
- `game_id` (FK)
- `points`
- `created_at`

## 6) API (borrador)
- Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- Matches:
- `GET /api/matches`
- `POST /api/matches` (crea y valida límite 3 activas)
- `GET /api/matches/:id`
- `PATCH /api/matches/:id/finish`
- `DELETE /api/matches/:id`
- Configuración por partida:
- `POST /api/matches/:id/players`
- `DELETE /api/matches/:id/players/:playerId`
- `POST /api/matches/:id/teams`
- `DELETE /api/matches/:id/teams/:teamId`
- `PATCH /api/matches/:id/players/:playerId/team`
- `PATCH /api/matches/:id/games` (habilita/deshabilita juegos)
- Juego público:
- `GET /api/play/:public_code` (config pública para UI)
- `POST /api/play/:public_code/score`

## 7) Frontend (borrador de rutas)
- `/login`
- `/register`
- `/admin` (dashboard)
- `/admin/matches/:id` (configuración)
- `/play/:public_code` (selección jugador/juego)
- `/play/:public_code/game/:gameId` (minijuego)

## 8) Seguridad y autenticación (decisión propuesta)
- Contraseñas con hash fuerte (bcrypt/argon2).
- JWT de acceso corto + refresh token en cookie httpOnly.
- Middleware de autorización en rutas de admin.
- Rate limiting en login/registro.

## 9) Reutilización de Brain Soldiers
- Reusar los 12 minijuegos y sus assets.
- Reusar catálogo base `games` con los mismos IDs.
- Adaptar el sistema de puntuación a partidas (scores por match).

## 10) Pendientes a definir (para siguiente iteración)
- Formato exacto de la URL pública (slug o token).
- Reglas de puntuación por juego y agregación.
- UX de creación rápida de jugadores y equipos.
- Necesidad de ranking por partida y por admin.

## 11) Hitos sugeridos
- H1: Base de datos MySQL + modelos + seed de juegos.
- H2: Auth completa (registro/login/logout).
- H3: CRUD de partidas con límite 3 activas.
- H4: Gestión de jugadores/equipos por partida.
- H5: Integración de juegos con URL pública y scores.
