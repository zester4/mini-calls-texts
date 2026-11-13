import * as callsService from '../services/calls.service.js';

export async function createCall(req, res, next) {
  try {
    const call = await callsService.startOutboundCall(req.validated);
    res.status(201).json(call);
  } catch (err) {
    next(err);
  }
}

export async function listCalls(req, res, next) {
  try {
    const calls = await callsService.listRecentCalls();
    res.json(calls);
  } catch (err) {
    next(err);
  }
}
