import * as callsService from '../services/calls.service.js';

export async function createCall(req, res, next) {
  try {
    const call = await callsService.startOutboundCall(req.validated);
    return res.status(201).json({ data: call });
  } catch (error) { return next(error); }
}

export async function listCalls(req, res, next) {
  try {
    const calls = await callsService.listRecentCalls(req.validated);
    return res.json({ data: calls });
  } catch (error) { return next(error); }
}
