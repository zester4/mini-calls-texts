import { Router } from 'express';
import { requireApiKey } from '../middleware/apiKey.js';
import { validate } from '../middleware/validate.js';
import { createCallSchema } from '../validators/call.schema.js';
import * as callsController from '../controllers/calls.controller.js';

const router = Router();

router.use(requireApiKey);

router.post('/', validate(createCallSchema), callsController.createCall);
router.get('/', callsController.listCalls);

export default router;
