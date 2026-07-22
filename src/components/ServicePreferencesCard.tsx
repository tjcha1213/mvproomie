import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { updateServicePreferences, useMockSession } from './MockSession';
import './ServicePreferencesCard.css';

type ServiceItem = {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
};

const SERVICES: ServiceItem[] = [
  {
    id: 'cleaning',
    label: 'Cleaning',
    description: 'Home upkeep',
    icon: (
      <>
        <path d="M12 2.6v8.8" />
        <path d="M10.2 9.9h3.6l1.1 1.3v1H9.1v-1l1.1-1.3Z" />
        <path d="M8.6 12.6h6.8l1.2 8.4H7.4l1.2-8.4Z" />
        <path d="M10.8 15.2v3.8" />
        <path d="M13.2 15.2v3.8" />
      </>
    ),
  },
  {
    id: 'moving',
    label: 'Moving',
    description: 'Help on the go',
    icon: (
      <>
        <path d="M3 16h12V7H3v9Z" />
        <path d="M15 10h3l3 3v3h-6v-6Z" />
        <circle cx="7.5" cy="18.5" r="1.5" />
        <circle cx="18.5" cy="18.5" r="1.5" />
      </>
    ),
  },
  {
    id: 'furniture',
    label: 'Furniture',
    description: 'Set up spaces',
    icon: (
      <>
        <path d="M5 11h14v8H5z" />
        <path d="M7 11V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
        <path d="M7 19v2m10-2v2" />
      </>
    ),
  },
  {
    id: 'legal',
    label: 'Legal',
    description: 'Contracts & help',
    icon: (
      <>
        <path d="M12 3v18" />
        <path d="M7 7h10" />
        <path d="M9 7v4a3 3 0 0 1-3 3h0a3 3 0 0 1-3-3V7h6Zm12 0v4a3 3 0 0 1-3 3h0a3 3 0 0 1-3-3V7h6Z" />
        <path d="M5 21h14" />
      </>
    ),
  },
  {
    id: 'repairs',
    label: 'Repairs',
    description: 'Quick fixes',
    icon: (
      <>
        <path d="M14.7 6.3a4 4 0 0 0-5.66 5.66L4 17v3h3l5.04-5.04a4 4 0 0 0 5.66-5.66l-2.8 2.8-2.12-2.12 2.92-2.68Z" />
      </>
    ),
  },
  {
    id: 'utilities',
    label: 'Utilities',
    description: 'Bills & setup',
    icon: (
      <>
        <path d="M13.8 3.8 7.2 13.1h4.3L10 20.2 16.8 10.4h-4.1l1.1-6.6Z" />
      </>
    ),
  },
];

export default function ServicePreferencesCard() {
  const { profile } = useMockSession();
  const selected = profile?.servicePreferences ?? [];

  const rankedServices = useMemo(
    () => SERVICES.filter((service) => selected.includes(service.id)),
    [selected],
  );

  const toggleService = (serviceId: string) => {
    const next = selected.includes(serviceId)
      ? selected.filter((item) => item !== serviceId)
      : [...selected, serviceId];
    updateServicePreferences(next);
  };

  return (
    <div className="service-pref-card">
      <div className="service-pref-header">
        <div>
          <div className="service-pref-title">Service preferences</div>
          <div className="service-pref-subtitle">Rank the services you prefer.</div>
        </div>
        <div className="service-pref-count">{selected.length} selected</div>
      </div>

      <div className="service-pref-grid" role="list" aria-label="Service preferences">
        {SERVICES.map((service) => {
          const rank = selected.indexOf(service.id);
          const active = rank >= 0;
          return (
            <button
              key={service.id}
              type="button"
              className={`service-pref-item ${active ? 'active' : ''}`}
              onClick={() => toggleService(service.id)}
              aria-pressed={active}
            >
              <span className="service-pref-badge">{active ? rank + 1 : '•'}</span>
              <span className="service-pref-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  {service.icon}
                </svg>
              </span>
              <span className="service-pref-label">{service.label}</span>
              <span className="service-pref-desc">{service.description}</span>
            </button>
          );
        })}
      </div>

      {rankedServices.length > 0 && (
        <div className="service-pref-ranks">
          {rankedServices.map((service, index) => (
            <span key={service.id} className="service-pref-rank-pill">
              <strong>{index + 1}</strong>
              <span>{service.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
