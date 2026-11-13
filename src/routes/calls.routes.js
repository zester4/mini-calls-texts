import { Router } from 'express';
import { requireApiKey } from '../middleware/apiKey.js';
import { validate } from '../middleware/validate.js';
import { outboundCallLimiter } from '../middleware/rateLimit.js';
import { createCallSchema, listCallsQuerySchema } from '../validators/call.schema.js';
import * as callsController from '../controllers/calls.controller.js';

const router = Router();
router.use(requireApiKey);
router.post('/', outboundCallLimiter, validate(createCallSchema), callsController.createCall);
router.get('/', validate(listCallsQuerySchema, 'query'), callsController.listCalls);
export default router;
