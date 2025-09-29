USE cost_tracker;

-- Add time column to cost_entries table
ALTER TABLE cost_entries 
ADD COLUMN time TIME NULL AFTER date;

-- Create index for time column
CREATE INDEX idx_cost_entries_time ON cost_entries(time);

-- Create composite index for date and time
CREATE INDEX idx_cost_entries_date_time ON cost_entries(date, time);
