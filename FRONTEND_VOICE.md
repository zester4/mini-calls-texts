# Frontend Voice Integration Guide

This backend now supports **live browser calling** (hear + speak in the web app) via the Twilio Voice JavaScript SDK.

## Prerequisites (backend / Twilio Console)

1. Create a **Twilio API Key** (Account → API keys & tokens). Save SID + secret.
2. Create a **TwiML App** (Voice → TwiML Apps):
   - **Voice Request URL:** `POST https://YOUR_BACKEND/api/twilio/client-voice`
   - Method: `HTTP POST`
3. Set env on Railway:
   - `TWILIO_API_KEY_SID`
   - `TWILIO_API_KEY_SECRET`
   - `TWILIO_TWIML_APP_SID`
   - `VOICE_CLIENT_IDENTITY=mini_calls_web` (must match what the frontend registers as)
4. Keep the phone number webhook for **inbound** as:
   - Voice: `POST https://YOUR_BACKEND/api/twilio/voice`

## New backend endpoint

### `GET` or `POST` `/api/voice/token`

**Headers**
```
x-api-key: <APP_API_KEY>
```

**Response**
```json
{
  "data": {
    "identity": "mini_calls_web",
    "token": "eyJ...",
    "expiresIn": 3600
  }
}
```

Refresh the token before it expires (e.g. every 45–50 minutes).

## Frontend package

```bash
npm install @twilio/voice-sdk
```

## Setup (run once when the app loads)

```js
import { Device } from '@twilio/voice-sdk';

const API_BASE = import.meta.env.VITE_API_BASE_URL; // https://your-backend
const API_KEY = /* from secure proxy / env — do not hardcode in public apps */;

async function fetchVoiceToken() {
  const res = await fetch(`${API_BASE}/api/voice/token`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'content-type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to get voice token');
  const json = await res.json();
  return json.data; // { identity, token, expiresIn }
}

let device;

async function setupVoice() {
  const { token, identity } = await fetchVoiceToken();

  device = new Device(token, {
    logLevel: 1,
    codecPreferences: ['opus', 'pcmu'],
  });

  device.on('registered', () => {
    console.log('Voice ready as', identity);
  });

  device.on('error', (err) => {
    console.error('Voice error', err);
  });

  // Incoming call from someone dialing the Twilio number
  device.on('incoming', (call) => {
    // Show UI: Answer / Reject
    // call.accept()  → hear + speak in browser
    // call.reject()
    window.__incomingCall = call;
  });

  device.on('tokenWillExpire', async () => {
    const next = await fetchVoiceToken();
    device.updateToken(next.token);
  });

  await device.register();
  return device;
}
```

## Outbound call (browser speaks)

```js
async function placeCall(toE164) {
  if (!device) await setupVoice();

  const call = await device.connect({
    params: {
      To: toE164, // e.g. "+14155552671"
    },
  });

  call.on('accept', () => console.log('Connected'));
  call.on('disconnect', () => console.log('Ended'));
  call.on('error', (e) => console.error(e));

  return call; // call.disconnect() to hang up
}
```

Do **not** use `POST /api/calls` for browser audio. That path still bridges to the phone. For web audio, always use `device.connect({ params: { To } })`.

## Inbound call (browser answers)

1. Someone calls the Twilio number.
2. Backend returns TwiML that dials Client `mini_calls_web`.
3. Frontend receives `device.on('incoming')`.
4. User clicks Answer → `call.accept()`.
5. User hears and speaks in the browser.

```js
function answerIncoming() {
  window.__incomingCall?.accept();
}

function rejectIncoming() {
  window.__incomingCall?.reject();
}
```

## UI checklist

- [ ] Request microphone permission (HTTPS required)
- [ ] Register Device on app load (or when user opens the Calls screen)
- [ ] Outbound: dial pad / contact → `device.connect({ params: { To } })`
- [ ] Inbound: ring UI → Accept / Reject
- [ ] In-call: mute (`call.mute(true/false)`), hang up (`call.disconnect()`)
- [ ] Token refresh on `tokenWillExpire`
- [ ] Show connection state (registered / ringing / open / closed)

## Identity must match

| Place | Value |
|-------|--------|
| Backend env `VOICE_CLIENT_IDENTITY` | `mini_calls_web` |
| Token response `identity` | same |
| Inbound TwiML `<Client>` | same |

If these differ, inbound calls will not ring in the browser.

## Security notes

- Prefer a small BFF/proxy so `APP_API_KEY` is not shipped in a public SPA bundle.
- Tokens expire (~1 hour). Always refresh.
- Mic access requires **HTTPS** (or localhost).

## Smoke test

1. Open the web app on HTTPS, allow mic.
2. Confirm Device registers (no errors).
3. Outbound: call a real phone → browser audio works.
4. Inbound: call the Twilio number from another phone → browser rings → Accept → two-way audio.
5. History still available via `GET /api/calls`.
