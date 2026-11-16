import { Router } from 'express';
import { requireApiKey } from '../middleware/apiKey.js';
import * as voiceController from '../controllers/voice.controller.js';

const router = Router();
router.use(requireApiKey);

// Frontend requests a short-lived Twilio Voice JWT for the browser SDK.
router.get('/token', voiceController.getToken);
router.post('/token', voiceController.getToken);

export default router;
