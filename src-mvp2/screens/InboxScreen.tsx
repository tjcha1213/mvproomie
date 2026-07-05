import AppLogo from '../components/AppLogo';

const CONVERSATIONS = [
  { id: 1, name: 'Juan Dela Cruz', preview: 'Hi! Is the unit still available?', time: '2m ago', unread: 3 },
  { id: 2, name: 'Maria Santos', preview: 'Yes, you can move in on July 1st.', time: '1h ago', unread: 0 },
  { id: 3, name: 'Roberto Lim', preview: 'Please send valid IDs for verification.', time: '3h ago', unread: 1 },
  { id: 4, name: 'Ana Reyes', preview: 'The unit includes all utilities! 😊', time: 'Yesterday', unread: 0 },
  { id: 5, name: 'Leon Garcia', preview: 'I can schedule a viewing this Saturday.', time: 'Mon', unread: 0 },
];

interface Props {
  onShowToast: (msg: string) => void;
}

export default function InboxScreen({ onShowToast }: Props) {
  return (
    <>
      <div className="app-header">
        <div className="logo"><AppLogo /></div>
      </div>

      <div className="section-header">
        <span className="section-title">Inbox</span>
      </div>

      <div className="scroll-area">
        <div className="inbox-list">
          {CONVERSATIONS.map(c => (
            <div key={c.id} className="inbox-item" onClick={() => onShowToast(`Opening chat with ${c.name}…`)}>
              <div className="inbox-avatar">{c.name[0]}</div>
              <div className="inbox-info">
                <div className="inbox-name">{c.name}</div>
                <div className="inbox-preview">{c.preview}</div>
              </div>
              <div className="inbox-meta">
                <div className="inbox-time">{c.time}</div>
                {c.unread > 0 && <div className="inbox-unread">{c.unread}</div>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 32 }} />
      </div>
    </>
  );
}
