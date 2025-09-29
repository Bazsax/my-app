-- Migration script to add new transaction type fields to existing cost_entries table
-- Run this if you already have an existing cost_entries table

-- Add new columns to existing cost_entries table
ALTER TABLE cost_entries 
ADD COLUMN transaction_type ENUM('one-time', 'recurring', 'timeline') DEFAULT 'one-time' AFTER date,
ADD COLUMN frequency ENUM('daily', 'weekly', 'monthly', 'yearly') DEFAULT 'monthly' AFTER transaction_type,
ADD COLUMN start_date DATE NULL AFTER frequency,
ADD COLUMN end_date DATE NULL AFTER start_date;

-- Add index for transaction_type
ALTER TABLE cost_entries ADD INDEX idx_transaction_type (transaction_type);

-- Update existing records to have default values
UPDATE cost_entries SET transaction_type = 'one-time' WHERE transaction_type IS NULL;
