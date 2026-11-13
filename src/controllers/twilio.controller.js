import twilio from 'twilio';
import { env } from '../config/env.js';
import { validateTwilioSignature } from '../lib/webhook.js';
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

function dialForwardTarget(twiml) {
  const dial = twiml.dial({
    action: `${env.PUBLIC_BASE_URL}/api/twilio/call-status`,
    method: 'POST',
  });
  dial.number(env.FORWARD_CALL_TO);
}

export async function handleVoice(req, res, next) {
  if (!isTrustedWebhook(req)) return rejectInvalidWebhook(req, res);
  try {
    await callsService.saveInboundCall(req.body);
    const twiml = new twilio.twiml.VoiceResponse();
    if (env.FORWARD_CALL_TO) dialForwardTarget(twiml);
    else twiml.reject();
    return res.type('text/xml').send(twiml.toString());
  } catch (error) { return next(error); }
}

export async function handleOutboundVoice(req, res) {
  if (!isTrustedWebhook(req)) return rejectInvalidWebhook(req, res);
  const twiml = new twilio.twiml.VoiceResponse();
  if (env.FORWARD_CALL_TO) dialForwardTarget(twiml);
  else {
    twiml.say('Call forwarding is not configured. Please contact the application owner.');
    twiml.hangup();
  }
  return res.type('text/xml').send(twiml.toString());
}

export async function handleCallStatus(req, res, next) {
  if (!isTrustedWebhook(req)) return rejectInvalidWebhook(req, res);
  try {
    await callsService.updateCallStatus(req.body);
    // Also valid as the TwiML response to the <Dial action> callback.
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.hangup();
    return res.type('text/xml').send(twiml.toString());
  } catch (error) { return next(error); }
}

export async function handleSms(req, res, next) {
  if (!isTrustedWebhook(req)) return rejectInvalidWebhook(req, res);
  try {
    await messagesService.saveInboundMessage(req.body);
    const twiml = new twilio.twiml.MessagingResponse();
    return res.type('text/xml').send(twiml.toString());
  } catch (error) { return next(error); }
}

export async function handleMessageStatus(req, res, next) {
  if (!isTrustedWebhook(req)) return rejectInvalidWebhook(req, res);
  try {
    await messagesService.updateMessageStatus(req.body);
    return res.sendStatus(200);
  } catch (error) { return next(error); }
}
