# Backend

El backend es un servicio Express con MySQL y JWT. Expone endpoints privados para administracion y endpoints publicos para el modo de juego.

## Base URL
Por defecto: `http://localhost:3001`.

## Autenticacion
- Access token en header `Authorization: Bearer <token>`.
- Refresh token en cookie `refresh_token` httpOnly.
- El frontend renueva tokens llamando a `/api/auth/refresh`.

## CORS y cookies
- Los origenes permitidos se toman de `CORS_ORIGINS`.
- `COOKIE_SECURE=true` habilita `SameSite=None` y cookie secure.

## Endpoints

Tabla resumen:

| Metodo | Ruta | Auth | Descripcion |
| --- | --- | --- | --- |
| GET | `/health` | No | Estado del servidor. |
| POST | `/api/auth/register` | No | Registrar admin y crear sesion. |
| POST | `/api/auth/login` | No | Login admin y crear sesion. |
| POST | `/api/auth/refresh` | No | Renovar access token con refresh cookie. |
| POST | `/api/auth/logout` | No | Cerrar sesion. |
| GET | `/api/matches` | Si | Listar partidas del admin. |
| POST | `/api/matches` | Si | Crear partida (max 3 activas). |
| GET | `/api/matches/:id` | Si | Obtener detalle de partida. |
| PATCH | `/api/matches/:id/finish` | Si | Finalizar partida. |
| DELETE | `/api/matches/:id` | Si | Borrar partida finalizada. |
| POST | `/api/matches/:id/players` | Si | Crear jugador. |
| DELETE | `/api/matches/:id/players/:playerId` | Si | Borrar jugador. |
| POST | `/api/matches/:id/teams` | Si | Crear equipo. |
| DELETE | `/api/matches/:id/teams/:teamId` | Si | Borrar equipo. |
| PATCH | `/api/matches/:id/players/:playerId/team` | Si | Asignar equipo a jugador. |
| PATCH | `/api/matches/:id/games` | Si | Habilitar o deshabilitar juegos. |
| GET | `/api/matches/:id/ranking` | Si | Ranking del admin para la partida. |
| GET | `/api/play/:publicCode` | No | Datos publicos de la partida activa. |
| POST | `/api/play/:publicCode/score` | No | Enviar puntuacion. |
| GET | `/api/play/:publicCode/ranking` | No | Ranking publico. |

## Cuerpos de solicitud

Crear jugador:
```json
{ "name": "Ana", "teamId": 12 }
```

Crear equipo:
```json
{ "name": "Equipo Azul" }
```

Actualizar juegos:
```json
{ "updates": [{ "code": "memory", "isEnabled": true }] }
```

Enviar puntuacion:
```json
{ "playerId": 33, "gameCode": "memory", "points": 120 }
```

Enviar puntuacion por nombre:
```json
{ "playerName": "Ana", "gameCode": "memory", "points": 120 }
```

## Respuestas frecuentes
- Los endpoints de admin responden 401 si falta o es invalido el access token.
- Crear partida devuelve 409 si ya hay 3 partidas activas.
- Crear jugador o equipo devuelve 409 si el nombre ya existe en la partida.

## Activos estaticos
- `GET /avatars/<archivo>` para avatares.
- `GET /games/<archivo>` para iconos de juegos.
