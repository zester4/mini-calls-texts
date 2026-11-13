CREATE TYPE "CallDirection" AS ENUM ('inbound', 'outbound');
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');

CREATE TABLE "Contact" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "phone" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Call" (
  "id" TEXT NOT NULL,
  "direction" "CallDirection" NOT NULL,
  "fromNumber" TEXT NOT NULL,
  "toNumber" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "twilioCallSid" TEXT,
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "statusUpdatedAt" TIMESTAMP(3),
  "errorCode" TEXT,
  CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "direction" "MessageDirection" NOT NULL,
  "fromNumber" TEXT NOT NULL,
  "toNumber" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "twilioMessageSid" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "statusUpdatedAt" TIMESTAMP(3),
  "errorCode" TEXT,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Contact_phone_key" ON "Contact"("phone");
CREATE UNIQUE INDEX "Call_twilioCallSid_key" ON "Call"("twilioCallSid");
CREATE UNIQUE INDEX "Message_twilioMessageSid_key" ON "Message"("twilioMessageSid");
CREATE INDEX "Call_createdAt_idx" ON "Call"("createdAt");
CREATE INDEX "Call_direction_status_idx" ON "Call"("direction", "status");
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");
CREATE INDEX "Message_fromNumber_idx" ON "Message"("fromNumber");
CREATE INDEX "Message_toNumber_idx" ON "Message"("toNumber");
CREATE INDEX "Message_direction_status_idx" ON "Message"("direction", "status");
