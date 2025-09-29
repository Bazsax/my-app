-- Check the current state of the cost_entries table
USE cost_tracker;

-- Show table structure
DESCRIBE cost_entries;

-- Show all transactions with their types
SELECT id, user_id, type, title, amount, category, date FROM cost_entries ORDER BY date DESC;

-- Count transactions by type
SELECT type, COUNT(*) as count FROM cost_entries GROUP BY type;
