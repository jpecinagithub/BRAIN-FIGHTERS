# Brain Fighters

Plataforma para gestionar partidas con minijuegos cognitivos. Monorepo con `frontend` (React + Vite) y `backend` (Express + MySQL).

## Documentacion
- `docs/README.md` indice general.
- `docs/overview.md` vision y flujo.
- `docs/setup.md` requisitos y puesta en marcha.
- `docs/backend.md` API y autenticacion.
- `docs/frontend.md` rutas y estado global.
- `docs/database.md` modelo de datos.
- `docs/games.md` catalogo de juegos.

## Quick start local
1. Crear base de datos y ejecutar `backend/sql/schema.sql` y `backend/sql/seed.sql`.
2. Backend: configurar `backend/.env`, ejecutar `npm install` y `npm run dev`.
3. Frontend: configurar `frontend/.env`, ejecutar `npm install` y `npm run dev`.
4. Abrir `http://localhost:5173`.

## Scripts utiles
- Backend: `npm run dev`, `npm run build`, `npm run start`.
- Frontend: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`.

## Estructura
- `backend` API, SQL y assets estaticos.
- `frontend` SPA y minijuegos.
- `docs` documentacion funcional y tecnica.
