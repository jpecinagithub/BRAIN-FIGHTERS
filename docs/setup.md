# Configuracion local

## Requisitos
- Node.js 18+.
- MySQL 8+.

## Base de datos
1. Crear la base de datos.
2. Ejecutar `backend/sql/schema.sql`.
3. Ejecutar `backend/sql/seed.sql` para cargar los juegos iniciales.

Ejemplo rapido con MySQL:
```bash
mysql -u root -p -e "CREATE DATABASE brain_fighters"
mysql -u root -p brain_fighters < backend/sql/schema.sql
mysql -u root -p brain_fighters < backend/sql/seed.sql
```

## Backend
1. Crear el archivo `backend/.env` (ver tabla de variables abajo).
2. Instalar dependencias con `npm install`.
3. Levantar el servidor con `npm run dev`.

Variables de entorno (`backend/.env`):

| Variable | Descripcion | Ejemplo |
| --- | --- | --- |
| `PORT` | Puerto HTTP | `3001` |
| `HOST` | Host de escucha | `0.0.0.0` |
| `DATABASE_URL` | URL MySQL | `mysql://user:pass@localhost:3306/brain_fighters` |
| `JWT_ACCESS_SECRET` | Secreto para access token | `change-me-access` |
| `JWT_REFRESH_SECRET` | Secreto para refresh token | `change-me-refresh` |
| `ACCESS_TOKEN_TTL` | TTL access token | `15m` |
| `REFRESH_TOKEN_TTL_DAYS` | Dias de validez refresh | `7` |
| `COOKIE_SECURE` | Cookie secure en prod | `false` |
| `CORS_ORIGINS` | Origenes permitidos (csv) | `http://localhost:5173` |

## Frontend
1. Crear `frontend/.env` a partir de `frontend/.env.example`.
2. Instalar dependencias con `npm install`.
3. Ejecutar `npm run dev`.

Variables de entorno (`frontend/.env`):

| Variable | Descripcion | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | URL del backend | `http://localhost:3001` |

## URLs de desarrollo
- Frontend: `http://localhost:5173`.
- Backend: `http://localhost:3001`.
- Healthcheck: `http://localhost:3001/health`.
