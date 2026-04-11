# Employee Leave Management System (LMS)

A full-stack project built with React, Node.js, and SQLite.

## Features
- **Role-based Dashboards**: Employee and Manager (Administrative).
- **Leave Operations**: Apply for leave, view balance, and status tracking.
- **Consolidated Management**: Managers handle employee records, holidays, and leave policies.
- **Smart Logic**: Automatic deduction of working days (excludes weekends and public holidays).
- **Database Logic**: Triggers for auto-updating balances and schema constraints.

## Project Structure
- `/backend`: Node.js + Express + SQLite
- `/frontend`: React + Vite + Lucide Icons + Recharts

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
node app.js
```
The backend initializes the database and seeds it with demo data automatically.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to view the app. (Requests are proxied to port 5001).

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Manager** | manager-admin@lms.com | admin123 |
| **Employee** | john@example.com | password123 |

*Note: The System Manager has full administrative control over employees and holidays.*

---

## Database Schema (Lab Requirements)
See `backend/schema.sql` for the full DDL including:
- Primary/Foreign Key constraints
- `ON DELETE CASCADE` relationships
- `CHECK` constraints (date validation)
- `TRIGGER` for auto-subtracting leaves on approval
