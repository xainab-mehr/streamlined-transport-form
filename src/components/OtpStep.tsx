'use client';

import { useState, useRef, useEffect } from 'react';
import { apiPost } from '@/lib/api';

interface InitResponse {
  success: boolean;
  data?: { firstName: string; maskedPhone: string };
  message?: string;
}

interface VerifyResponse {
  success: boolean;
  sessionToken?: string;
  data?: Record<string, unknown>;
  message?: string;
}

interface OtpStepProps {
  token: string;
  onVerified: (sessionToken: string, bookingData: Record<string, unknown>) => void;
}

export default function OtpStep({ token, onVerified }: OtpStepProps) {
  const [firstName, setFirstName] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'init' | 'send' | 'verify'>('init');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      try {
        const data = await apiPost<InitResponse>('/api/booking/init', { token });
        if (data.success && data.data) {
          setFirstName(data.data.firstName);
          setMaskedPhone(data.data.maskedPhone);
          setStep('send');
        } else {
          setError(data.message || 'This link is invalid or expired.');
        }
      } catch {
        setError('Something went wrong. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [token]);

  async function sendCode() {
    setSending(true);
    setStatus(null);
    try {
      const data = await apiPost<{ success: boolean; message?: string }>('/api/booking/send-otp', { token });
      if (data.success) {
        setStatus({ msg: 'Code sent! Check your phone.', type: 'success' });
        setStep('verify');
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        setStatus({ msg: data.message || 'Failed to send code.', type: 'error' });
      }
    } catch {
      setStatus({ msg: 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setSending(false);
    }
  }

  async function verifyCode() {
    if (code.length !== 6) {
      setStatus({ msg: 'Please enter the 6-digit code.', type: 'error' });
      return;
    }
    setVerifying(true);
    setStatus(null);
    try {
      const data = await apiPost<VerifyResponse>('/api/booking/verify-otp', { token, code });
      if (data.success && data.sessionToken && data.data) {
        setStatus({ msg: 'Verified! Loading your booking form...', type: 'success' });
        setTimeout(() => onVerified(data.sessionToken!, data.data!), 800);
      } else {
        setStatus({ msg: data.message || 'Invalid code.', type: 'error' });
        setVerifying(false);
      }
    } catch {
      setStatus({ msg: 'Something went wrong. Please try again.', type: 'error' });
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="otp-container">
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="otp-container">
        <p className="loading-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="otp-container">
      <img src="/cf-logo.png" alt="CryoFuture" className="otp-logo" />

      <div className="otp-greeting">
        {firstName ? `Hi ${firstName},` : 'Hi,'}
      </div>

      <p className="otp-subtitle">
        To access your booking form, we need to verify your identity.
        We&apos;ll send a verification code to your phone number on file
      </p>

      <div className="otp-phone-badge">
        <div className="otp-phone-label">Phone Number on file</div>
        <div className="otp-phone-number">{maskedPhone}</div>
      </div>

      {step === 'send' && (
        <button className="otp-btn" onClick={sendCode} disabled={sending}>
          {sending ? (
            <><span className="otp-spinner" /> Sending...</>
          ) : (
            'Send Verification Code'
          )}
        </button>
      )}

      {step === 'verify' && (
        <div className="otp-verify-section">
          <input
            ref={inputRef}
            type="text"
            className="otp-code-input"
            maxLength={6}
            placeholder="000000"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
          />
          <button className="otp-btn" onClick={verifyCode} disabled={verifying}>
            {verifying ? (
              <><span className="otp-spinner" /> Verifying...</>
            ) : (
              'Verify & Continue'
            )}
          </button>
          <p className="otp-resend">
            Didn&apos;t receive the code?{' '}
            <a onClick={sendCode} className="otp-resend-link">Resend</a>
          </p>
        </div>
      )}

      {status && (
        <div className={`otp-status ${status.type}`}>
          {status.msg}
        </div>
      )}

      <p className="otp-security-note">
        This is to keep your information protected. Your<br />
        information will only be shown after verification
      </p>
    </div>
  );
}
