import { Fragment } from 'react';
import { 
  LayoutDashboard, 
  Mic, 
  PlayCircle, 
  Cpu, 
  FileText, 
  Sparkles, 
  Layers, 
  FolderClock,
  ChevronRight
} from 'lucide-react';

export default function FlowBreadcrumbs({ currentStep, onSelectStep }) {
  const steps = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'record', label: 'Record / Upload', icon: Mic },
    { id: 'audio-player', label: 'Audio Player', icon: PlayCircle },
    { id: 'processing', label: 'Speech-to-Text', icon: Cpu },
    { id: 'transcript', label: 'Transcript', icon: FileText },
    { id: 'summary', label: 'AI Summary', icon: Sparkles },
    { id: 'summary-transcript', label: 'Summary + Transcript', icon: Layers },
    { id: 'saved-notes', label: 'Saved Notes', icon: FolderClock },
  ];

  // Helper to map currentView to step index
  const getStepIndex = (viewId) => {
    if (viewId === 'upload') return 1;
    const idx = steps.findIndex(s => s.id === viewId);
    return idx >= 0 ? idx : 0;
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="flow-breadcrumbs-wrapper">
      <div className="flow-track-label">
        <span className="flow-pulse-dot"></span>
        <span className="flow-track-title">Workflow Pipeline</span>
      </div>

      <div className="breadcrumbs-scroll-row">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = (step.id === currentStep) || (step.id === 'record' && (currentStep === 'record' || currentStep === 'upload'));
          const isPassed = idx < currentIndex;

          return (
            <Fragment key={step.id}>
              <button
                className={`breadcrumb-step-btn ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''}`}
                onClick={() => onSelectStep(step.id)}
                title={`Go to ${step.label}`}
              >
                <span className="step-num-icon">
                  <Icon size={14} />
                </span>
                <span className="step-text">{step.label}</span>
              </button>

              {idx < steps.length - 1 && (
                <span className="step-arrow-divider">
                  <ChevronRight size={14} />
                </span>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
