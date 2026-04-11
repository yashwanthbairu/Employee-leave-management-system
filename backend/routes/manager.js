const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { calculateWorkingDays } = require('../utils/dateUtils');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const authenticateManager = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err || (user.role !== 'Manager' && user.role !== 'Admin')) {
            return res.status(403).json({ error: 'Manager access required' });
        }
        req.user = user;
        next();
    });
};

// --- LEAVE MANAGEMENT ---

// GET PENDING LEAVES (Global or Team)
router.get('/pending-requests', authenticateManager, (req, res) => {
    // In the new system, Managers can see ALL pending requests to manage the org
    const query = `
        SELECT la.*, e.name as employee_name, lt.leave_name 
        FROM Leave_Application la
        JOIN Employee e ON la.employee_id = e.employee_id
        JOIN Leave_Type lt ON la.leave_type_id = lt.leave_type_id
        WHERE la.status = 'Pending'
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// APPROVE OR REJECT LEAVE
router.post('/action', authenticateManager, (req, res) => {
    const { leave_id, status } = req.body;
    
    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const detailsQuery = `SELECT * FROM Leave_Application WHERE leave_id = ?`;

    db.get(detailsQuery, [leave_id], (err, leave) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!leave) return res.status(404).json({ error: 'Leave request not found' });
        if (leave.status !== 'Pending') return res.status(400).json({ error: 'Leave already processed' });

        if (status === 'Rejected') {
            db.run('UPDATE Leave_Application SET status = "Rejected" WHERE leave_id = ?', [leave_id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Leave rejected successfully' });
            });
        } else {
            db.all('SELECT holiday_date FROM Holiday_Master', [], (err, holidays) => {
                const holidayDates = holidays.map(h => h.holiday_date);
                const workingDays = calculateWorkingDays(leave.start_date, leave.end_date, holidayDates);

                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');
                    db.run('UPDATE Leave_Application SET status = "Approved" WHERE leave_id = ?', [leave_id]);
                    db.run('UPDATE Leave_Balance SET used_leaves = used_leaves + ? WHERE employee_id = ? AND leave_type_id = ?', 
                           [workingDays, leave.employee_id, leave.leave_type_id]);
                    db.run('COMMIT', (err) => {
                        if (err) return res.status(500).json({ error: 'Transaction failed' });
                        res.json({ message: `Leave approved successfully (${workingDays} working days deducted)` });
                    });
                });
            });
        }
    });
});

// --- EMPLOYEE MANAGEMENT ---

router.get('/employees', authenticateManager, (req, res) => {
    db.all('SELECT employee_id, name, email, phone, designation, joining_date, manager_id, role FROM Employee', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/employees', authenticateManager, async (req, res) => {
    let { name, email, phone, designation, joining_date, manager_id, password, role } = req.body;
    
    // Normalize empty strings to null for optional/unique fields
    phone = phone && phone.trim() !== '' ? phone.trim() : null;
    manager_id = manager_id && manager_id !== '' ? manager_id : null;
    joining_date = joining_date || new Date().toISOString().split('T')[0];

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    const query = `INSERT INTO Employee (name, email, phone, designation, joining_date, manager_id, password, role)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [name, email, phone, designation, joining_date, manager_id, hashedPassword, role || 'Employee'], function(err) {
        if (err) {
            console.error('Add employee error:', err);
            return res.status(500).json({ error: err.message });
        }
        const newEmpId = this.lastID;
        
        db.all('SELECT leave_type_id FROM Leave_Type', [], (err, types) => {
            if (!err) {
                types.forEach(type => {
                    db.run('INSERT INTO Leave_Balance (employee_id, leave_type_id, used_leaves) VALUES (?, ?, 0)', [newEmpId, type.leave_type_id]);
                });
            }
        });
        res.json({ message: 'Employee added successfully', id: newEmpId });
    });
});

router.delete('/employees/:id', authenticateManager, (req, res) => {
    db.run('DELETE FROM Employee WHERE employee_id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Employee deleted successfully' });
    });
});

// --- MANAGER ACTIONS ---

router.get('/stats', authenticateManager, (req, res) => {
    const stats = {};
    db.get('SELECT COUNT(*) as count FROM Employee', (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalEmployees = row.count || 0;
        
        db.get('SELECT COUNT(*) as count FROM Leave_Application WHERE status = "Pending"', (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.pendingLeaves = row.count || 0;
            
            db.all('SELECT status, COUNT(*) as count FROM Leave_Application GROUP BY status', (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.leaveDistribution = rows;
                res.json(stats);
            });
        });
    });
});

router.post('/holidays', authenticateManager, (req, res) => {
    const { holiday_name, holiday_date, holiday_type } = req.body;
    db.run('INSERT INTO Holiday_Master (holiday_name, holiday_date, holiday_type) VALUES (?, ?, ?)', 
        [holiday_name, holiday_date, holiday_type], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Holiday added successfully', id: this.lastID });
        }
    );
});

router.get('/leave-types', authenticateManager, (req, res) => {
    db.all('SELECT * FROM Leave_Type', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/leave-types', authenticateManager, (req, res) => {
    const { leave_name, total_leaves, max_leaves_per_year } = req.body;
    db.run('INSERT INTO Leave_Type (leave_name, total_leaves, max_leaves_per_year) VALUES (?, ?, ?)',
        [leave_name, total_leaves, max_leaves_per_year], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            const newTypeId = this.lastID;
            db.all('SELECT employee_id FROM Employee', [], (err, employees) => {
                if (!err) {
                    employees.forEach(emp => {
                        db.run('INSERT INTO Leave_Balance (employee_id, leave_type_id, used_leaves) VALUES (?, ?, 0)', [emp.employee_id, newTypeId]);
                    });
                }
            });
            res.json({ message: 'Leave type added successfully', id: newTypeId });
        }
    );
});

router.delete('/leave-types/:id', authenticateManager, (req, res) => {
    db.run('DELETE FROM Leave_Type WHERE leave_type_id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Leave type deleted successfully' });
    });
});

// GET TEAM MEMBERS (Self-filtering if needed, but for now global is fine in small LMS)
router.get('/team', authenticateManager, (req, res) => {
    const managerId = req.user.id;
    db.all('SELECT employee_id, name, email, designation, joining_date FROM Employee WHERE manager_id = ?', [managerId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
