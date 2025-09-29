-- Test data for cost_tracker database
-- This file contains only INSERT statements for testing purposes
-- Run this AFTER the main database schema has been created

USE cost_tracker;

-- Insert test users
INSERT INTO `users` (`id`, `name`, `email`, `password`, `created_at`, `updated_at`) VALUES
(1, 'idtest', 'idtest@test.com', '$2a$10$CbqN5SLHRqRIlXoGCQWcEued4OvYK/DPvcoINKq/yVbiBYbHUAD8C', '2025-09-27 20:50:53', '2025-09-27 20:50:53'),
(6, 'Test User', 'user@test.com', '$2a$10$NU4PEbltY9P4lUIRYyVlSeuYlVxK0S0Hw43qRINqHhTCQ0cv88KMO', '2025-09-28 22:31:49', '2025-09-28 22:31:49');

-- Insert test transactions
INSERT INTO `cost_entries` (`id`, `user_id`, `type`, `title`, `description`, `amount`, `category`, `subcategory`, `date`, `time`, `transaction_type`, `frequency`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
(40, 6, 'income', 'Fizetés', NULL, 482000.00, 'Fizetés', NULL, '2025-08-04', '00:31:00', 'recurring', 'monthly', NULL, NULL, '2025-09-28 22:32:17', '2025-09-28 22:32:32'),
(41, 6, 'income', 'Fizetés', NULL, 494000.00, 'Fizetés', NULL, '2025-07-07', '00:32:00', 'recurring', 'monthly', NULL, NULL, '2025-09-28 22:32:55', '2025-09-28 22:33:14'),
(42, 6, 'income', 'Fizetés', NULL, 504000.00, 'Fizetés', NULL, '2025-09-08', '00:33:00', 'recurring', 'monthly', NULL, NULL, '2025-09-28 22:33:42', '2025-09-28 22:33:56'),
(43, 6, 'income', 'Jutalom', NULL, 54530.00, 'Egyéb bevétel', NULL, '2025-09-28', '00:34:00', 'one-time', 'monthly', NULL, NULL, '2025-09-28 22:34:28', '2025-09-28 22:34:28'),
(44, 6, 'expense', 'Netflix', NULL, 3500.00, 'Iroda', NULL, '2025-09-23', '12:37:00', 'recurring', 'monthly', NULL, NULL, '2025-09-28 22:36:02', '2025-09-28 22:37:38'),
(45, 6, 'expense', 'Telefon vásárlás', 'Oneplus 13', 345860.00, 'Telefon', NULL, '2025-07-30', '00:43:00', 'one-time', 'monthly', NULL, NULL, '2025-09-28 22:44:40', '2025-09-28 22:46:50'),
(46, 6, 'expense', 'Költözés', 'Költözési költségek', 700000.00, 'Költözés', NULL, '2025-09-22', '00:46:00', 'timeline', 'monthly', '2025-08-19', '2025-09-08', '2025-09-28 22:47:53', '2025-09-28 22:59:43'),
(47, 6, 'expense', 'Autó biztosítás', NULL, 82000.00, 'Számlák', 'Biztosítás', '2025-09-28', '01:48:00', 'recurring', 'yearly', NULL, NULL, '2025-09-28 23:49:20', '2025-09-28 23:49:20');

-- Insert test custom subcategories
INSERT INTO `custom_subcategories` (`id`, `user_id`, `category_name`, `subcategory_name`, `type`, `created_at`, `updated_at`) VALUES
(4, 6, 'Számlák', 'Biztosítás', 'expense', '2025-09-28 23:49:04', '2025-09-28 23:49:04');
