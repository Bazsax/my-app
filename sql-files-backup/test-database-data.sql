-- Test script to check if there's data in the cost_entries table
USE cost_tracker;

-- Check table structure
DESCRIBE cost_entries;

-- Check total count of transactions
SELECT COUNT(*) as total_transactions FROM cost_entries;

-- Check transactions by type
SELECT type, COUNT(*) as count FROM cost_entries GROUP BY type;

-- Check recent transactions
SELECT id, user_id, type, title, amount, date, category FROM cost_entries ORDER BY date DESC LIMIT 10;

-- Check if there are any transactions for user_id = 1 (default user)
SELECT COUNT(*) as user_1_transactions FROM cost_entries WHERE user_id = 1;

-- Check transactions for user_id = 1 by type
SELECT type, COUNT(*) as count FROM cost_entries WHERE user_id = 1 GROUP BY type;
