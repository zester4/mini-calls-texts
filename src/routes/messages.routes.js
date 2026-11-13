import { Router } from 'express';
import { requireApiKey } from '../middleware/apiKey.js';
import { validate } from '../middleware/validate.js';
import { createMessageSchema } from '../validators/message.schema.js';
import * as messagesController from '../controllers/messages.controller.js';

const router = Router();

router.use(requireApiKey);

router.post('/', validate(createMessageSchema), messagesController.createMessage);
router.get('/', messagesController.listMessages);
router.get('/threads/:phone', messagesController.getThread);

export default router;
