const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// GET EMPLOYEE DASHBOARD DATA (Balance and History)
router.get('/dashboard', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    // Fetch basic details, leave balance, and recent history
    const data = {};

    db.all(`SELECT lt.leave_name, lb.used_leaves, lt.total_leaves 
            FROM Leave_Balance lb
            JOIN Leave_Type lt ON lb.leave_type_id = lt.leave_type_id
            WHERE lb.employee_id = ?`, [userId], (err, balances) => {
        if (err) return res.status(500).json({ error: err.message });
        data.balances = balances;

        db.all(`SELECT la.*, lt.leave_name 
                FROM Leave_Application la
                JOIN Leave_Type lt ON la.leave_type_id = lt.leave_type_id
                WHERE la.employee_id = ?
                ORDER BY la.applied_on DESC`, [userId], (err, history) => {
            if (err) return res.status(500).json({ error: err.message });
            data.history = history;
            res.json(data);
        });
    });
});

const { calculateWorkingDays } = require('../utils/dateUtils');

// APPLY FOR LEAVE
router.post('/apply', authenticateToken, (req, res) => {
    const { leave_type_id, start_date, end_date, reason } = req.body;
    const employee_id = req.user.id;
    const applied_on = new Date().toISOString().split('T')[0];

    if (!leave_type_id || !start_date || !end_date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (new Date(start_date) > new Date(end_date)) {
        return res.status(400).json({ error: 'Start date cannot be after end date' });
    }

    // 1. Fetch holidays for calculation
    db.all('SELECT holiday_date FROM Holiday_Master', [], (err, holidays) => {
        const holidayDates = holidays.map(h => h.holiday_date);
        const requestedWorkingDays = calculateWorkingDays(start_date, end_date, holidayDates);

        if (requestedWorkingDays === 0) {
            return res.status(400).json({ error: 'Selected dates consist only of weekends or holidays' });
        }

        // 2. Check for overlapping dates
        const overlapQuery = `
            SELECT * FROM Leave_Application 
            WHERE employee_id = ? AND status IN ('Pending', 'Approved')
            AND (
                (start_date <= ? AND end_date >= ?) -- New leave is inside existing
                OR (start_date <= ? AND end_date >= ?) -- Existing leave is inside new
                OR (start_date BETWEEN ? AND ?) -- New start is during existing
                OR (end_date BETWEEN ? AND ?) -- New end is during existing
            )
        `;

        db.get(overlapQuery, [employee_id, start_date, end_date, end_date, start_date, start_date, end_date, start_date, end_date], (err, overlap) => {
            if (err) return res.status(500).json({ error: err.message });
            if (overlap) return res.status(400).json({ error: 'You already have a leave request for these dates' });

            // 3. Check balance
            const balanceQuery = `
                SELECT lb.used_leaves, lt.total_leaves 
                FROM Leave_Balance lb
                JOIN Leave_Type lt ON lb.leave_type_id = lt.leave_type_id
                WHERE lb.employee_id = ? AND lb.leave_type_id = ?
            `;

            db.get(balanceQuery, [employee_id, leave_type_id], (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!row) return res.status(404).json({ error: 'Leave type not found for this employee' });

                if (row.total_leaves - row.used_leaves < requestedWorkingDays) {
                    return res.status(400).json({ error: `Insufficient leave balance. Working days requested: ${requestedWorkingDays}, Available: ${row.total_leaves - row.used_leaves}` });
                }

                // 4. Insert Application
                const insertQuery = `INSERT INTO Leave_Application (employee_id, leave_type_id, start_date, end_date, reason, applied_on, status)
                                     VALUES (?, ?, ?, ?, ?, ?, 'Pending')`;
                
                db.run(insertQuery, [employee_id, leave_type_id, start_date, end_date, reason, applied_on], function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: `Leave application submitted successfully (${requestedWorkingDays} working days)`, id: this.lastID });
                });
            });
        });
    });
});

// GET HOLIDAYS
router.get('/holidays', (req, res) => {
    db.all('SELECT * FROM Holiday_Master ORDER BY holiday_date ASC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET LEAVE TYPES
router.get('/leave-types', (req, res) => {
    db.all('SELECT * FROM Leave_Type', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
