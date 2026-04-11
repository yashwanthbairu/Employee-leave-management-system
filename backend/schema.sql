-- Employee Leave Management System Database Schema
-- Standard SQL format compatible with MySQL & SQLite

CREATE TABLE IF NOT EXISTS Employee (
    employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    designation TEXT,
    joining_date DATE,
    manager_id INTEGER,
    password TEXT NOT NULL,
    role TEXT CHECK( role IN ('Manager', 'Employee') ) DEFAULT 'Employee',
    FOREIGN KEY (manager_id) REFERENCES Employee(employee_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Leave_Type (
    leave_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
    leave_name TEXT NOT NULL,
    total_leaves INTEGER DEFAULT 0 CHECK (total_leaves >= 0),
    max_leaves_per_year INTEGER DEFAULT 0 CHECK (max_leaves_per_year >= 0)
);

CREATE TABLE IF NOT EXISTS Leave_Balance (
    balance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    leave_type_id INTEGER,
    used_leaves INTEGER DEFAULT 0,
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES Leave_Type(leave_type_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Leave_Application (
    leave_id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    leave_type_id INTEGER,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT CHECK( status IN ('Pending', 'Approved', 'Rejected') ) DEFAULT 'Pending',
    reason TEXT,
    applied_on DATE NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES Leave_Type(leave_type_id) ON DELETE CASCADE,
    CHECK (start_date <= end_date),
    CHECK (applied_on <= start_date)
);

CREATE TABLE IF NOT EXISTS Holiday_Master (
    holiday_id INTEGER PRIMARY KEY AUTOINCREMENT,
    holiday_name TEXT NOT NULL,
    holiday_date DATE UNIQUE NOT NULL,
    holiday_type TEXT
);

-- Note: In SQLite, foreign key constraints are disabled by default. 
-- Ensure `PRAGMA foreign_keys = ON;` is executed per connection!

-- Trigger to auto-update leave balance when a leave is approved
CREATE TRIGGER IF NOT EXISTS update_leave_balance_on_approve
AFTER UPDATE ON Leave_Application
FOR EACH ROW
WHEN NEW.status = 'Approved' AND OLD.status != 'Approved'
BEGIN
    UPDATE Leave_Balance
    SET used_leaves = used_leaves + (
        SELECT CAST(julianday(NEW.end_date) - julianday(NEW.start_date) + 1 AS INTEGER)
    )
    WHERE employee_id = NEW.employee_id AND leave_type_id = NEW.leave_type_id;
END;
