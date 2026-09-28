// components/OtpVerificationCard.jsx
import { useEffect, useRef, useState } from 'react';

const RESEND_COOLDOWN_SECONDS = 60;

function OtpVerificationCard({
  title = 'Verify',
  highlightedTitle = 'Email',
  description,
  error,
  isVerifying,
  isResending,
  onSubmit,
  onResend,
  submitLabel = 'Verify & continue',
  resendCooldown = RESEND_COOLDOWN_SECONDS,
  expiresAt, // NEW: ISO string or Date — when this OTP stops being valid, from the backend
}) {



  const inputsRef = useRef([]);
  const [secondsLeft, setSecondsLeft] = useState(resendCooldown);
  const [expirySecondsLeft, setExpirySecondsLeft] = useState(
    expiresAt ? Math.max(0, Math.round((new Date(expiresAt) - Date.now()) / 1000)) : null
  );




  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft > 0]);

  



  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.round((new Date(expiresAt) - Date.now()) / 1000));
      setExpirySecondsLeft(remaining);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);




  const focusNext = (i) => inputsRef.current[i + 1]?.focus();
  const focusPrev = (i) => inputsRef.current[i - 1]?.focus();

  const handleChange = (e, i) => {
    if (e.target.value && i < inputsRef.current.length - 1) focusNext(i);
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !e.target.value && i > 0) focusPrev(i);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = inputsRef.current.map((input) => input.value).join('');
    onSubmit(code);
  };

  const handleResendClick = async () => {
    inputsRef.current.forEach((input) => { if (input) input.value = ''; });
    inputsRef.current[0]?.focus();
    await onResend();
    setSecondsLeft(resendCooldown);
  };

  const canResend = secondsLeft === 0 && !isResending;
  const isExpired = expiresAt && expirySecondsLeft === 0;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, '0')}`;
  };

  return (

    <div className="w-full max-w-sm rounded-lg bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#f4511e]/10">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f4511e" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      </div>

      <h1 className="mb-2 text-2xl font-bold">
        {title} <span className="text-[#f4511e]">{highlightedTitle}</span>
      </h1>
      <p className="mb-2 text-sm text-muted">{description}</p>

      {/* NEW: expiry indicator */}
      {expiresAt && (
        <p className={`mb-2 text-xs ${isExpired ? 'font-semibold text-[#f4511e]' : 'text-muted'}`}>
          {isExpired ? 'Code expired — please resend.' : `Code expires in ${formatTime(expirySecondsLeft)}`}
        </p>
      )}

      {error && <p className="mb-4 text-sm font-medium text-[#f4511e]">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="mb-8 flex justify-center gap-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              disabled={isExpired}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="h-14 w-12 rounded-md border border-line text-center text-lg font-semibold outline-none focus:border-ink disabled:opacity-50"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isVerifying || isExpired}
          className="w-full rounded-md bg-[#f4511e] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isVerifying ? 'Verifying…' : submitLabel}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        {canResend ? (
          <>
            Didn&apos;t receive a code?{' '}
            <button
              type="button"
              onClick={handleResendClick}
              disabled={isResending}
              className="font-semibold text-ink underline disabled:opacity-60"
            >
              {isResending ? 'Sending…' : 'Resend'}
            </button>
          </>
        ) : (
          <>Resend code in <span className="font-semibold text-ink">{formatTime(secondsLeft)}</span></>
        )}
      </p>
    </div>
  );
}

export default OtpVerificationCard;