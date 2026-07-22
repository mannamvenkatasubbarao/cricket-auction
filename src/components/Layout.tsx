import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Gavel, Shield, Settings, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';

const Layout: React.FC = () => {
  const { logout } = useStore();
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Teams', path: '/teams', icon: <Shield size={20} /> },
    { name: 'Players', path: '/players', icon: <Users size={20} /> },
    { name: 'Auction', path: '/auction', icon: <Gavel size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-accent), #fcd34d)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gavel size={24} color="#000" />
          </div>
          <div>
            <h2 className="brand-font" style={{ fontSize: '1.25rem', margin: 0, background: 'linear-gradient(to right, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AuctionPro
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--gold-accent)', letterSpacing: 1 }}>MANAGEMENT</div>
          </div>
        </div>
        <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={(navData) => `nav-item ${navData.isActive ? 'active' : ''}`}
            >
              <div className="nav-icon">
                {item.icon}
              </div>
              <span className="nav-text">{item.name}</span>
            </NavLink>
          ))}
        </nav>
        
        <div style={{ padding: '1rem', marginTop: 'auto', borderTop: '1px solid var(--glass-border)' }}>
          <button 
            onClick={logout}
            className="nav-item"
            style={{ 
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', 
              padding: '0.75rem 1rem', borderRadius: '8px', 
              color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            <div style={{ color: 'inherit' }}><LogOut size={20} /></div>
            <span style={{ fontWeight: 500, fontSize: '1rem' }}>Logout</span>
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
