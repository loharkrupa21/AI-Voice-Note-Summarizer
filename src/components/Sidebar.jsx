import { 
  LayoutDashboard, 
  Mic, 
  History, 
  User, 
  LogOut
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, onLogout, notesCount = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-note', label: 'New Note', icon: Mic },
    { id: 'history', label: 'History', icon: History, badge: notesCount },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'logout', label: 'Logout', icon: LogOut, isAction: true },
  ];

  const handleNavClick = (item) => {
    if (item.isAction && item.id === 'logout') {
      if (onLogout) onLogout();
    } else {
      setCurrentView(item.id);
    }
  };

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand" onClick={() => setCurrentView('dashboard')}>
        <div className="brand-logo-glow">
          <div className="brand-logo-circle">
            <Mic className="brand-mic-icon" size={24} />
          </div>
        </div>
        <div className="brand-text-wrap">
          <div className="brand-title" style={{ fontSize: '15px', fontWeight: '700', lineHeight: '1.25' }}>
            <span style={{ color: '#1E293B' }}>AI Voice Note</span><br />
            <span style={{ color: '#7C3AED' }}>Summarizer</span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || 
            (item.id === 'new-note' && ['record', 'upload', 'audio-player', 'processing', 'transcript', 'summary', 'summary-transcript'].includes(currentView)) ||
            (item.id === 'history' && currentView === 'saved-notes');

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`sidebar-nav-btn ${isActive ? 'active' : ''} ${item.id === 'logout' ? 'logout-item' : ''}`}
            >
              <span className="nav-icon-wrap">
                <Icon size={19} />
              </span>
              <span className="nav-label">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Glowing 3D Microphone Illustration from 1.jpg */}
      <div className="sidebar-bottom-illustration">
        <div className="mic-orb-stage">
          <div className="mic-glow-backdrop"></div>
          
          {/* Sound waves left */}
          <div className="wave-bars-group wave-left">
            <span className="wbar bar-1"></span>
            <span className="wbar bar-2"></span>
            <span className="wbar bar-3"></span>
          </div>

          {/* 3D Glowing Mic Orb */}
          <div className="mic-3d-orb">
            <div className="orb-glass-inner">
              <Mic size={34} className="mic-inner-svg" />
            </div>
            <div className="orb-ring-halo"></div>
            <div className="orb-pedestal"></div>
          </div>

          {/* Sound waves right */}
          <div className="wave-bars-group wave-right">
            <span className="wbar bar-3"></span>
            <span className="wbar bar-2"></span>
            <span className="wbar bar-1"></span>
          </div>
        </div>

        {/* Tagline matching 1.jpg */}
        <div className="sidebar-tagline">
          <span>Speak</span>
          <span className="dot">•</span>
          <span>Summarize</span>
          <span className="dot">•</span>
          <span>Save</span>
        </div>
      </div>
    </aside>
  );
}
