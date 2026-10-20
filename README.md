# Skipper's Dream

Base de una aplicación para navegantes de PER, Patrón de Yate y otras titulaciones.

## Arranque local

En dos terminales:

```bash
npm run dev:backend
npm run dev:frontend
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health check: http://localhost:3001/api/health

La base de datos es PostgreSQL. Puedes levantarla con:

```bash
docker compose up -d postgres
```

La primera ejecución crea las tablas con TypeORM y carga unas próximas salidas de ejemplo.

## Estructura

- `frontend`: React + Vite + TypeScript.
- `backend`: Express + TypeScript + TypeORM + PostgreSQL.

La siguiente fase puede añadir barcos, propiedad/copropiedad y vincularlos a las salidas.
