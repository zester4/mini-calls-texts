import { Router } from 'express';
import { requireApiKey } from '../middleware/apiKey.js';
import { validate } from '../middleware/validate.js';
import { outboundMessageLimiter } from '../middleware/rateLimit.js';
import { createMessageSchema, listMessagesQuerySchema, threadParamsSchema } from '../validators/message.schema.js';
import * as messagesController from '../controllers/messages.controller.js';

const router = Router();
router.use(requireApiKey);
router.post('/', outboundMessageLimiter, validate(createMessageSchema), messagesController.createMessage);
router.get('/', validate(listMessagesQuerySchema, 'query'), messagesController.listMessages);
router.get('/threads/:phone', validate(threadParamsSchema, 'params'), messagesController.getThread);
export default router;
