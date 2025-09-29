-- Create database (adjust database name as needed)
CREATE DATABASE IF NOT EXISTS cost_tracker;
USE cost_tracker;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Create sessions table for JWT token management (optional)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
);

-- Create cost entries table (for the koltseg functionality)
CREATE TABLE IF NOT EXISTS cost_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    date DATE NOT NULL,
    transaction_type ENUM('one-time', 'recurring', 'timeline') DEFAULT 'one-time',
    frequency ENUM('daily', 'weekly', 'monthly', 'yearly') DEFAULT 'monthly',
    start_date DATE NULL,
    end_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_date (date),
    INDEX idx_category (category),
    INDEX idx_transaction_type (transaction_type)
);

-- Insert sample user (password is 'password123' hashed with bcrypt)
-- You can use this for testing: email: test@example.com, password: password123
INSERT INTO users (name, email, password) VALUES 
('Test User', 'test@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert sample cost entries for testing
INSERT INTO cost_entries (user_id, title, description, amount, category, date) VALUES 
(1, 'Office Supplies', 'Purchased notebooks and pens', 45.50, 'Office', '2024-01-15'),
(1, 'Software License', 'Annual subscription for productivity software', 299.99, 'Software', '2024-01-20'),
(1, 'Marketing Campaign', 'Google Ads campaign for Q1', 500.00, 'Marketing', '2024-01-25'),
(1, 'Travel Expenses', 'Business trip to client meeting', 250.75, 'Travel', '2024-02-01'),
(1, 'Equipment Maintenance', 'Computer repair and maintenance', 150.00, 'Maintenance', '2024-02-05');

-- Create indexes for better performance
CREATE INDEX idx_cost_entries_user_date ON cost_entries(user_id, date);
CREATE INDEX idx_cost_entries_category ON cost_entries(category);

-- Grant permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON cost_tracker.* TO 'your_username'@'localhost';
-- FLUSH PRIVILEGES;
