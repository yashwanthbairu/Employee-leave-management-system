const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const holidays = [
    { name: 'Republic Day', date: '2026-01-26', type: 'Public' },
    { name: 'Holi', date: '2026-03-04', type: 'Public' },
    { name: 'Independence Day', date: '2026-08-15', type: 'Public' },
    { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'Public' },
    { name: 'Diwali', date: '2026-11-08', type: 'Public' }
];

const applications = [
    // employee_id, leave_type_id, start_date, end_date, status, reason, applied_on
    [12, 1, '2026-04-01', '2026-04-03', 'Approved', 'Fever and cold', '2026-03-28'],
    [12, 2, '2026-04-15', '2026-04-16', 'Pending', 'Personal work', '2026-04-10'],
    [13, 3, '2026-04-10', '2026-04-20', 'Rejected', 'Trip with family', '2026-03-15'],
    [14, 1, '2026-04-18', '2026-04-20', 'Pending', 'Medical checkup', '2026-04-12'],
    [15, 2, '2026-04-05', '2026-04-05', 'Approved', 'Sister wedding', '2026-03-25'],
    [16, 4, '2026-05-01', '2026-05-30', 'Pending', 'Expectant mother care', '2026-04-01'],
    [17, 1, '2026-04-11', '2026-04-12', 'Pending', 'Not feeling well', '2026-04-10']
];

db.serialize(() => {
    console.log("Starting data seeding...");

    // 1. Insert Holidays
    const holidayStmt = db.prepare("INSERT OR IGNORE INTO Holiday_Master (holiday_name, holiday_date, holiday_type) VALUES (?, ?, ?)");
    holidays.forEach(h => holidayStmt.run(h.name, h.date, h.type));
    holidayStmt.finalize();
    console.log("Holidays seeded.");

    // 2. Ensure all employees have full balances
    db.all("SELECT employee_id FROM Employee", [], (err, employees) => {
        if (err) return console.error(err);
        
        db.all("SELECT leave_type_id FROM Leave_Type", [], (err, types) => {
            if (err) return console.error(err);

            const balanceStmt = db.prepare("INSERT OR IGNORE INTO Leave_Balance (employee_id, leave_type_id, used_leaves) VALUES (?, ?, 0)");
            employees.forEach(emp => {
                types.forEach(type => {
                    balanceStmt.run(emp.employee_id, type.leave_type_id);
                });
            });
            balanceStmt.finalize();
            console.log(`Balances checked/seeded for ${employees.length} employees.`);

            // 3. Insert Sample Applications
            const appStmt = db.prepare("INSERT INTO Leave_Application (employee_id, leave_type_id, start_date, end_date, status, reason, applied_on) VALUES (?, ?, ?, ?, ?, ?, ?)");
            applications.forEach(app => appStmt.run(app));
            appStmt.finalize();
            console.log("Sample leave applications seeded.");

            console.log("Data seeding completed successfully!");
            db.close();
        });
    });
});
