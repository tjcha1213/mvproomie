import { useMemo, useState } from 'react';
import type { Payment, Unit } from '../data';
import Header from '../components/Header';
import type { HeaderNotification } from '../components/Header';
import ProfilePeekModal from '../../src/components/ProfilePeekModal';

interface Props {
  units: Unit[];
  payments: Payment[];
  onOpenProfile: () => void;
  notifications: HeaderNotification[];
  onOpenNotification: (notification: HeaderNotification) => void;
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

export default function TenantsScreen({ units, payments, onOpenProfile, notifications, onOpenNotification }: Props) {
  const occupiedUnits = units.filter((unit) => unit.status === 'Occupied');
  const [profilePeekPaymentId, setProfilePeekPaymentId] = useState<number | null>(null);

  const tenantGroups = useMemo(() => {
    return occupiedUnits
      .map((unit) => {
        const unitPayments = payments.filter((payment) => payment.unitId === unit.id).sort(sortPaymentsForDisplay);
        return {
          unit,
          payments: unitPayments,
          activeCount: unitPayments.length,
          overdueCount: unitPayments.filter((payment) => payment.status === 'Overdue').length,
          dueCount: unitPayments.filter((payment) => payment.status === 'Due').length,
        };
      })
      .filter((group) => group.payments.length > 0);
  }, [occupiedUnits, payments]);

  const totalTenants = tenantGroups.reduce((sum, group) => sum + group.payments.length, 0);
  const multiTenantUnits = tenantGroups.filter((group) => group.payments.length > 1).length;
  const overdueTenants = tenantGroups.reduce((sum, group) => sum + group.overdueCount, 0);
  const profilePeekPayment = profilePeekPaymentId === null ? null : payments.find((payment) => payment.id === profilePeekPaymentId) ?? null;

  return (
    <>
      <Header onOpenProfile={onOpenProfile} notifications={notifications} onOpenNotification={onOpenNotification} showAddButton={false} />

      <div className="scroll-area">
        <div className="section-header">
          <span className="section-title">Tenants Overview</span>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-value">{totalTenants}</div>
            <div className="kpi-label">Active tenants</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{occupiedUnits.length}</div>
            <div className="kpi-label">Occupied listings</div>
          </div>
          <div className="kpi-card">
            <div className={`kpi-value ${overdueTenants > 0 ? 'kpi-alert' : ''}`}>{overdueTenants}</div>
            <div className="kpi-label">Overdue follow-ups</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{multiTenantUnits}</div>
            <div className="kpi-label">Shared listings</div>
          </div>
        </div>

        {tenantGroups.map(({ unit, payments: unitPayments, activeCount, overdueCount, dueCount }) => (
          <div key={unit.id} className="ll-card">
            <div className="ll-card-head">
              <div className="ll-card-head-copy">
                <span className="ll-card-title">{unit.title}</span>
                <span className="ll-card-meta">
                  <span>{unit.location}</span>
                  <span className="ll-meta-dot" aria-hidden="true" />
                  <span>{activeCount} tenant{activeCount === 1 ? '' : 's'}</span>
                  <span className="ll-meta-dot" aria-hidden="true" />
                  <span>{overdueCount} overdue</span>
                </span>
              </div>
              <span className="roomie-score-chip is-cool">Occupied</span>
            </div>

            <div className="tenant-overview-list">
              {unitPayments.map((payment) => (
                <div key={payment.id} className="tenant-overview-item">
                  <button
                    type="button"
                    className="tenant-overview-avatar tenant-overview-avatar-button"
                    onClick={() => setProfilePeekPaymentId(payment.id)}
                    aria-label={`View ${payment.tenant} profile`}
                  >
                    <img src={payment.avatar ?? ''} alt={payment.tenant} />
                  </button>
                  <div className="tenant-overview-copy">
                    <div className="tenant-overview-name-row">
                      <span className="tenant-overview-name">{payment.tenant}</span>
                      <span className={`tenant-overview-status is-${payment.status.toLowerCase()}`}>{statusLabel(payment.status)}</span>
                    </div>
                    <div className="tenant-overview-meta">
                      <span>{payment.tenantId}</span>
                      <span className="ll-meta-dot" aria-hidden="true" />
                      <span>{payment.method}</span>
                      <span className="ll-meta-dot" aria-hidden="true" />
                      <span>{payment.dueLabel}</span>
                    </div>
                    <div className="tenant-overview-detail">{payment.notes}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="tenant-overview-footer">
              <span>{dueCount} due soon</span>
              <span>{unitPayments.reduce((sum, payment) => sum + payment.amount, 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 })} monthly at risk</span>
            </div>
          </div>
        ))}

        <div style={{ height: 24 }} />
      </div>

      <ProfilePeekModal
        open={profilePeekPayment !== null}
        avatar={profilePeekPayment?.avatar ?? ''}
        name={profilePeekPayment?.tenant ?? ''}
        role="Tenant"
        userId={profilePeekPayment?.tenantId}
        memberSince={profilePeekPayment?.memberSince}
        verificationStatus={profilePeekPayment ? (profilePeekPayment.verified ? 'Verified tenant' : 'Unverified tenant') : undefined}
        roomieScore={profilePeekPayment?.trust.roomieScore}
        uploadedListings={[]}
        tenantReviews={profilePeekPayment?.tenantReviews ?? []}
        hostReviews={profilePeekPayment?.hostReviews ?? []}
        subtitle={profilePeekPayment ? `${profilePeekPayment.method} · ${profilePeekPayment.dueLabel}` : undefined}
        details={profilePeekPayment ? [
          `Unit: ${units.find((unit) => unit.id === profilePeekPayment.unitId)?.title ?? 'Unknown unit'}`,
          `Status: ${statusLabel(profilePeekPayment.status)}`,
          `Amount: ${profilePeekPayment.amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 })}`,
          `Notes: ${profilePeekPayment.notes}`,
        ] : []}
        onClose={() => setProfilePeekPaymentId(null)}
      />
    </>
  );
}
