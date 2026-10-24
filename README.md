# Mi Corsa — gestión de mantenimiento y gasolina

Monorepo pnpm: `apps/web` (Vite + React + Tailwind, neumorfismo, PWA), `apps/api` (Fastify + PostgreSQL), `packages/shared` (esquemas Zod, cálculos y catálogo).

## Desarrollo
```
pnpm install
pnpm test && pnpm typecheck
DATABASE_URL=... SESSION_SECRET=<32+ chars> INITIAL_PASSWORD=... pnpm dev:api
pnpm dev:web   # VITE_API_URL=http://localhost:4000
```

## Despliegue (VPS)
`docker compose up -d --build` con `.env` (ver `.env.example`). nginx del host hace proxy:
`carro.enmarcm.site -> 127.0.0.1:4611`, `apicarro.enmarcm.site -> 127.0.0.1:4610`.

## Seguridad
Clave única (argon2id), cookie httpOnly/Secure/SameSite=Strict, header anti-CSRF, CORS a un origen, rate limit, validación Zod, helmet, contenedores sin root, DB sin puerto público. Públicas: `/health`, `/ready`, `/auth/login`.
