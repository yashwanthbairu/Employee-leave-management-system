import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { 
    Users, 
    Clock, 
    Check, 
    X, 
    UserCheck, 
    Search, 
    Filter, 
    Plus, 
    Trash2, 
    Calendar, 
    FileText,
    Settings as SettingsIcon,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// --- DECOUPLED SUB-COMPONENTS ---

const OverviewTab = ({ stats, team, holidays, requests }) => (
    <div className="animate-fade-in">
        <header style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Manager Overview</h1>
            <p style={{ color: 'var(--text-muted)' }}>Organization health and quick actions</p>
        </header>

        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
        }}>
            <StatCard title="Global Employees" value={stats.totalEmployees} icon={Users} color="var(--primary)" />
            <StatCard title="Pending Requests" value={stats.pendingLeaves} icon={Clock} color="var(--warning)" />
            <StatCard title="Upcoming Holidays" value={holidays.filter(h => new Date(h.holiday_date) > new Date()).length} icon={Calendar} color="var(--success)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
            <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Org Leave Distribution</h2>
                <div style={{ height: '300px' }}>
                    {stats.leaveDistribution && stats.leaveDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.leaveDistribution.map(d => ({ name: d.status, value: d.count }))}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.leaveDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#f59e0b', '#22c55e', '#ef4444'][index % 3]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data to visualize</div>
                    )}
                </div>
            </div>

            <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Active Team Members</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {team.slice(0, 5).map(member => (
                         <div key={member.employee_id} style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{member.name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.designation}</p>
                         </div>
                    ))}
                    {team.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No direct reports found.</p>}
                </div>
            </div>
        </div>
    </div>
);

const RequestsTab = ({ requests, handleAction }) => (
    <div className="animate-fade-in">
         <header style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Leave Requests</h1>
            <p style={{ color: 'var(--text-muted)' }}>Review and process employee leave applications</p>
        </header>
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>Employee</th>
                        <th style={{ padding: '0.75rem' }}>Type</th>
                        <th style={{ padding: '0.75rem' }}>Dates</th>
                        <th style={{ padding: '0.75rem' }}>Reason</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map((req) => (
                        <tr key={req.leave_id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '1rem', fontWeight: 500 }}>{req.employee_name}</td>
                            <td style={{ padding: '1rem' }}>{req.leave_name}</td>
                            <td style={{ padding: '1rem' }}>{req.start_date} to {req.end_date}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{req.reason}</td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button onClick={() => handleAction(req.leave_id, 'Approved')} style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--success)', color: '#fff', border: 'none' }}><Check size={18} /></button>
                                    <button onClick={() => handleAction(req.leave_id, 'Rejected')} style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--danger)', color: '#fff', border: 'none' }}><X size={18} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {requests.length === 0 && (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No requests to show</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const EmployeesTab = ({ employees, searchQuery, setSearchQuery, setShowAddModal, handleDeleteEmployee }) => {
    const filtered = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
             <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Employee Registry</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Global workforce management</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={18} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)' }} />
                        <input 
                            placeholder="Name or Email..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', width: '200px' }}
                        />
                    </div>
                    <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary)', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius)', border: 'none', fontWeight: 600 }}>
                        <Plus size={20} /> Add
                    </button>
                </div>
            </header>
            <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '0.75rem' }}>Name</th>
                            <th style={{ padding: '0.75rem' }}>Role</th>
                            <th style={{ padding: '0.75rem' }}>Designation</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(emp => (
                            <tr key={emp.employee_id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600 }}>{emp.name}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</p>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ 
                                        padding: '0.25rem 0.5rem', 
                                        borderRadius: '0.25rem', 
                                        fontSize: '0.75rem',
                                        backgroundColor: emp.role === 'Manager' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                        color: emp.role === 'Manager' ? 'var(--primary)' : 'var(--text-muted)'
                                    }}>{emp.role}</span>
                                </td>
                                <td style={{ padding: '1rem' }}>{emp.designation}</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button onClick={() => handleDeleteEmployee(emp.employee_id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
        </div>
    );
};

