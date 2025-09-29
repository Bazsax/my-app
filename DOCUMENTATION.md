# Personal Finance Management System

## Overview

A comprehensive personal finance management application built with Next.js 15, TypeScript, and MySQL. This system allows users to track income and expenses, manage transactions, and analyze their financial data through interactive charts and reports.

## Features

### 🔐 Authentication & User Management
- **User Registration**: Create new accounts with email and password
- **Secure Login**: JWT-based authentication with 7-day token expiration
- **Profile Management**: Update user information and change passwords
- **Password Security**: Bcrypt hashing for secure password storage

### 💰 Transaction Management
- **Add Transactions**: Create income and expense entries with detailed information
- **Edit Transactions**: Modify existing transaction details
- **Delete Transactions**: Remove individual or multiple transactions
- **Transaction Types**: Support for one-time, recurring, and timeline-based transactions
- **Categories & Subcategories**: Organize transactions with custom categories
- **Editable Categories**: Edit and delete custom categories with pen and trash icons
- **Category Management**: Add, edit, and delete both categories and subcategories
- **Transaction Updates**: Automatically update existing transactions when categories are renamed
- **Inline Editing**: Double-click to edit category, subcategory, and description directly in the transaction table
- **Visual Indicators**: Lock icons show predefined (locked) vs custom (unlocked) categories
- **Mobile-Friendly Editing**: Save/Cancel buttons for mobile devices with touch-friendly interface
- **Empty Subcategory Creation**: Double-click empty subcategory cells to create new subcategories
- **Description Editing**: Double-click any description to edit transaction details

### 📊 Data Visualization
- **Interactive Charts**: Visual representation of income vs expenses over time
- **Date Range Filtering**: Analyze data for specific time periods
- **Real-time Updates**: Charts automatically refresh when data changes

### 🔍 Advanced Filtering & Search
- **Multi-criteria Filtering**: Filter by transaction type, category, and date range
- **Text Search**: Search transactions by title and description keywords
- **Custom Categories**: Dynamically load user-created categories with full CRUD operations
- **Bulk Operations**: Select and manage multiple transactions simultaneously
- **Refresh Functionality**: Manual refresh button to update transaction data

### 📋 Data Management
- **Column Customization**: Show/hide table columns based on user preferences
- **CSV Export**: Export filtered or selected transactions to CSV format
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Mobile Layout**: Stacked button layout with wrapping for mobile screens
- **Touch-Friendly Interface**: Optimized buttons and interactions for mobile devices

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Recharts**: Data visualization library
- **Tabler Icons**: Icon library
- **Sonner**: Toast notifications

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **MySQL**: Relational database
- **JWT**: JSON Web Tokens for authentication
- **Bcryptjs**: Password hashing
- **Date-fns**: Date manipulation library

### Database Schema

#### Complete Database Setup
```sql
-- Create database
CREATE DATABASE IF NOT EXISTS cost_tracker;
USE cost_tracker;

-- Users table
CREATE TABLE users (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY email (email),
    KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- User sessions table (for JWT token management)
CREATE TABLE user_sessions (
    id INT(11) NOT NULL AUTO_INCREMENT,
    user_id INT(11) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_token_hash (token_hash),
    KEY idx_expires_at (expires_at),
    CONSTRAINT user_sessions_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Cost entries table (transactions)
CREATE TABLE cost_entries (
    id INT(11) NOT NULL AUTO_INCREMENT,
    user_id INT(11) NOT NULL,
    type ENUM('income','expense') DEFAULT 'expense',
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) DEFAULT NULL,
    subcategory VARCHAR(100) DEFAULT NULL,
    date DATE NOT NULL,
    time TIME DEFAULT NULL,
    transaction_type ENUM('one-time','recurring','timeline') DEFAULT 'one-time',
    frequency ENUM('daily','weekly','monthly','yearly') DEFAULT 'monthly',
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_date (date),
    KEY idx_category (category),
    KEY idx_cost_entries_user_date (user_id,date),
    KEY idx_cost_entries_category (category),
    KEY idx_transaction_type (transaction_type),
    KEY idx_cost_entries_type (type),
    KEY idx_cost_entries_user_type (user_id,type),
    KEY idx_cost_entries_subcategory (subcategory),
    KEY idx_cost_entries_category_subcategory (category,subcategory),
    KEY idx_cost_entries_time (time),
    KEY idx_cost_entries_date_time (date,time),
    CONSTRAINT cost_entries_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Custom categories table
CREATE TABLE custom_categories (
    id INT(11) NOT NULL AUTO_INCREMENT,
    user_id INT(11) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('income','expense') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_user_category (user_id,name,type),
    KEY idx_user_id (user_id),
    KEY idx_type (type),
    CONSTRAINT custom_categories_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Custom subcategories table
CREATE TABLE custom_subcategories (
    id INT(11) NOT NULL AUTO_INCREMENT,
    user_id INT(11) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    subcategory_name VARCHAR(100) NOT NULL,
    type ENUM('income','expense') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_user_subcategory (user_id,category_name,subcategory_name,type),
    KEY idx_user_id (user_id),
    KEY idx_category (category_name),
    KEY idx_type (type),
    CONSTRAINT custom_subcategories_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

#### Database Schema Overview

**Tables:**
1. **`users`** - User accounts and authentication
2. **`user_sessions`** - JWT token management (optional)
3. **`cost_entries`** - Main transactions table
4. **`custom_categories`** - User-defined categories
5. **`custom_subcategories`** - User-defined subcategories

**Key Features:**
- **Foreign Key Constraints**: Ensures data integrity with CASCADE deletes
- **Optimized Indexes**: Fast queries on user_id, date, category, type
- **UTF8MB4 Encoding**: Full Unicode support for international characters
- **Auto-increment IDs**: Automatic primary key generation
- **Timestamps**: Automatic created_at and updated_at tracking

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/update-profile` - Update user profile

