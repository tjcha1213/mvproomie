import { useMemo, useState } from 'react';
import type { Unit, Inquiry, Payment, Activity } from '../data';
import { WEEK_VIEWS, CALENDAR_VIEWS, formatPesoShort } from '../data';
import type { Tab } from '../components/HostNav';
import Header from '../components/Header';
import type { HeaderNotification } from '../components/Header';
import HostMiniMap from '../components/HostMiniMap';
import { useMockSession } from '../../src/components/MockSession';

interface Props {
  units: Unit[];
  inquiries: Inquiry[];
  payments: Payment[];
  activities: Activity[];
  onGoTo: (t: Tab) => void;
  onOpenInquiriesCalendar: (date?: string) => void;
  onOpenInquiryModal: (inquiryId: number) => void;
  onOpenListingModal: (unitId: number) => void;
  onOpenProfile: () => void;
  notifications: HeaderNotification[];
  onOpenNotification: (notification: HeaderNotification) => void;
  onShowToast: (msg: string) => void;
  onAdd?: () => void;
}

const ACTIVITY_ICONS = {
  inquiry: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
  payment: <><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/></>,
  views: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  review: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
  listing: <><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></>,
};

const CALENDAR_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TASK_ICONS = {
  inquiry: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
  payment: <><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/></>,
  verification: <><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></>,
  draft: <><path d="M4 20h16"/><path d="M6 17 18 5"/><path d="m15 5 4 4"/></>,
};

function heatLevelClass(views: number) {
  if (views >= 66) return 'heat-level-6';
  if (views >= 56) return 'heat-level-5';
  if (views >= 46) return 'heat-level-4';
  if (views >= 36) return 'heat-level-3';
  if (views >= 24) return 'heat-level-2';
  return 'heat-level-1';
}

function buildCalendarMonth(baseMonth: Date) {
  const month = baseMonth.getMonth();
  const year = baseMonth.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const seed = (month + 1) * 11 + day * 7 + (year - 2026) * 13;
    const baseViews = CALENDAR_VIEWS[index % CALENDAR_VIEWS.length]?.views ?? 38;
    const shifted = baseViews + ((seed % 17) - 8) + ((month % 4) - 1) * 3 + (year - 2026) * 2;
    const views = Math.max(12, Math.min(78, shifted));
    const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { date: isoDate, day, views };
  });
}

function buildWeeklyWindow(baseDate: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + index);
    const isoDate = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    const seed = (current.getMonth() + 1) * 19 + current.getDate() * 7 + (current.getFullYear() - 2026) * 13;
    const baseViews = WEEK_VIEWS[index % WEEK_VIEWS.length] ?? 36;
    const shifted = baseViews + ((seed % 11) - 5);
    const views = Math.max(10, Math.min(74, shifted));
    return { date: isoDate, views };
  });
}

