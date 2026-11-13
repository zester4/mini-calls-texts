# AGENTS.md — Mini Calls & Texts

## Purpose

This file guides AI agents (or humans) working on the **mini-calls-texts** backend.

Version 1 is a simple calls-and-texts-only service using Twilio numbers, deployed on Railway.

## Goal

Build a simple backend that lets the app:

- Start outbound calls using a Twilio number
- Receive inbound calls through Twilio webhooks
- Send outbound SMS using a Twilio number
- Receive inbound SMS through Twilio webhooks
- Store basic call and message history
- Provide a simple API for the frontend

**Intentionally excluded in v1:** contacts sync, call recording, voicemail, group messaging, AI replies, multiple-user teams.

## Recommended stack

- Runtime: Node.js 20+
- Express 4.x (async route handlers must forward/catch rejected promises; Express 5 behavior differs)
- Framework: Express
- Database: PostgreSQL on Railway
- ORM: Prisma
- Twilio SDK: `twilio`
- Validation: Zod
- Auth: Simple API key (`x-api-key` header)
- Deployment: Railway web service

Railway automatically provides the `PORT` environment variable. `railway.json` is retained for legacy existing services only; new Railway services must use dashboard settings or `.railway/railway.ts` Infrastructure as Code.

## Project structure

```text
mini-calls-texts/
├── .github/workflows/ci.yml
├── .env.example
├── AGENTS.md
├── README.md
├── Todo.md
├── checklist.md
├── package.json
├── plan.md
├── railway.json                 # legacy Config as Code; not for new services
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/env.js
│   ├── controllers/
│   ├── lib/                     # Prisma, Twilio, phone, webhook
│   ├── middleware/              # API key, rate limits, validation, errors
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── validators/
└── tests/
    ├── api.test.js
    ├── call-service.test.js
    ├── calls.test.js
    ├── env.test.js
    ├── message-service.test.js
    ├── messages.test.js
    ├── phone.test.js
    └── webhook.test.js
```

## Environment variables

Set these in Railway (and locally via `.env`):

```env
DATABASE_URL=postgresql://...
PORT=3000

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567

APP_API_KEY=choose-a-long-random-key

PUBLIC_BASE_URL=https://your-railway-app.up.railway.app
FORWARD_CALL_TO=+15559876543
```

Railway provides `PORT` automatically.

## Twilio webhook URLs (after deploy)

```text
Voice webhook:
https://your-service.up.railway.app/api/twilio/voice

Call status webhook:
https://your-service.up.railway.app/api/twilio/call-status

SMS webhook:
https://your-service.up.railway.app/api/twilio/sms

Message status webhook:
https://your-service.up.railway.app/api/twilio/message-status
```

All webhooks must use HTTPS and validate the `X-Twilio-Signature` header.

## Build order

1. Initialize the Node.js project.
2. Install Express, Prisma, Twilio, Zod, and dotenv.
3. Create the PostgreSQL database on Railway.
4. Set environment variables in Railway.
5. Create the Prisma schema.
6. Run the first database migration.
7. Build the health endpoint.
8. Build the outbound SMS endpoint.
9. Build the inbound SMS webhook.
10. Build the outbound call endpoint.
11. Build the inbound voice webhook.
12. Build the call-status webhook.
13. Build the message-status webhook.
14. Add API-key middleware.
15. Add Twilio signature validation.
16. Add logging and error handling.
17. Deploy to Railway.
18. Configure Twilio webhook URLs.
19. Test calls and texts.
20. Connect the frontend.

## Definition of done (v1)

- The app can send an SMS from the Twilio number.
- The app can receive an SMS and show it in history.
- The app can start an outbound call from the Twilio number.
- The app can receive an inbound call.
- Call status is updated from Twilio.
- Message delivery status is updated from Twilio.
- The backend is deployed on Railway.
- Twilio webhook signatures are validated.
- Secrets are stored only in Railway environment variables.

## Security rules

- Never expose the Twilio Auth Token to the frontend.
- Require an API key for all app API routes.
- Validate every Twilio webhook using `X-Twilio-Signature` and the configured public HTTPS URL.
- Normalize phone numbers to E.164 before saving or sending.
- Use HTTPS only.
- Rate-limit outbound calls and messages.
- Log errors without exposing secrets or full message bodies.

## Simple v1 rule

Keep the first version focused on:

```text
Call someone
Text someone
Receive a call
Receive a text
See history
```

Do not build contacts, groups, recording, voicemail, or AI until the basic flow works end to end.