const HolidaysTab = ({ holidays, setShowHolidayModal }) => (
    <div className="animate-fade-in">
         <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Holidays</h1>
                <p style={{ color: 'var(--text-muted)' }}>Manage organization-wide holidays</p>
            </div>
            <button onClick={() => setShowHolidayModal(true)} style={{ backgroundColor: 'var(--primary)', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                Add Holiday
            </button>
        </header>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {holidays.map(h => (
                <div key={h.holiday_id} style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.5rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', borderRadius: '0.5rem' }}>
                            <Calendar size={18} />
                        </div>
                        <p style={{ fontWeight: 700 }}>{h.holiday_name}</p>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{h.holiday_date}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Type: {h.holiday_type}</p>
                </div>
            ))}
            {holidays.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1/-1' }}>No holidays registered.</p>}
        </div>
    </div>
);

const PolicyTab = ({ leaveTypes, setShowLeaveTypeModal, handleDeleteLeaveType }) => (
    <div className="animate-fade-in">
         <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Leave Policy</h1>
                <p style={{ color: 'var(--text-muted)' }}>Manage leave quotas for all roles</p>
            </div>
            <button onClick={() => setShowLeaveTypeModal(true)} style={{ backgroundColor: 'var(--primary)', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                Add Type
            </button>
        </header>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {leaveTypes.map(lt => (
                <div key={lt.leave_type_id} style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', position: 'relative' }}>
                    <button onClick={() => handleDeleteLeaveType(lt.leave_type_id)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>{lt.leave_name}</h3>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Total Quota:</span>
                            <span style={{ fontWeight: 600 }}>{lt.total_leaves} days</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Annual Limit:</span>
                            <span style={{ fontWeight: 600 }}>{lt.max_leaves_per_year} days</span>
                        </div>
                    </div>
                </div>
            ))}
            {leaveTypes.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1/-1' }}>No leave policies defined.</p>}
        </div>
    </div>
);

// --- MAIN DASHBOARD COMPONENT ---

const ManagerDashboard = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    // --- State Management ---
    const [stats, setStats] = useState({ totalEmployees: 0, pendingLeaves: 0, leaveDistribution: [] });
    const [requests, setRequests] = useState([]);
    const [team, setTeam] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [managers, setManagers] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    
    // UI State
    const [initialLoading, setInitialLoading] = useState(true);
    const [tabLoading, setTabLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showHolidayModal, setShowHolidayModal] = useState(false);
    const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);

    // Form Data
    const [newEmp, setNewEmp] = useState({ 
        name: '', 
        email: '', 
        designation: '', 
        role: 'Employee', 
        phone: '', 
        manager_id: '', 
        joining_date: new Date().toISOString().split('T')[0] 
    });
    const [newHoliday, setNewHoliday] = useState({ holiday_name: '', holiday_date: '', holiday_type: 'Public' });
    const [newLeaveType, setNewLeaveType] = useState({ leave_name: '', total_leaves: 15, max_leaves_per_year: 15 });

    // --- Data Fetching ---

    useEffect(() => {
        const init = async () => {
            await fetchAllData();
            setInitialLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        // Background refresh on tab change without blocking UI
        if (!initialLoading) {
            fetchAllData();
        }
    }, [currentPath]);

    const fetchAllData = async () => {
        try {
            const results = await Promise.allSettled([
                axios.get('/api/manager/pending-requests'),
                axios.get('/api/manager/team'),
                axios.get('/api/manager/stats'),
                axios.get('/api/manager/employees'),
                axios.get('/api/employee/holidays'),
                axios.get('/api/manager/leave-types')
            ]);

            // Map results to state
            if (results[0].status === 'fulfilled') setRequests(results[0].value.data);
            if (results[1].status === 'fulfilled') setTeam(results[1].value.data);
            if (results[2].status === 'fulfilled') setStats(results[2].value.data);
            if (results[3].status === 'fulfilled') {
                setEmployees(results[3].value.data);
                setManagers(results[3].value.data.filter(e => e.role === 'Manager'));
            }
            if (results[4].status === 'fulfilled') setHolidays(results[4].value.data);
            if (results[5].status === 'fulfilled') setLeaveTypes(results[5].value.data);

        } catch (err) {
            console.error('Dashboard refresh failed', err);
        }
    };

    // --- Handlers ---

    const handleAction = async (id, status) => {
        try {
            await axios.post('/api/manager/action', { leave_id: id, status });
            fetchAllData();
        } catch (err) {
            alert('Action failed: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/manager/employees', { 
                ...newEmp, 
                phone: newEmp.phone.trim() || null,
                manager_id: newEmp.manager_id || null 
            });
            setShowAddModal(false);
            setNewEmp({ 
                name: '', 
                email: '', 
                designation: '', 
                role: 'Employee', 
                phone: '', 
                manager_id: '', 
                joining_date: new Date().toISOString().split('T')[0] 
            });
            fetchAllData();
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message;
            if (errorMsg.includes('UNIQUE constraint failed: Employee.email')) {
                alert('Registration failed: Email already exists.');
            } else if (errorMsg.includes('UNIQUE constraint failed: Employee.phone')) {
                alert('Registration failed: Phone number already belongs to another user.');
            } else {
                alert('Failed to add employee: ' + errorMsg);
            }
        }
    };

    const handleDeleteEmployee = async (id) => {
        if (!window.confirm('Delete this employee and all their balances?')) return;
        try {
            await axios.delete(`/api/manager/employees/${id}`);
            fetchAllData();
        } catch (err) {
            alert('Failed to delete: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleAddHoliday = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/manager/holidays', newHoliday);
            setShowHolidayModal(false);
            setNewHoliday({ holiday_name: '', holiday_date: '', holiday_type: 'Public' });
            fetchAllData();
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleAddLeaveType = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/manager/leave-types', newLeaveType);
            setShowLeaveTypeModal(false);
            setNewLeaveType({ leave_name: '', total_leaves: 15, max_leaves_per_year: 15 });
            fetchAllData();
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDeleteLeaveType = async (id) => {
        if (!window.confirm('Delete this leave type for ALL employees?')) return;
        try {
            await axios.delete(`/api/manager/leave-types/${id}`);
            fetchAllData();
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.error || err.message));
        }
    };

    if (initialLoading) {
        return (
            <Layout>
                <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                    <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
                    <p>Initializing Manager Portal...</p>
                </div>
            </Layout>
        );
    }

    const renderContent = () => {
        if (currentPath.includes('requests')) return <RequestsTab requests={requests} handleAction={handleAction} />;
        if (currentPath.includes('employees')) return <EmployeesTab employees={employees} searchQuery={searchQuery} setSearchQuery={setSearchQuery} setShowAddModal={setShowAddModal} handleDeleteEmployee={handleDeleteEmployee} />;
        if (currentPath.includes('holidays')) return <HolidaysTab holidays={holidays} setShowHolidayModal={setShowHolidayModal} />;
        if (currentPath.includes('settings')) return <PolicyTab leaveTypes={leaveTypes} setShowLeaveTypeModal={setShowLeaveTypeModal} handleDeleteLeaveType={handleDeleteLeaveType} />;
        return <OverviewTab stats={stats} team={team} holidays={holidays} requests={requests} />;
    };

    return (
        <Layout>
            {renderContent()}

            {/* Modals --- Same as before but with better state handling --- */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1000 }}>
                    <div className="glass" style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px', border: '1px solid var(--border)' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Add New User</h2>
                        <form onSubmit={handleAddEmployee} style={{ display: 'grid', gap: '1rem' }}>
                            <input placeholder="Full Name" required value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }} />
                            <input placeholder="Email" required type="email" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }} />
                            <input placeholder="Phone (Optional)" type="text" value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }} />
                            <input placeholder="Designation" required value={newEmp.designation} onChange={e => setNewEmp({...newEmp, designation: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }} />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <select value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }}>
                                    <option value="Employee">Role: Employee</option>
                                    <option value="Manager">Role: Manager</option>
                                </select>
                                <select value={newEmp.manager_id} onChange={e => setNewEmp({...newEmp, manager_id: e.target.value})} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }}>
                                    <option value="">Reports To: None</option>
                                    {managers.map(m => <option key={m.employee_id} value={m.employee_id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" style={{ flex: 1, padding: '0.75rem', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600 }}>Register</button>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ... Other modals (Holidays, LeaveType) same structure as before ... */}
            {showHolidayModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1000 }}>
                    <div className="glass" style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', border: '1px solid var(--border)' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Add Holiday</h2>
                        <form onSubmit={handleAddHoliday} style={{ display: 'grid', gap: '1rem' }}>
                            <input placeholder="Holiday Name" required value={newHoliday.holiday_name} onChange={e => setNewHoliday({...newHoliday, holiday_name: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }} />
                            <input type="date" required value={newHoliday.holiday_date} onChange={e => setNewHoliday({...newHoliday, holiday_date: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }} />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" style={{ flex: 1, padding: '0.75rem', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600 }}>Save</button>
                                <button type="button" onClick={() => setShowHolidayModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showLeaveTypeModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1000 }}>
                    <div className="glass" style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', border: '1px solid var(--border)' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Add Leave Type</h2>
                        <form onSubmit={handleAddLeaveType} style={{ display: 'grid', gap: '1rem' }}>
                            <input placeholder="Leave Name" required value={newLeaveType.leave_name} onChange={e => setNewLeaveType({...newLeaveType, leave_name: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }} />
                            <input placeholder="Total Quota" type="number" required value={newLeaveType.total_leaves} onChange={e => setNewLeaveType({...newLeaveType, total_leaves: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }} />
                            <input placeholder="Max Per Year" type="number" required value={newLeaveType.max_leaves_per_year} onChange={e => setNewLeaveType({...newLeaveType, max_leaves_per_year: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }} />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" style={{ flex: 1, padding: '0.75rem', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600 }}>Save</button>
                                <button type="button" onClick={() => setShowLeaveTypeModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ManagerDashboard;