function formatLongDate(dateString: string) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(dateString: string) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatWeekday(dateString: string) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
  });
}

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startLabel} - ${endLabel}`;
}

function calculatePercentDelta(currentValue: number, previousValue: number) {
  if (previousValue <= 0) return 0;
  return Math.round(((currentValue - previousValue) / previousValue) * 100);
}

function sortPaymentsForDisplay(a: Payment, b: Payment) {
  const statusRank: Record<Payment['status'], number> = {
    Overdue: 0,
    Due: 1,
    Paid: 2,
  };
  const statusDelta = statusRank[a.status] - statusRank[b.status];
  if (statusDelta !== 0) return statusDelta;
  return a.tenant.localeCompare(b.tenant);
}

function statusLabel(status: Payment['status']) {
  return status === 'Overdue' ? 'Overdue' : status === 'Due' ? 'Due soon' : 'Paid';
}

export default function DashboardScreen({
  units,
  inquiries,
  payments,
  activities,
  onGoTo,
  onOpenInquiriesCalendar,
  onOpenInquiryModal,
  onOpenListingModal,
  onOpenProfile,
  notifications,
  onOpenNotification,
  onShowToast,
  onAdd,
}: Props) {
  const { profile } = useMockSession();
  const [viewMode, setViewMode] = useState<'weekly' | 'calendar' | 'map'>('weekly');
  const [weekStartDate, setWeekStartDate] = useState(() => new Date(2026, 6, 6));
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(2026, 6, 1));
  const published = units.filter(u => u.status !== 'Draft');
  const mappableUnits = units.filter((unit) => Number.isFinite(unit.lat) && Number.isFinite(unit.lng));
  const occupied = units.filter(u => u.status === 'Occupied');
  const occupancy = published.length > 0 ? Math.round((occupied.length / published.length) * 100) : 0;
  const collected = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const expected = payments.reduce((s, p) => s + p.amount, 0);
  const newInquiries = inquiries.filter(i => i.status === 'New');
  const overdue = payments.filter(p => p.status === 'Overdue');
  const unverified = units.filter(u => u.status !== 'Draft' && !u.verified);
  const drafts = units.filter(u => u.status === 'Draft');

  const weeklyData = useMemo(() => buildWeeklyWindow(weekStartDate), [weekStartDate]);
  const previousWeeklyData = useMemo(
    () => buildWeeklyWindow(new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate() - 7)),
    [weekStartDate],
  );
  const totalViews = weeklyData.reduce((sum, item) => sum + item.views, 0);
  const maxViews = Math.max(...weeklyData.map((item) => item.views));
  const averageViews = Math.round(totalViews / weeklyData.length);
  const previousWeekTotalViews = previousWeeklyData.reduce((sum, item) => sum + item.views, 0);
  const calendarMonthEntries = buildCalendarMonth(calendarMonth);
  const calendarLeadingBlanks = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
  const previousCalendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
  const previousCalendarMonthEntries = buildCalendarMonth(previousCalendarMonth);
  const calendarMonthTotalViews = calendarMonthEntries.reduce((sum, item) => sum + item.views, 0);
  const previousCalendarMonthTotalViews = previousCalendarMonthEntries.reduce((sum, item) => sum + item.views, 0);
  const calendarCells = [
    ...Array.from({ length: calendarLeadingBlanks }, (_, index) => ({ kind: 'blank' as const, id: `blank-${index}` })),
    ...calendarMonthEntries.map((entry) => ({ kind: 'day' as const, ...entry })),
  ];
  const upcomingViewings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inquiries
      .map((inquiry) => {
        if (inquiry.status !== 'Viewing' || !inquiry.viewingAt) return null;
        const date = new Date(`${inquiry.viewingAt}T12:00:00`);
        if (Number.isNaN(date.getTime()) || date < today) return null;
        const unit = units.find((entry) => entry.id === inquiry.unitId);
        return {
          inquiry,
          unitId: unit?.id ?? inquiry.unitId,
          date,
          dateLabel: formatLongDate(inquiry.viewingAt),
          time: inquiry.viewingTime ?? inquiry.time,
          location: unit?.location ?? 'Listing location unavailable',
          userId: inquiry.userId,
          listingId: unit?.listingId ?? '—',
          listingTitle: unit?.title ?? 'Untitled listing',
          avatar: inquiry.avatar,
          listingImage: unit?.image ?? '',
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 4);
  }, [inquiries, units]);
  // Actionable items, computed from live state so acting on them clears them.
  const tasks: { id: string; text: string; tab: Tab; kind: keyof typeof TASK_ICONS }[] = [
    ...(newInquiries.length > 0 ? [{ id: 'inq', text: `${newInquiries.length} new ${newInquiries.length === 1 ? 'inquiry' : 'inquiries'} awaiting reply`, tab: 'inquiries' as Tab, kind: 'inquiry' as const }] : []),
    ...(overdue.length > 0 ? [{ id: 'pay', text: `${overdue.length} rent payment${overdue.length === 1 ? '' : 's'} overdue (${formatPesoShort(overdue.reduce((s, p) => s + p.amount, 0))})`, tab: 'payments' as Tab, kind: 'payment' as const }] : []),
    ...unverified.map(u => ({ id: `ver-${u.id}`, text: `${u.title} is not verified yet`, tab: 'listings' as Tab, kind: 'verification' as const })),
    ...drafts.map(u => ({ id: `draft-${u.id}`, text: `${u.title} is still a draft`, tab: 'listings' as Tab, kind: 'draft' as const })),
  ];
  const activityTabByIcon: Record<Activity['icon'], Tab> = {
    inquiry: 'inquiries',
    payment: 'payments',
    views: 'listings',
    review: 'profile',
    listing: 'listings',
  };
  const weeklyDelta = calculatePercentDelta(totalViews, previousWeekTotalViews);
  const calendarDelta = calculatePercentDelta(calendarMonthTotalViews, previousCalendarMonthTotalViews);
  const chartDelta = viewMode === 'weekly' ? weeklyDelta : viewMode === 'calendar' ? calendarDelta : null;
  const chartDeltaClass = chartDelta !== null && chartDelta < 0 ? 'll-down' : 'll-up';
  const weeklyRangeLabel = weeklyData.length > 0 ? formatDateRange(weeklyData[0].date, weeklyData[weeklyData.length - 1].date) : '';

  return (
    <>
      <Header onOpenProfile={onOpenProfile} notifications={notifications} onOpenNotification={onOpenNotification} onAdd={onAdd} />

      <div className="scroll-area">
        <div className="ll-greeting">
          <div className="ll-greeting-title">Hello, {profile?.name ?? 'Juan'} 👋</div>
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

        <div className="ll-dashboard-grid">
          <div className="ll-dashboard-col ll-dashboard-col-left">
            <div className="ll-card ll-chart-card">
              <div className="ll-card-head">
                <div className="ll-card-head-copy">
                  <span className="ll-card-title">Listing views</span>
                  <span className="ll-card-meta">
                    {viewMode === 'weekly' ? (
                      <>
                        <span>{totalViews} views</span>
                        <span className="ll-meta-dot" aria-hidden="true" />
                        <span>{weeklyRangeLabel}</span>
                      </>
                    ) : viewMode === 'calendar' ? (
                      <>
                        <span>{calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })} activity</span>
                        <span className="ll-meta-dot" aria-hidden="true" />
                        <span>{calendarMonthTotalViews} views</span>
                      </>
                    ) : (
                      <>
                        <span>{mappableUnits.length} mapped listings</span>
                        <span className="ll-meta-dot" aria-hidden="true" />
                        <span>{occupancy}% occupied</span>
                      </>
                    )}
                    {chartDelta !== null && (
                      <>
                        <span className="ll-meta-dot" aria-hidden="true" />
                        <b className={chartDeltaClass}>{chartDelta >= 0 ? `+${chartDelta}%` : `${chartDelta}%`}</b>
                      </>
                    )}
                  </span>
                </div>
                <div className="ll-view-toggle" role="tablist" aria-label="Listing view chart mode">
                  <button type="button" className={`ll-view-toggle-btn ${viewMode === 'weekly' ? 'active' : ''}`} onClick={() => setViewMode('weekly')}>7D</button>
                  <button type="button" className={`ll-view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>Calendar</button>
                  <button type="button" className={`ll-view-toggle-btn ${viewMode === 'map' ? 'active' : ''}`} onClick={() => setViewMode('map')}>Map</button>
                </div>
              </div>
              {viewMode === 'weekly' ? (
                <div className="bar-chart-shell">
                  <button type="button" className="bar-nav-btn" aria-label="Show previous 7 days" onClick={() => setWeekStartDate((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() - 7))}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <div className="bar-chart">
                    {weeklyData.map((item, i) => (
                      <div key={i} className="bar-col">
                        <button type="button" className="bar-hitbox" aria-label={`${formatLongDate(item.date)}: ${item.views} views`} onClick={() => onShowToast(`${formatLongDate(item.date)} · ${item.views} views`)}>
                          <div className="bar-tooltip" role="tooltip">
                            <div className="bar-tooltip-title">{formatLongDate(item.date)}</div>
                            <div className="bar-tooltip-value">{item.views} listing views</div>
                            <div className="bar-tooltip-meta">{formatWeekday(item.date)} · {item.views >= averageViews ? `${item.views - averageViews} above` : `${averageViews - item.views} below`} weekly average</div>
                          </div>
                          <div className={`bar ${i === weeklyData.length - 1 ? 'bar-today' : ''}`} style={{ height: `${(item.views / maxViews) * 100}%` }} />
                        </button>
                        <span className="bar-day">{formatShortDate(item.date)}</span>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="bar-nav-btn" aria-label="Show next 7 days" onClick={() => setWeekStartDate((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() + 7))}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              ) : viewMode === 'calendar' ? (
                <div className="calendar-views">
                  <div className="calendar-nav">
                    <div className="calendar-nav-group" aria-label="Calendar month navigation">
                      <button type="button" className="calendar-arrow-btn" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} aria-label="Previous month">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                      <strong>{calendarMonth.toLocaleString('en-US', { month: 'long' })}</strong>
                      <button type="button" className="calendar-arrow-btn" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} aria-label="Next month">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                    <div className="calendar-nav-group" aria-label="Calendar year navigation">
                      <button type="button" className="calendar-arrow-btn" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear() - 1, current.getMonth(), 1))} aria-label="Previous year">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                      <strong>{calendarMonth.getFullYear()}</strong>
                      <button type="button" className="calendar-arrow-btn" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear() + 1, current.getMonth(), 1))} aria-label="Next year">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="calendar-header-row">
                    {CALENDAR_WEEKDAYS.map((day) => (
                      <span key={day} className="calendar-weekday">{day}</span>
                    ))}
                  </div>
                  <div className="calendar-grid">
                    {calendarCells.map((cell) => {
                      if (cell.kind === 'blank') return <div key={cell.id} className="calendar-day calendar-day-empty" aria-hidden="true" />;
                      return (
                        <button key={cell.date} type="button" className={`calendar-day ${heatLevelClass(cell.views)}`} aria-label={`${formatLongDate(cell.date)}: ${cell.views} listing views`} onClick={() => onShowToast(`${formatLongDate(cell.date)} · ${cell.views} views`)}>
                          <div className="calendar-day-fill" />
                          <span className="calendar-day-number">{cell.day}</span>
                          <span className="calendar-day-count">{cell.views}</span>
                          <div className="bar-tooltip calendar-tooltip" role="tooltip">
                            <div className="bar-tooltip-title">{formatLongDate(cell.date)}</div>
                            <div className="bar-tooltip-value">{cell.views} listing views</div>
                            <div className="bar-tooltip-meta">{cell.views >= averageViews ? `${cell.views - averageViews} above` : `${averageViews - cell.views} below`} weekly average</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="host-map-card">
                  <HostMiniMap units={mappableUnits} />
                </div>
              )}

            </div>
            <div className="ll-card ll-viewing-card">
              <div className="ll-card-head">
                <div className="ll-card-head-copy">
                  <span className="ll-card-title">Upcoming scheduled viewings</span>
                  <span className="ll-card-meta"><span>Quick reminder for the next few visits</span></span>
                </div>
                <button type="button" className="ll-viewing-link" onClick={() => onOpenInquiriesCalendar()}>Go to inquiries</button>
              </div>
              <div className="viewing-reminder-list">
                {upcomingViewings.length === 0 ? (
                  <div className="viewing-reminder-empty">No upcoming scheduled viewings at the moment.</div>
                ) : (
                  upcomingViewings.map(({ inquiry, unitId, dateLabel, time, location, userId, listingId, listingTitle, avatar, listingImage }) => (
                    <div key={inquiry.id} className="viewing-reminder-item">
                      <button type="button" className="viewing-reminder-date-row" onClick={() => onOpenInquiriesCalendar(inquiry.viewingAt ?? undefined)}>
                        <strong>{dateLabel}</strong>
                        <span>{time}</span>
                      </button>
                      <div className="viewing-reminder-split">
                        <button type="button" className="viewing-reminder-user-card" onClick={() => onOpenInquiryModal(inquiry.id)}>
                          <img className="viewing-reminder-avatar" src={avatar} alt={inquiry.name} />
                          <div className="viewing-reminder-card-copy">
                            <div className="viewing-reminder-name">{inquiry.name}</div>
                            <div className="viewing-reminder-location">{userId}</div>
                          </div>
                        </button>
                        <button type="button" className="viewing-reminder-listing-card" onClick={() => onOpenListingModal(unitId)}>
                          <img className="viewing-reminder-thumb" src={listingImage} alt={listingTitle} />
                          <div className="viewing-reminder-card-copy">
                            <div className="viewing-reminder-title">{listingTitle}</div>
                            <div className="viewing-reminder-location">{listingId}</div>
                            <div className="viewing-reminder-location">{location}</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="ll-dashboard-col ll-dashboard-col-right">
            {tasks.length > 0 && (
              <div className="ll-card ll-attn-card">
                <div className="ll-card-head">
                  <span className="ll-card-title">Needs attention</span>
                  <span className="task-count">{tasks.length}</span>
                </div>
                <div className="task-list">
                  {tasks.map((t) => (
                    <button key={t.id} className={`task-item task-item-${t.kind}`} onClick={() => onGoTo(t.tab)}>
                      <span className={`task-dot task-dot-${t.kind}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                          {TASK_ICONS[t.kind]}
                        </svg>
                      </span>
                      <span className="task-text">{t.text}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="ll-card ll-activity-card">
              <div className="ll-card-head">
                <span className="ll-card-title">Recent activity</span>
              </div>
              <div className="activity-list">
                {activities.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="activity-item activity-item-button"
                    onClick={() => onGoTo(activityTabByIcon[a.icon])}
                  >
                    <div className={`activity-icon activity-icon-${a.icon}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                        {ACTIVITY_ICONS[a.icon]}
                      </svg>
                    </div>
                    <div className="activity-body">
                      <div className="activity-text">{a.text}</div>
                      <div className="activity-time">{a.time}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 16 }} />
      </div>

    </>
  );
}
