'use client';

import { useState, useEffect } from 'react';
import OtpStep from '@/components/OtpStep';
import BookingForm from '@/components/BookingForm';
import Success from '@/components/Success';

type Step = 'otp' | 'form' | 'success';

export default function Home() {
  const [step, setStep] = useState<Step>('otp');
  const [token, setToken] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [bookingData, setBookingData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) setToken(t);
  }, []);

  function handleVerified(session: string, data: Record<string, unknown>) {
    setSessionToken(session);
    setBookingData(data);
    setStep('form');
  }

  function handleSuccess() {
    setStep('success');
  }

  if (!token) {
    return (
      <main className="page-main">
        <div className="otp-container">
          <p className="loading-text">Invalid link — no token provided.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-main">
      {step === 'otp' && <OtpStep token={token} onVerified={handleVerified} />}
      {step === 'form' && (
        <BookingForm
          bookingData={bookingData}
          sessionToken={sessionToken}
          bookingToken={token}
          onSuccess={handleSuccess}
        />
      )}
      {step === 'success' && <Success />}
    </main>
  );
}
