import React, { useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { User, Lock, Phone, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        phone: user?.phone || '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password && formData.password !== formData.confirmPassword) {
            return setMessage({ type: 'danger', text: 'Passwords do not match' });
        }

        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await axios.post('/api/auth/update-profile', {
                phone: formData.phone,
                password: formData.password || undefined
            });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setFormData({ ...formData, password: '', confirmPassword: '' });
        } catch (err) {
            setMessage({ type: 'danger', text: err.response?.data?.error || 'Update failed' });
        }
        setLoading(false);
    };

    return (
        <Layout>
            <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
                <header style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Profile Settings</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Update your personal information and security</p>
                </header>

                <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--primary)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
                            {user?.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user?.name}</h2>
                            <p style={{ color: 'var(--text-muted)' }}>{user?.designation} • {user?.role}</p>
                            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{user?.email}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                        {message.text && (
                            <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.type === 'success' ? 'var(--success)' : 'var(--danger)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={18} /> {message.text}
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Phone size={16} /> Phone Number
                            </label>
                            <input 
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }}
                                placeholder="Enter phone number"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Lock size={16} /> New Password
                                </label>
                                <input 
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }}
                                    placeholder="Leave blank to keep current"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Confirm Password</label>
                                <input 
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }}
                                    placeholder="Repeat new password"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: 'var(--primary)', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, marginTop: '1rem' }}
                        >
                            <Save size={18} /> {loading ? 'Updating...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
