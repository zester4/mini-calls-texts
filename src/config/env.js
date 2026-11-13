import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  APP_API_KEY: process.env.APP_API_KEY,
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL,
  FORWARD_CALL_TO: process.env.FORWARD_CALL_TO,
};
