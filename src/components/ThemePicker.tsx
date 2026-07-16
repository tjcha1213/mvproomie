import { THEMES } from '../theme';

interface Props {
  open: boolean;
  primary: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}

export default function ThemePicker({ open, primary, onSelect, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="sheet-overlay theme-picker-overlay" onClick={onClose}>
      <div className="theme-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <div className="sheet-title">Theme color</div>
            <div className="sheet-sub">Pick an accent — the whole app follows.</div>
          </div>
          <button className="sheet-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="theme-options">
          {THEMES.map((t) => {
            const selected = t.color.toLowerCase() === primary.toLowerCase();
            return (
              <button
                key={t.color}
                className={`theme-option ${selected ? 'selected' : ''}`}
                onClick={() => onSelect(t.color)}
              >
                <span className="theme-swatch" style={{ background: t.color }}>
                  {selected && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className="theme-meta">
                  <span className="theme-name">{t.name}</span>
                  <span className="theme-hex">{t.color.toUpperCase()}</span>
                </span>
                {selected && <span className="theme-current">Current</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
