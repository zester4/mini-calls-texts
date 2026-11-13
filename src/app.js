import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for Twilio webhooks

app.use('/api', routes);

app.use(errorHandler);

export default app;
