import twilio from 'twilio';
import { env } from '../config/env.js';
import { validateTwilioSignature } from '../lib/webhook.js';
import { normalizePhone } from '../lib/phone.js';
import * as callsService from '../services/calls.service.js';
import * as messagesService from '../services/messages.service.js';
import { logger } from '../utils/logger.js';

function rejectInvalidWebhook(req, res) {
  logger.warn('twilio_webhook_rejected', { path: req.path });
  return res.status(403).send('Forbidden');
}

function isTrustedWebhook(req) {
  if (!validateTwilioSignature(req)) return false;
  return !env.TWILIO_ACCOUNT_SID || req.body.AccountSid === env.TWILIO_ACCOUNT_SID;
}

function getClientIdentity() {
  return env.VOICE_CLIENT_IDENTITY || 'mini_calls_web';
}

function dialBrowserClient(twiml, { timeout = 30 } = {}) {
  const dial = twiml.dial({
    action: `${env.PUBLIC_BASE_URL}/api/twilio/call-status`,
    method: 'POST',
    timeout,
  });
  dial.client(getClientIdentity());
  return dial;
}

function dialPhoneFallback(twiml) {
  if (!env.FORWARD_CALL_TO) return false;
  const dial = twiml.dial({
    action: `${env.PUBLIC_BASE_URL}/api/twilio/call-status`,
    method: 'POST',
  });
  dial.number(env.FORWARD_CALL_TO);
  return true;
}

/**
 * Inbound call to the Twilio number.
 * Prefer the browser Client; fall back to FORWARD_CALL_TO if configured.
 */
export async function handleVoice(req, res, next) {
  if (!isTrustedWebhook(req)) return rejectInvalidWebhook(req, res);
  try {
    await callsService.saveInboundCall(req.body);
    const twiml = new twilio.twiml.VoiceResponse();

    // Prefer browser voice when Client identity is configured.
    if (env.TWILIO_API_KEY_SID && env.TWILIO_TWIML_APP_SID) {
      dialBrowserClient(twiml);
    } else if (env.FORWARD_CALL_TO) {
      dialPhoneFallback(twiml);
    } else {
      twiml.reject();
    }

    return res.type('text/xml').send(twiml.toString());
  } catch (error) {
    return next(error);
  }
}

/**
 * TwiML for REST-initiated outbound calls (legacy phone-bridge path).
 * When browser voice is enabled, prefer connecting the answered party to the Client.
 */
export async function handleOutboundVoice(req, res) {
  if (!isTrustedWebhook(req)) return rejectInvalidWebhook(req, res);
  const twiml = new twilio.twiml.VoiceResponse();

  if (env.TWILIO_API_KEY_SID && env.TWILIO_TWIML_APP_SID) {
    dialBrowserClient(twiml);
  } else if (env.FORWARD_CALL_TO) {
    dialPhoneFallback(twiml);
  } else {
    twiml.say('Call forwarding is not configured. Please contact the application owner.');
    twiml.hangup();
  }

  return res.type('text/xml').send(twiml.toString());
}

/**
 * Voice URL for the TwiML App used by the browser SDK for outbound calls.
 * Browser sends params.To = destination E.164 number.
 */
export async function handleClientVoice(req, res, next) {
  if (!isTrustedWebhook(req)) return rejectInvalidWebhook(req, res);
  try {
    const to = normalizePhone(req.body.To) || req.body.To;
    const from = env.TWILIO_PHONE_NUMBER;
    const twiml = new twilio.twiml.VoiceResponse();

    if (!to) {
      twiml.say('No destination number was provided.');
      twiml.hangup();
      return res.type('text/xml').send(twiml.toString());
    }

    // Persist outbound call started from the browser when possible.
    try {
      await callsService.recordBrowserOutboundCall({
        to,
        from,
        callSid: req.body.CallSid,
      });
    } catch (persistError) {
      logger.warn('browser_outbound_persist_failed', { message: persistError.message });
    }

    const dial = twiml.dial({
      callerId: from,
      action: `${env.PUBLIC_BASE_URL}/api/twilio/call-status`,
      method: 'POST',
    });

    if (/^\+[1-9]\d{7,14}$/.test(to)) {
      dial.number(to);
    } else {
      // Allow dialing another Client identity if needed.
      dial.client(to);
    }

    return res.type('text/xml').send(twiml.toString());
  } catch (error) {
    return next(error);
  }
}

export async function handleCallStatus(req, res, next) {
  if (!isTrustedWebhook(req)) return rejectInvalidWebhook(req, res);
  try {
    await callsService.updateCallStatus(req.body);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.hangup();
    return res.type('text/xml').send(twiml.toString());
  } catch (error) {
    return next(error);
  }
}

export async function handleSms(req, res, next) {
  if (!isTrustedWebhook(req)) return rejectInvalidWebhook(req, res);
  try {
    await messagesService.saveInboundMessage(req.body);
    const twiml = new twilio.twiml.MessagingResponse();
    return res.type('text/xml').send(twiml.toString());
  } catch (error) {
    return next(error);
  }
}

export async function handleMessageStatus(req, res, next) {
  if (!isTrustedWebhook(req)) return rejectInvalidWebhook(req, res);
  try {
    await messagesService.updateMessageStatus(req.body);
    return res.sendStatus(200);
  } catch (error) {
    return next(error);
  }
}
