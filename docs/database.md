# Base de datos

El esquema esta en `backend/sql/schema.sql` y usa MySQL 8+.

## Entidades principales
- `admins`: administradores del sistema.
- `sessions`: refresh tokens activos por admin.
- `matches`: partidas creadas por admins.
- `games`: catalogo de minijuegos.
- `match_games`: relacion partidas <-> juegos con habilitado.
- `teams`: equipos por partida.
- `players`: jugadores por partida (opcionalmente en equipo).
- `scores`: puntos por jugador y juego.

## Relaciones
```mermaid
erDiagram
  ADMINS ||--o{ SESSIONS : has
  ADMINS ||--o{ MATCHES : creates
  MATCHES ||--o{ TEAMS : has
  MATCHES ||--o{ PLAYERS : has
  MATCHES ||--o{ MATCH_GAMES : configures
  MATCHES ||--o{ SCORES : aggregates
  GAMES ||--o{ MATCH_GAMES : configured
  GAMES ||--o{ SCORES : scores
  TEAMS ||--o{ PLAYERS : groups
```

## Notas de integridad
- `players.team_id` usa `ON DELETE SET NULL`.
- `matches` y `scores` usan `ON DELETE CASCADE`.
- Los nombres de equipos y jugadores son unicos por partida.
