# Mini Calls & Texts

Simple backend for a calls-and-texts-only mini app using Twilio numbers.

See [plan.md](./plan.md) for the full backend plan.

## Setup

1. Copy `.env.example` to `.env` and fill in values.
2. `npm install`
3. `npx prisma generate`
4. `npx prisma migrate dev` (requires DATABASE_URL)
5. `npm start`

## Deploy

Deploy to Railway. Set environment variables from `.env.example`.