### Transactions
- `GET /api/transactions` - Get user transactions (with optional filtering)
- `POST /api/transactions/add` - Add new transaction
- `PUT /api/transactions/[id]` - Update transaction
- `DELETE /api/transactions/[id]` - Delete transaction
- `GET /api/transactions/summary` - Get transaction summary
- `GET /api/transactions/chart` - Get chart data

### Categories
- `GET /api/categories` - Get custom categories
- `POST /api/categories` - Add custom category
- `PUT /api/categories` - Update category name
- `DELETE /api/categories` - Delete custom category
- `GET /api/subcategories` - Get subcategories
- `POST /api/subcategories` - Add subcategory
- `PUT /api/subcategories` - Update subcategory name
- `DELETE /api/subcategories` - Delete subcategory

## Getting Started

### Prerequisites

To run this application locally, you need to install the following software:

#### 1. **Node.js** (Required)
- **Version**: Node.js 18.0 or higher
- **Download**: [https://nodejs.org/](https://nodejs.org/)
- **Purpose**: JavaScript runtime for running the Next.js application
- **Verification**: Run `node --version` in terminal

#### 2. **MySQL Database** (Required)
- **Version**: MySQL 8.0 or higher
- **Download Options**:
  - **Windows**: [MySQL Installer](https://dev.mysql.com/downloads/installer/)
  - **macOS**: [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) or use Homebrew: `brew install mysql`
  - **Linux**: `sudo apt-get install mysql-server` (Ubuntu/Debian) or `sudo yum install mysql-server` (CentOS/RHEL)
- **Purpose**: Database for storing user data and transactions
- **Verification**: Run `mysql --version` in terminal

#### 3. **Package Manager** (Required)
Choose one of the following:
- **npm**: Comes with Node.js (recommended)
- **yarn**: Install with `npm install -g yarn`
- **pnpm**: Install with `npm install -g pnpm`
- **bun**: Install from [https://bun.sh/](https://bun.sh/)

#### 4. **Git** (Required for development)
- **Download**: [https://git-scm.com/](https://git-scm.com/)
- **Purpose**: Version control and cloning the repository
- **Verification**: Run `git --version` in terminal

#### 5. **Code Editor** (Recommended)
- **Visual Studio Code**: [https://code.visualstudio.com/](https://code.visualstudio.com/)
- **WebStorm**: [https://www.jetbrains.com/webstorm/](https://www.jetbrains.com/webstorm/)
- **Sublime Text**: [https://www.sublimetext.com/](https://www.sublimetext.com/)

#### 6. **Database Management Tool** (Optional but recommended)
- **MySQL Workbench**: [https://dev.mysql.com/downloads/workbench/](https://dev.mysql.com/downloads/workbench/)
- **phpMyAdmin**: If using XAMPP/WAMP
- **DBeaver**: [https://dbeaver.io/](https://dbeaver.io/)
- **TablePlus**: [https://tableplus.com/](https://tableplus.com/)

### System Requirements

#### **Minimum System Requirements**
- **RAM**: 4GB
- **Storage**: 2GB free space
- **OS**: Windows 10, macOS 10.15, or Linux (Ubuntu 18.04+)

#### **Recommended System Requirements**
- **RAM**: 8GB or more
- **Storage**: 5GB free space
- **OS**: Windows 11, macOS 12+, or Linux (Ubuntu 20.04+)

### Installation Verification

After installing the prerequisites, verify your setup:

```bash
# Check Node.js version (should be 18.0+)
node --version

# Check npm version
npm --version

# Check MySQL version (should be 8.0+)
mysql --version

# Check Git version
git --version
```

### Alternative Setup Options

#### **Using XAMPP (Windows/macOS/Linux)**
If you prefer an all-in-one solution:
1. Download [XAMPP](https://www.apachefriends.org/)
2. Install XAMPP (includes MySQL, Apache, PHP)
3. Start MySQL service from XAMPP Control Panel
4. Use phpMyAdmin (included) for database management

#### **Using Docker (Advanced)**
For containerized development:
```bash
# Run MySQL in Docker
docker run --name mysql-db -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=cost_tracker -p 3306:3306 -d mysql:8.0

# Run the application
npm run dev
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd main-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file (if this repo does not contain it):
   ```env
   JWT_SECRET=your-secret-key-change-this-in-production
   DB_HOST=localhost
   DB_USER=your-mysql-username
   DB_PASSWORD=your-mysql-password
   DB_NAME=cost_tracker
   ```

4. ### **Set up the database**
   For the database use the SQL code displayed in this documentation

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage Guide

### 1. User Registration & Login
- Visit the application and click "Register" to create a new account
- Use your email and password to log in
- The system will redirect you to the main dashboard

### 2. Adding Transactions
- Click the "Add Transaction" button
- Fill in the required fields:
  - **Title**: Transaction name
  - **Amount**: Transaction amount
  - **Type**: Income or Expense
  - **Category**: Select from predefined or custom categories
  - **Date**: Transaction date
  - **Description**: Optional details

### 3. Managing Transactions
- **View**: All transactions are displayed in the main table
- **Edit**: Click the edit icon to modify transaction details
- **Inline Editing**: Double-click category, subcategory, or description cells to edit directly
- **Empty Subcategory Creation**: Double-click empty subcategory cells to create new subcategories
- **Delete**: Click the trash icon to remove a transaction
- **Bulk Delete**: Select multiple transactions and use the bulk delete button

### 4. Filtering & Search
- **Date Range**: Use the date picker to filter by specific periods
- **Type Filter**: Filter by income or expense
- **Category Filter**: Filter by specific categories
- **Text Search**: Search by transaction title or description
- **Clear Filters**: Reset all filters with one click

### 5. Data Export
- **CSV Export**: Click the "CSV Export" button to download transaction data
- **Selective Export**: Select specific transactions for targeted export
- **Filtered Export**: Export only filtered results

### 6. Customization
- **Column Visibility**: Use the "Oszlopok" dropdown to show/hide table columns
- **Theme**: Toggle between light and dark themes (if implemented)

## File Structure

```
main-project/
├── app/
│   ├── api/
│   │   ├── auth/           # Authentication endpoints
│   │   ├── categories/     # Category management
│   │   ├── transactions/   # Transaction CRUD operations
│   │   └── subcategories/  # Subcategory management
│   ├── auth/              # Authentication pages
│   ├── user/              # User profile pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard
├── components/
│   ├── ui/                # Reusable UI components
│   ├── add-transaction-form.tsx
│   ├── transaction-table.tsx
│   ├── chart-area-interactive.tsx
│   └── ...                # Other components
├── lib/
│   ├── db.ts              # Database connection
│   └── utils.ts           # Utility functions
├── database-schema.sql    # Database schema
├── database-migration.sql # Database migrations
└── package.json
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt encryption for passwords
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **CORS Protection**: Configured CORS policies
- **Environment Variables**: Sensitive data stored in environment variables

## Performance Optimizations

- **Database Indexing**: Optimized database queries with proper indexes
- **Client-side Filtering**: Efficient filtering on the frontend
- **Lazy Loading**: Components loaded as needed
- **Responsive Design**: Optimized for various screen sizes
- **Caching**: Strategic caching of frequently accessed data

---

**Version**: 0.1.0  
**Last Updated**: September 2025  
**Technology**: Next.js 15, TypeScript, MySQL, Tailwind CSS
