-- Add amount column to payment_receipts table
ALTER TABLE payment_receipts ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT NULL;
