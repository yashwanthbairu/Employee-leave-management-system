import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { Calendar, Clock, CheckCircle, XCircle, Send, History as HistoryIcon } from 'lucide-react';

// --- DECOUPLED SUB-COMPONENTS ---

const RenderOverview = ({ data, leaveTypes, formData, setFormData, handleSubmit, loading, message, getStatusStyle }) => (
    <div className="animate-fade-in">
        <header style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Employee Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>Quick overview of your status</p>
        </header>

        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
        }}>
            {data.balances.map((lb, i) => (
                <StatCard 
                    key={i}
                    title={lb.leave_name}
                    value={`${lb.total_leaves - lb.used_leaves} Left`}
                    icon={Calendar}
                    color="var(--primary)"
                />
            ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
             <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Send size={20} /> Apply for Leave
                </h2>
                {message && <div style={{ padding: '0.75rem', backgroundColor: message.includes('successfully') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.includes('successfully') ? 'var(--success)' : 'var(--danger)', borderRadius: '0.5rem', marginBottom: '1rem' }}>{message}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <select required value={formData.leave_type_id} onChange={(e) => setFormData({...formData, leave_type_id: e.target.value})} style={{ padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }}>
                        <option value="">Select Type</option>
                        {leaveTypes.map(t => <option key={t.leave_type_id} value={t.leave_type_id}>{t.leave_name}</option>)}
                    </select>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <input type="date" required value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} style={{ padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }} />
                        <input type="date" required value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} style={{ padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }} />
                    </div>
                    <textarea rows="3" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} style={{ padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)', resize: 'none' }} placeholder="Reason"></textarea>
                    <button type="submit" disabled={loading} style={{ backgroundColor: 'var(--primary)', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600 }}>{loading ? 'Submitting...' : 'Apply'}</button>
                </form>
            </div>
            <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Recent Status</h2>
                {data.history[0] ? (
                     <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: getStatusStyle(data.history[0].status).bg, color: getStatusStyle(data.history[0].status).text }}>
                        <strong>{data.history[0].leave_name}</strong>: {data.history[0].status}
                     </div>
                ) : <p style={{ color: 'var(--text-muted)' }}>No recent history</p>}
            </div>
        </div>
    </div>
);

const RenderHistory = ({ data, getStatusStyle }) => (
    <div className="animate-fade-in">
         <header style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>My Leaves</h1>
            <p style={{ color: 'var(--text-muted)' }}>Complete history of your leave applications</p>
        </header>
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>Type</th>
                        <th style={{ padding: '0.75rem' }}>Starts</th>
                        <th style={{ padding: '0.75rem' }}>Ends</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data.history.map((leave, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '1rem' }}>{leave.leave_name}</td>
                            <td style={{ padding: '1rem' }}>{leave.start_date}</td>
                            <td style={{ padding: '1rem' }}>{leave.end_date}</td>
                            <td style={{ padding: '1rem' }}>
                                <span style={{ padding: '0.25rem 0.625rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, ...getStatusStyle(leave.status) }}>{leave.status}</span>
                            </td>
                        </tr>
                    ))}
                    {data.history.length === 0 && (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>You haven't applied for any leaves yet</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const RenderHolidays = ({ holidays }) => (
    <div className="animate-fade-in">
         <header style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Holiday Calendar</h1>
            <p style={{ color: 'var(--text-muted)' }}>Upcoming organization holidays</p>
        </header>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {holidays.map(h => (
                <div key={h.holiday_id} style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontWeight: 700 }}>{h.holiday_name}</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{h.holiday_date}</p>
                    </div>
                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', backgroundColor: 'var(--background)', fontWeight: 600 }}>{h.holiday_type}</span>
                </div>
            ))}
            {holidays.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>No upcoming holidays found</div>
            )}
        </div>
    </div>
);

// --- MAIN DASHBOARD COMPONENT ---

const EmployeeDashboard = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    const [data, setData] = useState({ balances: [], history: [] });
    const [holidays, setHolidays] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [formData, setFormData] = useState({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchDashboardData();
        fetchLeaveTypes();
        fetchHolidays();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await axios.get('/api/employee/dashboard');
            setData(res.data);
        } catch (err) {
            console.error('Error fetching dashboard data', err);
        }
    };

    const fetchLeaveTypes = async () => {
        try {
            const res = await axios.get('/api/employee/leave-types');
            setLeaveTypes(res.data);
        } catch (err) {
            console.error('Error fetching leave types', err);
        }
    };

    const fetchHolidays = async () => {
        try {
            const res = await axios.get('/api/employee/holidays');
            setHolidays(res.data);
        } catch (err) {
            console.error('Error fetching holidays', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await axios.post('/api/employee/apply', formData);
            setMessage('Application submitted successfully!');
            setFormData({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
            fetchDashboardData();
        } catch (err) {
            setMessage(err.response?.data?.error || 'Failed to submit application');
        }
        setLoading(false);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' };
            case 'Rejected': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' };
            default: return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' };
        }
    };

    const renderContent = () => {
        if (currentPath.includes('history')) return <RenderHistory data={data} getStatusStyle={getStatusStyle} />;
        if (currentPath.includes('calendar')) return <RenderHolidays holidays={holidays} />;
        return (
            <RenderOverview 
                data={data} 
                leaveTypes={leaveTypes} 
                formData={formData} 
                setFormData={setFormData} 
                handleSubmit={handleSubmit} 
                loading={loading} 
                message={message} 
                getStatusStyle={getStatusStyle} 
            />
        );
    };

    return (
        <Layout>
            {renderContent()}
        </Layout>
    );
};

export default EmployeeDashboard;
