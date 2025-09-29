-- Migration to add subcategory column to cost_entries table
-- This migration adds a subcategory column to store subcategory information

USE cost_tracker;

-- Add subcategory column to cost_entries table
ALTER TABLE cost_entries 
ADD COLUMN subcategory VARCHAR(100) NULL AFTER category;

-- Add index for better performance
CREATE INDEX idx_cost_entries_subcategory ON cost_entries(subcategory);

-- Add composite index for category and subcategory
CREATE INDEX idx_cost_entries_category_subcategory ON cost_entries(category, subcategory);
