-- Fix existing transactions to have proper types
-- Since the type column already exists, we need to update existing data

USE cost_tracker;

-- First, let's see what we have
SELECT id, type, title, amount, category FROM cost_entries ORDER BY id;

-- Update transactions based on some logic
-- For now, let's assume all existing transactions are expenses
-- You can manually update some to 'income' if needed

-- Example: Update specific transactions to income (adjust IDs as needed)
-- UPDATE cost_entries SET type = 'income' WHERE id IN (1, 2, 3);

-- Or update based on category (if you have income categories)
-- UPDATE cost_entries SET type = 'income' WHERE category IN ('Fizetés', 'Egyéb bevétel');

-- Show the updated results
SELECT id, type, title, amount, category FROM cost_entries ORDER BY id;
