import React from 'react';

const StatCard = ({ title, value, icon: Icon, color }) => {
    return (
        <div className="animate-fade-in" style={{
            backgroundColor: 'var(--card-bg)',
            padding: '1.5rem',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            border: '1px solid var(--border)'
        }}>
            <div style={{
                backgroundColor: `${color}15`,
                color: color,
                padding: '0.75rem',
                borderRadius: '0.5rem',
                display: 'flex'
            }}>
                <Icon size={24} />
            </div>
            <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</h3>
            </div>
        </div>
    );
};

export default StatCard;
