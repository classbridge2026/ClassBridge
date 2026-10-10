# ClassBridge application

Full-stack Next.js app for ClassBridge (frontend + server). Architecture lives in `/docs`.

## Current phase

Phase 2 — database foundation (core models + development seed). Authentication is not wired yet.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL connection string.
2. Install, migrate, and seed:

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Health check: [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health).

### Development seed accounts

All use password `ClassBridge!dev1`. These exist only as seed data, not in application logic.

| Role | Email |
| --- | --- |
| Super Admin | `superadmin@classbridge.local` |
| Transit College admin | `admin@transit.local` |
| Transit College lecturer | `lecturer@transit.local` |
| Transit College student | `student@transit.local` |
| Riverside Institute admin | `admin@riverside.local` |
| Riverside Institute student | `student@riverside.local` |

Riverside Institute exists so tenant isolation can be tested later.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Create/apply Prisma migrations |
| `npm run db:seed` | Load development seed data |
| `npm run db:studio` | Open Prisma Studio |

## Structure

See `docs/ARCHITECTURE.md`. Application code is under `src/`. Prisma schema is under `prisma/`.
