import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// Railway terminates TLS at one trusted reverse proxy.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Twilio sends application/x-www-form-urlencoded payloads. Parse them before routes.
app.use(express.urlencoded({ extended: false, limit: '32kb' }));
app.use(express.json({ limit: '32kb' }));

app.use('/api', routes);
app.use((req, res) => res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' }));
app.use(errorHandler);

export default app;
