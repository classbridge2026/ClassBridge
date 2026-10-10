-- CreateEnum
CREATE TYPE "ClassChatMessageType" AS ENUM ('MESSAGE', 'ANNOUNCEMENT');

-- CreateTable
CREATE TABLE "ClassChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "type" "ClassChatMessageType" NOT NULL DEFAULT 'MESSAGE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassChatMessage_sessionId_createdAt_idx" ON "ClassChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "ClassChatMessage_senderId_idx" ON "ClassChatMessage"("senderId");

-- AddForeignKey
ALTER TABLE "ClassChatMessage" ADD CONSTRAINT "ClassChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassChatMessage" ADD CONSTRAINT "ClassChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
