import * as messagesService from '../services/messages.service.js';

export async function createMessage(req, res, next) {
  try {
    const message = await messagesService.sendOutboundMessage(req.validated);
    return res.status(201).json({ data: message });
  } catch (error) { return next(error); }
}

export async function listMessages(req, res, next) {
  try {
    const messages = await messagesService.listRecentMessages(req.validated);
    return res.json({ data: messages });
  } catch (error) { return next(error); }
}

export async function getThread(req, res, next) {
  try {
    const thread = await messagesService.getThread(req.validated.phone);
    return res.json({ data: thread });
  } catch (error) { return next(error); }
}
