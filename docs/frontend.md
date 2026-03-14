# Frontend

El frontend es una SPA con React + Vite. Tiene dos areas: administracion privada y vista publica de juego.

## Rutas principales

| Ruta | Vista | Descripcion |
| --- | --- | --- |
| `/login` | LoginPage | Acceso de administradores. |
| `/register` | RegisterPage | Alta de administradores. |
| `/admin` | AdminDashboard | Listado y gestion de partidas. |
| `/admin/matches/:id` | MatchConfigPage | Configurar equipos, jugadores y juegos. |
| `/play/:publicCode` | PlayLobby | Lobby publico, seleccion de jugador y juego. |
| `/play/:publicCode/game/:gameId/:player` | GamePage | Render de minijuego. |

## Estado global
- `AuthContext` guarda admin y access token en `localStorage`.
- `GameContext` guarda jugador actual y envios de puntuacion.

## Consumo de API
- `apiFetch` agrega el access token si existe.
- Si hay 401, intenta renovar token con `/api/auth/refresh`.
- El refresh token se mantiene en cookie httpOnly.

## Juegos
- Los componentes viven en `frontend/src/games`.
- El mapeo codigo -> componente esta en `frontend/src/pages/GamePage.tsx`.
- Los juegos habilitados se controlan desde el backend con `match_games`.

## Configuracion
- `VITE_API_URL` define el backend.
- Estilos principales en `frontend/src/App.css` e `frontend/src/index.css`.
