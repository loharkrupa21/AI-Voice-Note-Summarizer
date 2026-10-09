import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, User, Settings, LogOut, Sparkles } from 'lucide-react';

export default function Header({ 
  user = { name: "Krupa Lohar", email: "krupa@voicemind.ai" }, 
  onLogout, 
  onOpenProfile, 
  notifications = [] 
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(notifications.length || 2);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const defaultNotifications = [
    {
      id: 1,
      title: "AI Summary Ready",
      time: "10m ago",
      desc: "Summary for 'College Notes' generated with 98% accuracy.",
      type: "success"
    },
    {
      id: 2,
      title: "Audio Transcribed",
      time: "1h ago",
      desc: "Project Discussion (4:12) successfully converted to text.",
      type: "info"
    }
  ];

  const activeNotifs = notifications.length > 0 ? notifications : defaultNotifications;

  return (
    <header className="app-top-header">
      {/* Decorative gradient aura top-right */}
      <div className="header-atmosphere-glow"></div>

      {/* Greeting info */}
      <div className="header-greeting-section">
        <h1 className="header-greeting-title">
          Hello, {user?.name?.split(' ')[0] || 'Krupa'}! <span className="wave-hand">👋</span>
        </h1>
        <p className="header-greeting-subtitle">
          Turn your voice notes into smart summaries with AI.
        </p>
      </div>

      {/* Actions: Notifications & User Profile */}
      <div className="header-right-actions">
        {/* Notification Bell */}
        <div className="relative-action-container" ref={notifRef}>
          <button 
            className="header-icon-btn notif-bell-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
              setUnreadCount(0);
            }}
            title="Notifications"
          >
            <Bell size={20} className="header-bell-icon" />
            {unreadCount > 0 && <span className="notification-badge-dot"></span>}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="dropdown-panel notifications-dropdown">
              <div className="dropdown-header">
                <h3>Notifications</h3>
                <span className="notif-count-pill">{activeNotifs.length} new</span>
              </div>
              <div className="notif-list">
                {activeNotifs.map((n) => (
                  <div key={n.id} className="notif-item">
                    <div className="notif-icon-circle">
                      <Sparkles size={14} />
                    </div>
                    <div className="notif-body">
                      <div className="notif-row">
                        <span className="notif-title">{n.title}</span>
                        <span className="notif-time">{n.time}</span>
                      </div>
                      <p className="notif-desc">{n.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Menu */}
        <div className="relative-action-container" ref={profileRef}>
          <button 
            className="user-profile-btn"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
          >
            <div className="user-avatar-circle">
              <span>{user?.name?.charAt(0) || 'K'}</span>
            </div>
            <span className="user-name-text">{user?.name || 'Krupa Lohar'}</span>
            <ChevronDown size={16} className={`user-chevron ${showProfileMenu ? 'open' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="dropdown-panel profile-dropdown">
              <div className="profile-dropdown-user">
                <div className="profile-avatar-lg">
                  {user?.name?.charAt(0) || 'K'}
                </div>
                <div className="profile-info-wrap">
                  <span className="profile-name">{user?.name || 'Krupa Lohar'}</span>
                  <span className="profile-email">{user?.email || 'krupa@voicemind.ai'}</span>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-menu-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onOpenProfile) onOpenProfile();
                }}
              >
                <User size={16} />
                <span>View Profile & Usage</span>
              </button>
              <button 
                className="dropdown-menu-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onOpenProfile) onOpenProfile();
                }}
              >
                <Settings size={16} />
                <span>AI Preferences</span>
              </button>
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-menu-item danger-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onLogout) onLogout();
                }}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
