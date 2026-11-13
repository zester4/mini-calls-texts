import { Router } from 'express';
import healthRoutes from './health.routes.js';
import callsRoutes from './calls.routes.js';
import messagesRoutes from './messages.routes.js';
import twilioRoutes from './twilio.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/calls', callsRoutes);
router.use('/messages', messagesRoutes);
router.use('/twilio', twilioRoutes);

export default router;
