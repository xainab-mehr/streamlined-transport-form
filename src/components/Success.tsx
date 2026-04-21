'use client';

export default function Success() {
  return (
    <div className="success-container">
      <div className="success-icon">&#10003;</div>
      <div className="success-title">Transport Booked!</div>
      <div className="success-msg">
        Your transport request has been submitted successfully.<br />
        Our team will reach out with next steps.
      </div>
    </div>
  );
}
