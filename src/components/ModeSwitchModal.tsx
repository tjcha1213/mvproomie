type ModeSwitchOption = {
  label: string;
  description: string;
  href: string;
  note?: string;
};

interface Props {
  open: boolean;
  title: string;
  subtitle: string;
  options: ModeSwitchOption[];
  onClose: () => void;
  onSelect: (option: ModeSwitchOption) => void;
}

export default function ModeSwitchModal({ open, title, subtitle, options, onClose, onSelect }: Props) {
  if (!open) return null;

  return (
    <div className="mode-switch-modal" role="presentation" onClick={onClose}>
      <div
        className="mode-switch-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mode-switch-header">
          <div>
            <div className="mode-switch-title">{title}</div>
            <div className="mode-switch-subtitle">{subtitle}</div>
          </div>
          <button type="button" className="mode-switch-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="mode-switch-list">
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              className="mode-switch-option"
              onClick={() => onSelect(option)}
            >
              <div className="mode-switch-option-copy">
                <span className="mode-switch-option-label">{option.label}</span>
                <span className="mode-switch-option-description">{option.description}</span>
                {option.note && <span className="mode-switch-option-note">{option.note}</span>}
              </div>
              <span className="mode-switch-option-arrow" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
