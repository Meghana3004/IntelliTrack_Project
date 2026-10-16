# IntelliTrack ("Dock2Dark")
 
Delivery Exception Tracker — Next.js 14 App Router + TypeScript, Prisma/SQLite, NextAuth.
 
## Prerequisites
 
- **Node.js 20+ LTS** and **npm** (ships with Node). Verify with `node -v` / `npm -v`.
- No database server, Docker, or paid API keys required — the app ships with a
  pre-seeded SQLite file (`prisma/local.db`) included.
- Internet access is only needed once, for `npm install` (and, optionally, if you add a Gemini API key — the app runs fine without one using fallback).
 
## Setup
 
```bash
npm install
npm run dev
```
 
Open [http://localhost:3000](http://localhost:3000).
 
`npm install` also runs `prisma generate` automatically (`postinstall`), and
`npm run dev` runs `prisma migrate deploy || prisma db push` first (`predev`) to
sync the schema against `prisma/local.db`. No manual Prisma commands are needed.
 
### Demo logins (password: `demo1234`)
 
| Role | Email |
|---|---|
| Driver | `driver1@demo.com` |
| Warehouse Manager | `warehouse1@demo.com` |
| Regional Manager | `regional1@demo.com` |
| Customer Service | `customerservice1@demo.com` |
| Leadership | `leadership1@demo.com` |
| Customer | `customer1@demo.com` |
 
### Resetting/reseeding the database (optional)
 
Only needed if `prisma/local.db` gets corrupted or you want fresh demo data:
 
```bash
npm run db:seed
```
 
## Environment variables
 
.env file already exists with non-secret deafult, only database URL
 
- `DATABASE_URL` — SQLite file path. Default (`file:./local.db`) works as-is.

Using .env.example, create a .env.local having the following

- `NEXTAUTH_SECRET` — any random string, used to sign session JWTs.
- `GEMINI_API_KEY` — **optional**. Leave unset to use the built-in rule-based AI fallback; set it to use live Gemini calls instead.
- `NEXTAUTH_URL`=http://localhost:3000
