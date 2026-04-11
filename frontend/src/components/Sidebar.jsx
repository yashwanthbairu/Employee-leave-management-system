import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Clock,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    
    const menuItems = {
        Employee: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/employee' },
            { icon: FileText, label: 'My Leaves', path: '/employee/history' },
            { icon: Calendar, label: 'Holiday Calendar', path: '/employee/calendar' },
            { icon: User, label: 'Profile', path: '/profile' },
        ],
        Manager: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/manager' },
            { icon: Clock, label: 'Leave Requests', path: '/manager/requests' },
            { icon: Users, label: 'Employees', path: '/manager/employees' },
            { icon: Calendar, label: 'Holidays', path: '/manager/holidays' },
            { icon: Settings, label: 'Leave Policy', path: '/manager/settings' },
            { icon: User, label: 'Profile', path: '/profile' },
        ],
    };

    const getMenu = () => {
        if (!user) return [];
        if (user.role === 'Manager' || user.role === 'Admin') return menuItems.Manager;
        return menuItems.Employee;
    };

    const currentMenu = getMenu();

    return (
        <aside className="sidebar" style={{
            width: '260px',
            height: '100vh',
            backgroundColor: 'var(--sidebar-bg)',
            color: 'var(--sidebar-text)',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
            borderRight: '1px solid var(--border)',
            zIndex: 100
        }}>
            <div className="sidebar-header" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em' }}>LMS Pro</h2>
                <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>Manager Portal</p>
            </div>

            <nav style={{ flex: 1 }}>
                <ul style={{ display: 'grid', gap: '0.5rem' }}>
                    {currentMenu.map((item) => (
                        <li key={item.path}>
                            <NavLink 
                                to={item.path} 
                                end
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius)',
                                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                                    transition: 'var(--transition)'
                                })}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name}</p>
                    <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{user?.designation}</p>
                </div>
                <button 
                    onClick={logout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                        border: 'none',
                        textAlign: 'left'
                    }}
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
