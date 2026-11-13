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

Railway is suitable because it can host:

- The Express API
- The PostgreSQL database
- Environment variables
- Public HTTPS webhook endpoints
- Logs and deployments

## Tech stack

- Node.js
- Express
- Prisma
- PostgreSQL
- Twilio SDK
- Zod
- Jest or Vitest for basic tests

## Core features

### Calls

1. The user enters or selects a phone number.
2. The frontend sends `POST /api/calls`.
3. The backend validates the number.
4. The backend creates a `pending` call record.
5. The backend calls Twilio to create the outbound call.
6. The backend saves Twilio’s call SID.
7. Twilio sends status updates to `POST /api/twilio/call-status`.
8. The backend updates the call record.

### Messages

1. The user enters or selects a phone number.
2. The user writes a message.
3. The frontend sends `POST /api/messages`.
4. The backend validates the phone number and message.
5. The backend saves the message as `queued` or `sent`.
6. The backend sends the SMS through Twilio.
7. Twilio sends status updates to `POST /api/twilio/message-status`.
8. The backend updates the message status.

### Inbound SMS

1. Someone texts the Twilio number.
2. Twilio sends the message to `POST /api/twilio/sms`.
3. The backend validates the Twilio signature.
4. The backend saves the inbound message.
5. The backend returns a fast `200 OK` response.

### Inbound calls

1. Someone calls the Twilio number.
2. Twilio requests call instructions from `POST /api/twilio/voice`.
3. The backend validates the Twilio signature.
4. The backend returns TwiML.
5. For version 1, the call can be forwarded to a personal number or rejected.

## API endpoints

### App API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/calls` | Start an outbound call |
| GET | `/api/calls` | List recent calls |
| POST | `/api/messages` | Send an outbound SMS |
| GET | `/api/messages` | List recent messages |
| GET | `/api/threads/:phone` | Get message thread for one number |

All app API routes require an `x-api-key` header.

### Twilio webhooks

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/twilio/voice` | Handle inbound calls |
| POST | `/api/twilio/call-status` | Receive call-status updates |
| POST | `/api/twilio/sms` | Receive inbound SMS |
| POST | `/api/twilio/message-status` | Receive SMS-status updates |

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
| twilioCallSid | string | Twilio call ID |
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
| twilioMessageSid | string | Twilio message ID |
| createdAt | timestamp | Auto |

## Security

- Store all Twilio credentials in Railway environment variables.
- Never expose the Twilio Auth Token to the frontend.
- Require an API key for all app API routes.
- Validate every Twilio webhook using `X-Twilio-Signature`.
- Normalize phone numbers to E.164 before saving or sending.
- Use HTTPS only.
- Rate-limit outbound calls and messages.
- Log errors without exposing secrets or full message bodies.

Twilio signs webhook requests with `X-Twilio-Signature`; the Node SDK provides
`twilio.validateRequest()` for validating form-encoded webhook requests.

## Environment variables

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
