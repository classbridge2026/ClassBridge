# ClassBridge

**Connect. Learn. Teach.**

ClassBridge is a modern multi-institution online learning platform that connects students, lecturers, and administrators through virtual classrooms, live video classes, courses, assignments, assessments, results, attendance, recordings, and academic management tools. Osman Tholley is the Developer.

Multi-institution education platform. Transit College is the first tenant, not a hardcoded product.

## Documentation

| Document | Description |
| --- | --- |
| [docs/PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md) | Product, roles, permissions |
| [docs/PRODUCT_MAP.md](docs/PRODUCT_MAP.md) | Screens and journeys |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Target data model |
| [docs/SECURITY.md](docs/SECURITY.md) | Security and isolation |
| [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md) | Phased delivery |

The Next.js application lives in [`frontend/`](frontend/).

## Quick start

```bash
cd frontend
cp .env.example .env
# set DATABASE_URL in .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

On Windows PowerShell:

```powershell
cd frontend
Copy-Item .env.example .env
# set DATABASE_URL in .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Development seed password: `ClassBridge!dev1`. Accounts are listed in `frontend/README.md`.

## Verify

```bash
cd frontend
npm run lint
npm run build
```
