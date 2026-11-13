import { validateTwilioSignature } from '../lib/webhook.js';
import * as callsService from '../services/calls.service.js';
import * as messagesService from '../services/messages.service.js';
import { env } from '../config/env.js';
import twilio from 'twilio';

export async function handleVoice(req, res) {
  if (!validateTwilioSignature(req)) {
    return res.status(403).send('Forbidden');
  }

  const twiml = new twilio.twiml.VoiceResponse();
  if (env.FORWARD_CALL_TO) {
    twiml.dial(env.FORWARD_CALL_TO);
  } else {
    twiml.reject();
  }

  // Optionally save inbound call record here
  res.type('text/xml');
  res.send(twiml.toString());
}

export async function handleCallStatus(req, res) {
  if (!validateTwilioSignature(req)) {
    return res.status(403).send('Forbidden');
  }
  await callsService.updateCallStatus(req.body);
  res.sendStatus(200);
}

export async function handleSms(req, res) {
  if (!validateTwilioSignature(req)) {
    return res.status(403).send('Forbidden');
  }
  await messagesService.saveInboundMessage(req.body);
  res.sendStatus(200);
}

export async function handleMessageStatus(req, res) {
  if (!validateTwilioSignature(req)) {
    return res.status(403).send('Forbidden');
  }
  await messagesService.updateMessageStatus(req.body);
  res.sendStatus(200);
}
