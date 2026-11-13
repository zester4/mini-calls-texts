import { Router } from 'express';
import { requireApiKey } from '../middleware/apiKey.js';
import { validate } from '../middleware/validate.js';
import { threadParamsSchema } from '../validators/message.schema.js';
import { getThread } from '../controllers/messages.controller.js';

const router = Router();
router.use(requireApiKey);
router.get('/:phone', validate(threadParamsSchema, 'params'), getThread);
export default router;
