import { X, ShieldCheck, Sparkles } from 'lucide-react';

export default function ProfileModal({ user, notesCount = 4, totalDuration = "13:55", onClose }) {
  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-top">
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
          
          <div className="profile-card-header">
            <div className="profile-avatar-giant">
              <span>{user?.name?.charAt(0) || 'K'}</span>
            </div>
            <h3>{user?.name || 'Krupa Lohar'}</h3>
            <p className="profile-user-email">{user?.email || 'krupa@voicemind.ai'}</p>
            <span className="profile-plan-pill">
              <Sparkles size={13} /> Pro AI Voice Plan
            </span>
          </div>
        </div>

        <div className="profile-stats-grid">
          <div className="profile-stat-box">
            <span className="stat-label">Total Notes</span>
            <span className="stat-val">{notesCount}</span>
          </div>
          <div className="profile-stat-box">
            <span className="stat-label">Audio Time</span>
            <span className="stat-val">{totalDuration}</span>
          </div>
          <div className="profile-stat-box">
            <span className="stat-label">AI Accuracy</span>
            <span className="stat-val">98%</span>
          </div>
        </div>

        <div className="profile-settings-list">
          <div className="profile-setting-item">
            <div className="setting-info">
              <span className="setting-title">AI Summarization Model</span>
              <span className="setting-desc">Browser speech recognition + local summary generator</span>
            </div>
            <span className="active-status-badge">Active</span>
          </div>

          <div className="profile-setting-item">
            <div className="setting-info">
              <span className="setting-title">Audio Quality</span>
              <span className="setting-desc">High Definition 48kHz Stereo</span>
            </div>
            <span className="active-status-badge">Lossless</span>
          </div>

          <div className="profile-setting-item">
            <div className="setting-info">
              <span className="setting-title">Data Privacy & Security</span>
              <span className="setting-desc">Client-side encryption & local persistence</span>
            </div>
            <ShieldCheck size={18} color="#10B981" />
          </div>
        </div>

        <div className="profile-modal-footer">
          <button className="done-footer-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
