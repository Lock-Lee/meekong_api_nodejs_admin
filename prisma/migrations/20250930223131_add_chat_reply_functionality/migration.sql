-- Add reply functionality to ChatMessage table
-- Add reply_to_id column to ChatMessage
ALTER TABLE "ChatMessage" ADD COLUMN "reply_to_id" TEXT;

-- Create index for reply_to_id
CREATE INDEX "ChatMessage_reply_to_id_idx" ON "ChatMessage"("reply_to_id");

-- Add foreign key constraint for reply_to_id
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add REPLY to ChatMessageType enum (if not already added)
ALTER TYPE "ChatMessageType" ADD VALUE IF NOT EXISTS 'REPLY';