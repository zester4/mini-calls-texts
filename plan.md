# Mini Calls & Texts — Backend Plan

## Goal

Build a simple backend for a calls-and-texts-only mini app using Twilio numbers.

The backend will let the app:

- Start outbound calls using a Twilio number
- Receive inbound calls through Twilio webhooks
- Send outbound SMS using a Twilio number
- Receive inbound SMS through Twilio webhooks
- Store basic call and message history
- Provide a simple API for the frontend

This is version 1. It intentionally excludes contacts sync, call recording,
voicemail, group messaging, AI replies, and multiple-user teams.

## Hosting

The backend will be deployed to Railway as a long-running Node.js web service.

Railway hosts the Express API and PostgreSQL database, provides environment variables,
public HTTPS webhook endpoints, logs, and deployments.

## Tech stack

- Node.js 20+
- Express
- Prisma
- PostgreSQL
- Twilio SDK
- Zod
- Node.js built-in test runner

## Core features

### Calls

1. The user enters or selects a destination phone number.
2. The frontend sends `POST /api/calls`.
3. The backend validates the number as E.164.
4. The backend creates a `queued` call record.
5. The backend asks Twilio to call the destination using the configured Twilio number.
6. When the destination answers, Twilio requests outbound TwiML from `POST /api/twilio/outbound-voice`.
7. The outbound TwiML dials `FORWARD_CALL_TO`, bridging the destination to the user's phone for a two-way call.
8. The backend saves Twilio's call SID and status.
9. Twilio sends status/action updates to `POST /api/twilio/call-status`.
10. The backend updates call status and timestamps.

`FORWARD_CALL_TO` is required for two-way calling. If it is not configured,
inbound calls are rejected and outbound calls announce that forwarding is unavailable.

### Messages

1. The user enters or selects a phone number.
2. The user writes a message.
3. The frontend sends `POST /api/messages`.
4. The backend validates the phone number and message.
5. The backend saves the message as `queued`.
6. The backend sends the SMS through Twilio.
7. Twilio sends status updates to `POST /api/twilio/message-status`.
8. The backend updates the message status and delivery timestamp.

### Inbound SMS

1. Someone texts the Twilio number.
2. Twilio sends the message to `POST /api/twilio/sms`.
3. The backend validates the Twilio signature and account.
4. The backend saves the inbound message idempotently using its Twilio SID.
5. The backend acknowledges the webhook with TwiML.

### Inbound calls

1. Someone calls the Twilio number.
2. Twilio requests call instructions from `POST /api/twilio/voice`.
3. The backend validates the Twilio signature and account.
4. The backend saves the inbound call and returns TwiML.
5. The call is forwarded to `FORWARD_CALL_TO` or rejected if no forwarding target is configured.
6. The `<Dial action>` callback updates the call record through `POST /api/twilio/call-status`.

## API endpoints

### App API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/health/ready` | Database readiness check |
| POST | `/api/calls` | Start an outbound call |
| GET | `/api/calls` | List recent calls |
| POST | `/api/messages` | Send an outbound SMS |
| GET | `/api/messages` | List recent messages |
| GET | `/api/threads/:phone` | Get message thread for one number |

All app API routes except health checks require an `x-api-key` header.
The key is a server secret and must not be embedded in a public frontend bundle.

### Twilio webhooks

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/twilio/voice` | Handle inbound calls |
| POST | `/api/twilio/outbound-voice` | Return outbound call TwiML |
| POST | `/api/twilio/call-status` | Receive call-status/action updates |
| POST | `/api/twilio/sms` | Handle inbound SMS |
| POST | `/api/twilio/message-status` | Receive SMS delivery updates |

Twilio webhook routes do not use the app API key.
They must validate the `X-Twilio-Signature` header instead.

## Database model

### Contact

Optional in version 1, but useful for saving names.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | string | Optional |
| phone | string | Unique, E.164 format |
| createdAt | timestamp | Auto |

### Call

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| direction | enum | `outbound` or `inbound` |
| fromNumber | string | Caller number |
| toNumber | string | Called number |
| status | string | `queued`, `ringing`, `in-progress`, `completed`, `failed`, etc. |
| twilioCallSid | string | Unique Twilio call ID |
| startedAt | timestamp | Optional |
| endedAt | timestamp | Optional |
| createdAt | timestamp | Auto |

### Message

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| direction | enum | `outbound` or `inbound` |
| fromNumber | string | Sender number |
| toNumber | string | Recipient number |
| body | text | Message content |
| status | string | `queued`, `sent`, `delivered`, `failed`, etc. |
| twilioMessageSid | string | Unique Twilio message ID |
| createdAt | timestamp | Auto |

## Security

- Store all Twilio credentials in Railway environment variables.
- Never expose the Twilio Auth Token or `APP_API_KEY` to a public frontend.
- Require an API key for all app API routes except health checks.
- Validate every Twilio webhook using `X-Twilio-Signature`.
- Verify the Twilio account SID and normalize phone numbers to E.164.
- Use HTTPS only.
- Rate-limit outbound calls and messages.
- Log errors without exposing secrets, phone numbers, or full message bodies.
- Make inbound webhook persistence idempotent to tolerate provider retries.

Twilio signs webhook requests with `X-Twilio-Signature`; the Node SDK provides
`twilio.validateRequest()` for validating form-encoded webhook requests. The implementation
uses the configured public HTTPS origin plus the original request path, avoiding trust in
incoming Host headers. It also verifies the expected Twilio Account SID.

The readiness endpoint catches database connection failures and returns HTTP 503 rather
than leaving an asynchronous Express 4 request unresolved.

## Environment variables

```env
DATABASE_URL=postgresql://...
PORT=3000
NODE_ENV=production

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567

APP_API_KEY=choose-a-long-random-key

PUBLIC_BASE_URL=https://your-railway-app.up.railway.app
FORWARD_CALL_TO=+15559876543
```
