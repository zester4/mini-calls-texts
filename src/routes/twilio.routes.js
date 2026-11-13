import { Router } from 'express';
import * as twilioController from '../controllers/twilio.controller.js';

const router = Router();

router.post('/voice', twilioController.handleVoice);
router.post('/call-status', twilioController.handleCallStatus);
router.post('/sms', twilioController.handleSms);
router.post('/message-status', twilioController.handleMessageStatus);

export default router;
