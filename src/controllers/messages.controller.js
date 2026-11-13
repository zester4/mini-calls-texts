import * as messagesService from '../services/messages.service.js';

export async function createMessage(req, res, next) {
  try {
    const message = await messagesService.sendOutboundMessage(req.validated);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

export async function listMessages(req, res, next) {
  try {
    const messages = await messagesService.listRecentMessages();
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

export async function getThread(req, res, next) {
  try {
    const thread = await messagesService.getThread(req.params.phone);
    res.json(thread);
  } catch (err) {
    next(err);
  }
}
