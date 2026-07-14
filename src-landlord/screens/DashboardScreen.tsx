import { useState } from 'react';
import type { Unit, Inquiry, Payment } from '../data';
import { WEEK_VIEWS, WEEK_DAYS, CALENDAR_VIEWS, ACTIVITY, formatPesoShort } from '../data';
import type { Tab } from '../components/LandlordNav';
import Header from '../components/Header';

interface Props {
  units: Unit[];
  inquiries: Inquiry[];
  payments: Payment[];
  onGoTo: (t: Tab) => void;
  onOpenProfile: () => void;
  onShowToast: (msg: string) => void;
}

const ACTIVITY_ICONS = {
  inquiry: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
  payment: <><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/></>,
  views: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  review: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
};

const WEEK_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CALENDAR_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function heatLevelClass(views: number) {
  if (views >= 62) return 'heat-level-5';
  if (views >= 52) return 'heat-level-4';
  if (views >= 42) return 'heat-level-3';
  if (views >= 30) return 'heat-level-2';
  return 'heat-level-1';
}

export default function DashboardScreen({ units, inquiries, payments, onGoTo, onOpenProfile, onShowToast }: Props) {
  const [viewMode, setViewMode] = useState<'weekly' | 'calendar'>('weekly');
  const published = units.filter(u => u.status !== 'Draft');
  const occupied = units.filter(u => u.status === 'Occupied');
  const occupancy = published.length > 0 ? Math.round((occupied.length / published.length) * 100) : 0;
  const collected = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const expected = payments.reduce((s, p) => s + p.amount, 0);
  const newInquiries = inquiries.filter(i => i.status === 'New');
  const overdue = payments.filter(p => p.status === 'Overdue');
  const unverified = units.filter(u => u.status !== 'Draft' && !u.verified);
  const drafts = units.filter(u => u.status === 'Draft');

  const totalViews = WEEK_VIEWS.reduce((a, b) => a + b, 0);
  const maxViews = Math.max(...WEEK_VIEWS);
  const averageViews = Math.round(totalViews / WEEK_VIEWS.length);
  const calendarLeadingBlanks = new Date('2026-07-01').getDay();
  const calendarCells = [
    ...Array.from({ length: calendarLeadingBlanks }, (_, index) => ({ kind: 'blank' as const, id: `blank-${index}` })),
    ...CALENDAR_VIEWS.map((entry) => ({ kind: 'day' as const, ...entry })),
  ];

  // Actionable items, computed from live state so acting on them clears them.
  const tasks: { id: string; text: string; tab: Tab }[] = [
    ...(newInquiries.length > 0 ? [{ id: 'inq', text: `${newInquiries.length} new ${newInquiries.length === 1 ? 'inquiry' : 'inquiries'} awaiting reply`, tab: 'inquiries' as Tab }] : []),
    ...(overdue.length > 0 ? [{ id: 'pay', text: `${overdue.length} rent payment${overdue.length === 1 ? '' : 's'} overdue (${formatPesoShort(overdue.reduce((s, p) => s + p.amount, 0))})`, tab: 'payments' as Tab }] : []),
    ...unverified.map(u => ({ id: `ver-${u.id}`, text: `${u.title} is not verified yet`, tab: 'listings' as Tab })),
    ...drafts.map(u => ({ id: `draft-${u.id}`, text: `${u.title} is still a draft`, tab: 'listings' as Tab })),
  ];

  return (
    <>
      <Header onOpenProfile={onOpenProfile} onShowToast={onShowToast} />

      <div className="scroll-area">
        <div className="ll-greeting">
          <div className="ll-greeting-title">Hello, Juan 👋</div>
          <div className="ll-greeting-sub">Here's how your properties are doing</div>
        </div>

        {/* KPI grid */}
        <div className="kpi-grid">
          <button className="kpi-card" onClick={() => onGoTo('listings')}>
            <div className="kpi-value">{published.length}</div>
            <div className="kpi-label">Active listings</div>
          </button>
          <button className="kpi-card" onClick={() => onGoTo('listings')}>
            <div className="kpi-value">{occupancy}%</div>
            <div className="kpi-label">Occupancy</div>
          </button>
          <button className="kpi-card" onClick={() => onGoTo('payments')}>
            <div className="kpi-value">{formatPesoShort(collected)}</div>
            <div className="kpi-label">Collected · of {formatPesoShort(expected)}</div>
          </button>
          <button className="kpi-card" onClick={() => onGoTo('inquiries')}>
            <div className={`kpi-value ${newInquiries.length > 0 ? 'kpi-alert' : ''}`}>{newInquiries.length}</div>
            <div className="kpi-label">New inquiries</div>
          </button>
        </div>

        {/* Chart + attention: stacked on mobile, side-by-side on desktop */}
        <div className="ll-dash-row">
        {/* Views chart */}
        <div className="ll-card ll-chart-card">
          <div className="ll-card-head">
            <div>
              <span className="ll-card-title">Listing views</span>
              <span className="ll-card-meta">{viewMode === 'weekly' ? `${totalViews} this week` : 'July 2026 view activity'} · <b className="ll-up">+18%</b></span>
            </div>
            <div className="ll-view-toggle" role="tablist" aria-label="Listing view chart mode">
              <button
                type="button"
                className={`ll-view-toggle-btn ${viewMode === 'weekly' ? 'active' : ''}`}
                onClick={() => setViewMode('weekly')}
              >
                7D
              </button>
              <button
                type="button"
                className={`ll-view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setViewMode('calendar')}
              >
                Calendar
              </button>
            </div>
          </div>
          {viewMode === 'weekly' ? (
            <div className="bar-chart">
              {WEEK_VIEWS.map((v, i) => (
                <div key={i} className="bar-col">
                  <button
                    type="button"
                    className="bar-hitbox"
                    aria-label={`${WEEK_DAY_LABELS[i]}: ${v} views`}
                    onClick={() => onShowToast(`${WEEK_DAY_LABELS[i]} · ${v} views`)}
                  >
                    <div className="bar-tooltip" role="tooltip">
                      <div className="bar-tooltip-title">{WEEK_DAY_LABELS[i]}</div>
                      <div className="bar-tooltip-value">{v} listing views</div>
                      <div className="bar-tooltip-meta">
                        {v >= averageViews ? `${v - averageViews} above` : `${averageViews - v} below`} weekly average
                      </div>
                    </div>
                    <div
                      className={`bar ${i === WEEK_VIEWS.length - 1 ? 'bar-today' : ''}`}
                      style={{ height: `${(v / maxViews) * 100}%` }}
                    />
                  </button>
                  <span className="bar-day">{WEEK_DAYS[i]}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="calendar-views">
              <div className="calendar-header-row">
                {CALENDAR_WEEKDAYS.map((day) => (
                  <span key={day} className="calendar-weekday">{day}</span>
                ))}
              </div>
              <div className="calendar-grid">
                {calendarCells.map((cell) => {
                  if (cell.kind === 'blank') {
                    return <div key={cell.id} className="calendar-day calendar-day-empty" aria-hidden="true" />;
                  }

                  return (
                    <button
                      key={cell.date}
                      type="button"
                      className={`calendar-day ${heatLevelClass(cell.views)}`}
                      aria-label={`${cell.date}: ${cell.views} listing views`}
                      onClick={() => onShowToast(`${cell.date} · ${cell.views} views`)}
                    >
                      <div className="calendar-day-fill" />
                      <span className="calendar-day-number">{cell.day}</span>
                      <span className="calendar-day-count">{cell.views}</span>
                      <div className="bar-tooltip calendar-tooltip" role="tooltip">
                        <div className="bar-tooltip-title">{cell.date}</div>
                        <div className="bar-tooltip-value">{cell.views} listing views</div>
                        <div className="bar-tooltip-meta">
                          {cell.views >= averageViews ? `${cell.views - averageViews} above` : `${averageViews - cell.views} below`} weekly average
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Needs attention */}
        {tasks.length > 0 && (
          <div className="ll-card ll-attn-card">
            <div className="ll-card-head">
              <span className="ll-card-title">Needs attention</span>
              <span className="task-count">{tasks.length}</span>
            </div>
            <div className="task-list">
              {tasks.map(t => (
                <button key={t.id} className="task-item" onClick={() => onGoTo(t.tab)}>
                  <span className="task-dot" />
                  <span className="task-text">{t.text}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
        </div>

        {/* Recent activity */}
        <div className="ll-card">
          <div className="ll-card-head">
            <span className="ll-card-title">Recent activity</span>
          </div>
          <div className="activity-list">
            {ACTIVITY.map(a => (
              <div key={a.id} className="activity-item">
                <div className="activity-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                    {ACTIVITY_ICONS[a.icon]}
                  </svg>
                </div>
                <div className="activity-body">
                  <div className="activity-text">{a.text}</div>
                  <div className="activity-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 16 }} />
      </div>
    </>
  );
}
