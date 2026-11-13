# Mini Calls & Texts

A small Node.js API for placing and receiving phone calls and SMS through a Twilio number. PostgreSQL stores call/message history; Railway is the intended hosting platform.

## Requirements

- Node.js 20+
- PostgreSQL
- A Twilio account and voice/SMS-capable number
- A long random application API key

## Local setup

1. Copy `.env.example` to `.env` and fill in the values.
2. Install dependencies: `npm install`.
3. Generate Prisma Client: `npm run prisma:generate`.
4. Apply migrations: `npm run prisma:deploy` (or `npm run prisma:migrate` during local development).
5. Start the API: `npm start`.

For local Twilio webhook testing, expose the service through an HTTPS tunnel and set `PUBLIC_BASE_URL` to that public HTTPS origin.

## Environment

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | Railway/local | HTTP port; Railway supplies this automatically |
| `NODE_ENV` | No | `development`, `test`, or `production` |
| `TWILIO_ACCOUNT_SID` | Yes for calls/SMS | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Yes for calls/SMS/webhooks | Twilio Auth Token; server-side only |
| `TWILIO_PHONE_NUMBER` | Yes for calls/SMS | Your Twilio number in E.164 format |
| `APP_API_KEY` | Yes | Random secret sent as the `x-api-key` header; use 32+ characters in production |
| `PUBLIC_BASE_URL` | Yes for Twilio | Public HTTPS service origin, without a trailing path |
| `FORWARD_CALL_TO` | Yes for two-way calls | Your phone in E.164 format; answered calls are bridged to this number |

Never commit `.env` or expose the Twilio Auth Token to a frontend. The `APP_API_KEY` is also a server secret: do not embed it in a public browser/mobile bundle. Put a trusted backend-for-frontend proxy in front of this API or add user authentication before allowing public clients to call it.

## API

All application routes except health checks require `x-api-key`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/health/ready` | Database readiness check |
| POST | `/api/calls` | Start a call to a destination |
| GET | `/api/calls?limit=50` | Recent call history |
| POST | `/api/messages` | Send an SMS |
| GET | `/api/messages?limit=50` | Recent SMS history |
| GET | `/api/threads/:phone` | Conversation history for an E.164 number |
| GET | `/api/messages/threads/:phone` | Compatibility alias for thread history |

Example:

```bash
curl -X POST "$PUBLIC_BASE_URL/api/messages" \
  -H "x-api-key: $APP_API_KEY" \
  -H "content-type: application/json" \
  -d '{"to":"+14155552671","body":"Hello from Mini Calls & Texts"}'
```

Phone numbers must include an international country code (E.164). The API allows up to 10 outbound calls/hour and 60 outbound SMS/hour per source IP, per service instance. Responses use `{ "data": ... }` on success and `{ "error": ..., "code": ... }` on failure.

## Twilio Console configuration

Set the Twilio number's webhook handlers to the deployed HTTPS URL:

- **A call comes in:** `POST https://YOUR_HOST/api/twilio/voice`
- **A message comes in:** `POST https://YOUR_HOST/api/twilio/sms`

The application creates the outbound call/message status callbacks itself:

- `POST /api/twilio/call-status`
- `POST /api/twilio/message-status`

The outbound call TwiML endpoint is `POST /api/twilio/outbound-voice`. Configure the service's `PUBLIC_BASE_URL` to the exact public HTTPS origin so Twilio signature validation matches the URL Twilio calls. All webhook requests must retain the standard `application/x-www-form-urlencoded` content type.

Inbound and outbound calls are bridged to `FORWARD_CALL_TO`. Without it, inbound calls are rejected and outbound calls announce that forwarding is not configured.

## Railway deployment

1. Create a Railway project and PostgreSQL service.
2. Deploy this repository as a Node.js web service.
3. Add the environment variables above to the web service (Railway provides `PORT`).
4. Ensure the build runs `npm install` and `npx prisma generate`.
5. Run `npx prisma migrate deploy` as the release/deploy migration step before starting the new version.
6. Keep the start command as `npm start`; the readiness health check is `/api/health/ready`.
7. Configure the Twilio number webhooks after the public HTTPS domain is available.
8. Verify `/api/health/ready`, then perform real inbound/outbound call and SMS tests.

Do not mark production setup complete until the Railway database, environment variables, deployed health check, and real Twilio flows have all been verified.

## Development checks

```bash
npm test
npx prisma validate
npx prisma generate
```

GitHub Actions runs these checks for pushes to the main/feature branches and pull requests.
