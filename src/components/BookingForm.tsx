'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';

interface ClinicInfo {
  id?: string;
  name?: string;
  address?: string | { address_line_1?: string; city?: string; state_province?: string; postal_code?: string; country?: string };
}

interface BookingData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  specimenType?: string;
  quoteAmount?: string | number;
  insurance?: string;
  sendingClinic?: ClinicInfo;
  receivingClinic?: ClinicInfo;
  requestingClinic?: ClinicInfo;
  contactId?: string;
}

interface BookingFormProps {
  bookingData: BookingData;
  sessionToken: string;
  bookingToken: string;
  onSuccess: () => void;
}

function formatAddress(clinic?: ClinicInfo): string {
  if (!clinic?.address) return '';
  if (typeof clinic.address === 'string') return clinic.address;
  const a = clinic.address;
  return [a.address_line_1, a.city, a.state_province, a.postal_code, a.country]
    .filter(Boolean)
    .join(', ');
}

function formatDob(dateStr?: string): string {
  if (!dateStr) return '';
  const dt = new Date(dateStr + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatAmount(amount?: string | number): string {
  if (!amount) return '--';
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  return isNaN(num) ? String(amount) : `$${num.toLocaleString()}`;
}

const STEPS = [
  { key: 'quote', label: 'Your Quote' },
  { key: 'info', label: 'Your Information' },
  { key: 'clinics', label: 'Clinic Details' },
  { key: 'payment', label: 'Payment Details' },
  { key: 'partner', label: 'Partner Information' },
];

export default function BookingForm({ bookingData, sessionToken, bookingToken, onSuccess }: BookingFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [payer, setPayer] = useState(() => {
    if (bookingData.insurance?.toLowerCase().includes('progyny')) return 'Progyny';
    return '';
  });
  const [hasPartner, setHasPartner] = useState(false);
  const [partner, setPartner] = useState({ firstName: '', lastName: '', dateOfBirth: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const d = bookingData;
  const isLastStep = currentStep === STEPS.length - 1;

  function handleNext() {
    if (currentStep === 3 && !payer) {
      setStatus({ msg: 'Please select a payment option.', type: 'error' });
      return;
    }
    setStatus(null);
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handlePrev() {
    setStatus(null);
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setStatus(null);

    const payload: Record<string, unknown> = {
      sessionToken,
      bookingToken,
      payer,
    };

    if (hasPartner) {
      payload.partner = partner;
    }

    try {
      const data = await apiPost<{ success: boolean; message?: string }>('/api/booking/submit', payload);
      if (data.success) {
        onSuccess();
      } else {
        setStatus({ msg: data.message || 'Something went wrong. Please try again.', type: 'error' });
        setSubmitting(false);
      }
    } catch {
      setStatus({ msg: 'Something went wrong. Please try again.', type: 'error' });
      setSubmitting(false);
    }
  }

  return (
    <div className="bf-wrap">
      {/* Header */}
      <div className="bf-header">
        <img src="/cf-logo.png" alt="CryoFuture" className="bf-header-logo" />
        <div className="bf-header-right">
          <div className="bf-header-title">CryoFuture Transportation Quote</div>
          <div className="bf-progress-label">Step {currentStep + 1} of {STEPS.length}</div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="bf-progress-bar">
        {STEPS.map((_, i) => (
          <div key={i} className={`bf-progress-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`} />
        ))}
      </div>

      {/* Steps */}
      {STEPS.map((stepDef, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;
        const isLocked = i > currentStep;

        return (
          <div
            key={stepDef.key}
            className={`bf-step-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
          >
            {/* Step header — on the outer gray container */}
            <div className="bf-step-header" onClick={() => isCompleted ? setCurrentStep(i) : undefined}>
              <div className={`bf-step-number ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                {isCompleted ? '✓' : i + 1}
              </div>
              <div>
                <div className="bf-step-title">{stepDef.label}</div>
                <div className="bf-step-subtitle">
                  {isActive ? 'Current step' : isCompleted ? 'Completed' : 'Upcoming'}
                </div>
              </div>
            </div>

            {/* Step content — inside the white inner card */}
            {isActive && (
              <div className="bf-step-card-inner">
              <div className="bf-step-content">
                {/* Step 0: Your Quote */}
                {i === 0 && (
                  <>
                    <div className="bf-quote-box">
                      <div className="bf-quote-amount">{formatAmount(d.quoteAmount)}</div>
                      <div className="bf-quote-sublabel">The cost of your transportation</div>
                    </div>
                    <div className="bf-field-row">
                      <div className="bf-field" style={{ maxWidth: 280 }}>
                        <label className="bf-field-label">Specimen Type</label>
                        <input type="text" className="bf-field-input" readOnly value={d.specimenType || ''} />
                      </div>
                    </div>
                  </>
                )}

                {/* Step 1: Your Information */}
                {i === 1 && (
                  <>
                    <div className="bf-field-row">
                      <div className="bf-field">
                        <label className="bf-field-label">First Name</label>
                        <input type="text" className="bf-field-input" readOnly value={d.firstName || ''} />
                      </div>
                      <div className="bf-field">
                        <label className="bf-field-label">Last Name</label>
                        <input type="text" className="bf-field-input" readOnly value={d.lastName || ''} />
                      </div>
                    </div>
                    <div className="bf-field-row">
                      <div className="bf-field">
                        <label className="bf-field-label">Date of Birth</label>
                        <input type="text" className="bf-field-input" readOnly value={formatDob(d.dateOfBirth)} />
                      </div>
                    </div>
                    <div className="bf-field-row">
                      <div className="bf-field">
                        <label className="bf-field-label">Email</label>
                        <input type="text" className="bf-field-input" readOnly value={d.email || ''} />
                      </div>
                      <div className="bf-field">
                        <label className="bf-field-label">Phone</label>
                        <input type="text" className="bf-field-input" readOnly value={d.phone || ''} />
                      </div>
                    </div>
                  </>
                )}

                {/* Step 2: Clinic Details */}
                {i === 2 && (
                  <>
                    <div className="bf-clinic-group">
                      <div className="bf-clinic-group-label">Sending Clinic</div>
                      <div className="bf-clinic-card">
                        <div className="bf-clinic-name">{d.sendingClinic?.name || 'Unknown Clinic'}</div>
                        <div className="bf-clinic-address">{formatAddress(d.sendingClinic)}</div>
                      </div>
                    </div>
                    <div className="bf-clinic-group">
                      <div className="bf-clinic-group-label">Receiving Clinic</div>
                      <div className="bf-clinic-card">
                        <div className="bf-clinic-name">{d.receivingClinic?.name || 'Unknown Clinic'}</div>
                        <div className="bf-clinic-address">{formatAddress(d.receivingClinic)}</div>
                      </div>
                    </div>
                    <div className="bf-clinic-group">
                      <div className="bf-clinic-group-label">Referral Clinic</div>
                      <div className="bf-clinic-card">
                        <div className="bf-clinic-name">{d.requestingClinic?.name || 'Unknown Clinic'}</div>
                        <div className="bf-clinic-address">{formatAddress(d.requestingClinic)}</div>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 3: Payment Details */}
                {i === 3 && (
                  <div className="bf-field-row">
                    <div className="bf-field">
                      <label className="bf-field-label">How will the cost of transportation be covered?</label>
                      <select
                        className="bf-field-input bf-select"
                        value={payer}
                        onChange={(e) => setPayer(e.target.value)}
                      >
                        <option value="" disabled>Select an option</option>
                        <option value="Patient">I will be paying</option>
                        <option value="Progyny">I have Progyny benefits</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 4: Partner Information */}
                {i === 4 && (
                  <>
                    <label
                      className={`bf-partner-toggle-bar ${hasPartner ? 'active' : ''}`}
                      onClick={() => setHasPartner(!hasPartner)}
                    >
                      <div className="bf-toggle-left">
                        <input type="checkbox" checked={hasPartner} readOnly />
                        <span className="bf-toggle-text">I&apos;d like to add a partner to this transport</span>
                      </div>
                      <span className={`bf-toggle-icon ${hasPartner ? 'rotated' : ''}`}>&#9660;</span>
                    </label>

                    {hasPartner && (
                      <div className="bf-partner-fields">
                        <div className="bf-field-row">
                          <div className="bf-field">
                            <label className="bf-field-label">First Name</label>
                            <input
                              type="text"
                              className="bf-field-input"
                              value={partner.firstName}
                              onChange={(e) => setPartner({ ...partner, firstName: e.target.value })}
                            />
                          </div>
                          <div className="bf-field">
                            <label className="bf-field-label">Last Name</label>
                            <input
                              type="text"
                              className="bf-field-input"
                              value={partner.lastName}
                              onChange={(e) => setPartner({ ...partner, lastName: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="bf-field-row">
                          <div className="bf-field">
                            <label className="bf-field-label">Date of Birth</label>
                            <input
                              type="date"
                              className="bf-field-input"
                              value={partner.dateOfBirth}
                              onChange={(e) => setPartner({ ...partner, dateOfBirth: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="bf-field-row">
                          <div className="bf-field">
                            <label className="bf-field-label">Email</label>
                            <input
                              type="email"
                              className="bf-field-input"
                              value={partner.email}
                              onChange={(e) => setPartner({ ...partner, email: e.target.value })}
                            />
                          </div>
                          <div className="bf-field">
                            <label className="bf-field-label">Phone</label>
                            <input
                              type="tel"
                              className="bf-field-input"
                              value={partner.phone}
                              onChange={(e) => setPartner({ ...partner, phone: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Navigation buttons */}
                <div className="bf-step-nav">
                  {currentStep > 0 && (
                    <button className="bf-btn-prev" onClick={handlePrev}>Previous</button>
                  )}
                  <div className="bf-step-nav-spacer" />
                  {!isLastStep ? (
                    <button className="bf-btn-next" onClick={handleNext}>Next</button>
                  ) : (
                    <button className="bf-btn-submit" onClick={handleSubmit} disabled={submitting}>
                      {submitting ? (
                        <><span className="bf-spinner" /> Submitting...</>
                      ) : (
                        'Book My Transport'
                      )}
                    </button>
                  )}
                </div>

                {status && (
                  <div className={`bf-status ${status.type}`}>
                    {status.msg}
                  </div>
                )}
              </div>
              </div>
            )}

            {/* Locked overlay */}
            {isLocked && (
              <div className="bf-step-locked">
                <span className="bf-lock-icon">&#128274;</span>
                <span>Complete previous steps first</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
