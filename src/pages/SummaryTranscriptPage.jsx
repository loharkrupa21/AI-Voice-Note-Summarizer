import { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  Layers, 
  Bookmark, 
  Check, 
  Copy, 
  Download, 
  Tag, 
  ArrowRight,
  BookmarkCheck
} from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer';

export default function SummaryTranscriptPage({ 
  audioData, 
  transcript, 
  summaryData, 
  onSaveNote, 
  onViewSavedNotes 
}) {
  const [viewMode, setViewMode] = useState('both'); // 'both' | 'summary' | 'transcript'
  const [category, setCategory] = useState('Work');
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [noteTitle, setNoteTitle] = useState(() => audioData?.title || 'New Voice Note');
  const [actionItems, setActionItems] = useState(() =>
    (summaryData.actionItems || []).map((item) =>
      typeof item === 'string' ? { text: item, done: false } : item
    )
  );
  const categories = ['College', 'Work', 'Research', 'Personal', 'Meeting', 'Ideas'];

  // Toggle done state for an action item
  const toggleActionItem = (idx) => {
    setActionItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, done: !it.done } : it))
    );
  };

  const handleCopyAll = () => {
    const content = `Title: ${noteTitle}\nCategory: ${category}\n\n--- AI SUMMARY ---\n${summaryData.summary}\n\n--- KEY POINTS ---\n${(summaryData.keyPoints || []).map(p => `• ${p}`).join('\n')}\n\n--- FULL TRANSCRIPT ---\n${transcript}`;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (type = 'txt') => {
    const safeTitle = noteTitle.toLowerCase().replace(/\s+/g, '_');
    const isMarkdown = type === 'md';
    const content = isMarkdown
      ? `# ${noteTitle}\n\n- **Category:** ${category}\n- **Duration:** ${audioData?.duration || '00:00'}\n- **Date:** ${new Date().toLocaleString()}\n\n## Summary\n${summaryData.summary}\n\n## Key Points\n${(summaryData.keyPoints || []).map(p => `- ${p}`).join('\n')}\n\n## Transcript\n${transcript}\n`
      : `====================================================\nVOICE NOTE SUMMARY\n====================================================\nTitle: ${noteTitle}\nCategory: ${category}\nDate: ${new Date().toLocaleString()}\nDuration: ${audioData?.duration || '00:00'}\n\n----------------- SUMMARY -----------------\n${summaryData.summary}\n\n----------------- KEY POINTS -----------------\n${(summaryData.keyPoints || []).map(p => `* ${p}`).join('\n')}\n\n----------------- FULL TRANSCRIPT -----------------\n${transcript}\n====================================================\n`;
    const filename = `${safeTitle}_summary.${isMarkdown ? 'md' : 'txt'}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    const newNote = {
      id: Date.now(),
      title: noteTitle,
      date: new Date().toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      duration: audioData?.duration || '00:00',
      durationSeconds: audioData?.durationSeconds ?? 0,
      category: category,
      audioUrl: audioData?.audioUrl,
      transcript: transcript,
      summary: summaryData.summary,
      keyPoints: summaryData.keyPoints || [],
      actionItems: actionItems,
      topics: summaryData.topics || ['Voice Note', category]
    };

    onSaveNote(newNote);
    setIsSaved(true);
  };

  return (
    <div className="summary-transcript-page">
      <div className="audio-player-top-strip">
        <AudioPlayer
          key={audioData?.audioUrl || 'summary-audio'}
          audioUrl={audioData?.audioUrl}
          title={noteTitle}
          duration={audioData?.duration || '00:00'}
        />
      </div>

      {/* Main Header & Save Bar */}
      <div className="save-bar-card">
        <div className="save-bar-inputs">
          <div className="title-edit-field">
            <label className="save-bar-label">Note Title:</label>
            <input
              type="text"
              className="note-title-input"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Enter note title..."
            />
          </div>

          <div className="category-select-field">
            <label className="save-bar-label">Category:</label>
            <select
              className="category-dropdown"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="save-bar-cta-group">
          {!isSaved ? (
            <button className="primary-studio-btn save-note-cta-btn" onClick={handleSave}>
              <Bookmark size={18} />
              <span>Save Summary</span>
            </button>
          ) : (
            <div className="saved-success-pill-group">
              <span className="saved-badge">
                <BookmarkCheck size={18} color="#10B981" />
                <span>Saved!</span>
              </span>
              <button className="view-saved-btn" onClick={onViewSavedNotes}>
                <span>Go to Saved Notes</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View Switcher Bar */}
      <div className="dual-view-toolbar">
        <div className="view-switcher-pill">
          <button
            className={`pill-option ${viewMode === 'both' ? 'active' : ''}`}
            onClick={() => setViewMode('both')}
          >
            <Layers size={15} />
            <span>Side-by-Side</span>
          </button>
          <button
            className={`pill-option ${viewMode === 'summary' ? 'active' : ''}`}
            onClick={() => setViewMode('summary')}
          >
            <Sparkles size={15} />
            <span>Summary Only</span>
          </button>
          <button
            className={`pill-option ${viewMode === 'transcript' ? 'active' : ''}`}
            onClick={() => setViewMode('transcript')}
          >
            <FileText size={15} />
            <span>Transcript Only</span>
          </button>
        </div>

        <div className="export-action-btns">
          <button className="toolbar-btn" onClick={handleCopyAll} title="Copy All">
            {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button className="toolbar-btn" onClick={() => handleDownload('txt')}>
            <Download size={16} />
            <span>Download .txt</span>
          </button>
          <button className="toolbar-btn" onClick={() => handleDownload('md')}>
            <Download size={16} />
            <span>Markdown</span>
          </button>
        </div>
      </div>

      {/* Content Columns: Side-by-side or Single */}
      <div className={`dual-content-layout ${viewMode}`}>
        {/* Left Column: AI Summary */}
        {(viewMode === 'summary' || viewMode === 'both') && (
          <div className="dual-col-card summary-pane">
            <div className="pane-header">
              <div className="pane-icon-title">
                <Sparkles size={18} color="#8B5CF6" />
                <h3>Generated Summary</h3>
              </div>
              <span className="accuracy-pill">Offline summary</span>
            </div>

            <div className="pane-content-scroll">
              {/* Executive Overview */}
              <div className="summary-block">
                <h4 className="block-title">Executive Overview</h4>
                <p className="summary-paragraph">{summaryData.summary}</p>
              </div>

              {/* Key Discussion Points */}
              <div className="summary-block">
                <h4 className="block-title">Key Points & Takeaways</h4>
                <ul className="key-points-checklist">
                  {(summaryData.keyPoints || []).map((point, idx) => (
                    <li key={idx} className="key-bullet-row">
                      <span className="bullet-number-chip">{idx + 1}</span>
                      <span className="bullet-text">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Items */}
              {actionItems && actionItems.length > 0 && (
                <div className="summary-block">
                  <h4 className="block-title">Action Items & Next Steps</h4>
                  <div className="action-checklist">
                    {actionItems.map((item, idx) => (
                      <label key={idx} className={`action-task-item ${item.done ? 'task-done' : ''}`}>
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleActionItem(idx)}
                        />
                        <span className="task-desc">{item.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {summaryData.topics && (
                <div className="topics-chip-container">
                  <span className="topics-label"><Tag size={13} /> Topics:</span>
                  {summaryData.topics.map((top, idx) => (
                    <span key={idx} className="topic-pill">{top}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Column: Full Transcript */}
        {(viewMode === 'transcript' || viewMode === 'both') && (
          <div className="dual-col-card transcript-pane">
            <div className="pane-header">
              <div className="pane-icon-title">
                <FileText size={18} color="#3B82F6" />
                <h3>Speech-to-Text Transcript</h3>
              </div>
              <span className="word-count-chip">
                {transcript.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <div className="pane-content-scroll">
              <div className="raw-transcript-box">
                <p>{transcript}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
