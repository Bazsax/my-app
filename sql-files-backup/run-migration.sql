-- Run this SQL script in your MySQL database to add the type column
-- This will allow proper filtering of income vs expense transactions

USE cost_tracker;

-- Add type column to cost_entries table
ALTER TABLE cost_entries 
ADD COLUMN type ENUM('income', 'expense') DEFAULT 'expense' AFTER user_id;

-- Update existing records to be expenses (since they were created as expenses)
UPDATE cost_entries SET type = 'expense' WHERE type IS NULL;

-- Add index for better performance
CREATE INDEX idx_cost_entries_type ON cost_entries(type);

-- Add composite index for user_id and type
CREATE INDEX idx_cost_entries_user_type ON cost_entries(user_id, type);

-- Show the updated table structure
DESCRIBE cost_entries;
