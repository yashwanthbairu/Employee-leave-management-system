const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const schemaPath = path.resolve(__dirname, 'schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON;', (err) => {
            if(err) console.error("Pragma error:", err);
            else initDb();
        });
    }
});

function initDb() {
    console.log('Initializing database from schema...');
    
    fs.readFile(schemaPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading schema.sql', err);
            return;
        }

        db.exec(data, async (err) => {
            if (err) {
                console.error('Error executing schema', err);
            } else {
                console.log('Schema executed successfully.');
                // Auto-migrate roles
                db.run("UPDATE Employee SET role = 'Manager' WHERE role = 'Admin'", async (err) => {
                    if (err) console.error('Migration error', err);
                    await seedData();
                });
            }
        });
    });
}

// Check if admin exists, if not seed initial admin and data
async function seedData() {
    db.get("SELECT COUNT(*) as count FROM Employee", async (err, row) => {
        if (!err && row && row.count === 0) {
            console.log("Seeding initial data...");
            const pwd = await bcrypt.hash('admin123', 10);
            const managerPwd = await bcrypt.hash('manager123', 10);
            
            db.serialize(() => {
                // Insert Initial Manager (System Manager)
                db.run(`INSERT INTO Employee (name, email, phone, designation, joining_date, password, role) 
                        VALUES ('System Manager', 'manager-system@lms.com', '1234567890', 'System Manager', date('now'), ?, 'Manager')`, [pwd]);
                
                // Insert Team Manager
                db.run(`INSERT INTO Employee (name, email, phone, designation, joining_date, manager_id, password, role) 
                        VALUES ('John Manager', 'manager@lms.com', '0987654321', 'Team Lead', date('now'), 1, ?, 'Manager')`, [managerPwd]);
                
                // Insert Leave Types
                db.run(`INSERT INTO Leave_Type (leave_name, total_leaves, max_leaves_per_year) VALUES ('Sick Leave', 12, 12)`);
                db.run(`INSERT INTO Leave_Type (leave_name, total_leaves, max_leaves_per_year) VALUES ('Casual Leave', 15, 15)`);
                db.run(`INSERT INTO Leave_Type (leave_name, total_leaves, max_leaves_per_year) VALUES ('Privilege Leave', 20, 20)`);
                
                // Insert Holidays
                db.run(`INSERT INTO Holiday_Master (holiday_name, holiday_date, holiday_type) VALUES ('New Year', '2025-01-01', 'Public')`);
                db.run(`INSERT INTO Holiday_Master (holiday_name, holiday_date, holiday_type) VALUES ('Christmas', '2025-12-25', 'Public')`);
                
                // NEW: Insert a Reporting Employee for John Manager (ID 2)
                db.run(`INSERT INTO Employee (name, email, phone, designation, joining_date, manager_id, password, role) 
                        VALUES ('Bob Reporter', 'bob@lms.com', '5551234567', 'Developer', date('now'), 2, ?, 'Employee')`, [pwd], function(err) {
                    if (!err) {
                        const bobId = this.lastID;
                        // Seed balance for Bob
                        db.run(`INSERT INTO Leave_Balance (employee_id, leave_type_id, used_leaves) VALUES (?, 1, 0)`, [bobId]);
                        // Seed a pending request for Bob
                        db.run(`INSERT INTO Leave_Application (employee_id, leave_type_id, start_date, end_date, status, reason, applied_on)
                                VALUES (?, 1, '2025-06-01', '2025-06-05', 'Pending', 'Vacation', date('now'))`, [bobId]);
                    }
                });
                
                console.log("Initial seed data inserted.");
            });
        }
    });
}

module.exports = db;
