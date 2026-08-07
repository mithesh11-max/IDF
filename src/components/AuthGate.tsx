import { useState } from 'react';
import { Check, Loader2, Mail, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode = 'choose' | 'signup' | 'signup-otp' | 'signin' | 'phone' | 'phone-otp';

/** Google's official "G" mark — the standard, brand-neutral sign-in icon. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.5 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.9 19 13 24 13c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.5 6.5 29 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.6 2.3-7.2 2.3-5.2 0-9.6-3.4-11.2-8.1l-6.6 5.1C9.5 39 16.2 43.5 24 43.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C40.9 36.4 43.5 30.7 43.5 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

export default function AuthGate({ compact = false }: { compact?: boolean }) {
  const {
    signInWithGoogle,
    signUpWithEmail,
    verifySignupCode,
    signInWithEmail,
    signInWithPhone,
    verifyPhoneCode,
  } = useAuth();
  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const reset = () => {
    setError('');
    setInfo('');
  };

  const submitSignup = async () => {
    reset();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address');
    if (password.length < 6) return setError('Password needs at least 6 characters');
    setBusy(true);
    const { error } = await signUpWithEmail(email, password);
    setBusy(false);
    if (error) return setError(error);
    setInfo(`We've sent a 6-digit code to ${email}`);
    setMode('signup-otp');
  };

  const submitOtp = async () => {
    reset();
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from your email');
    setBusy(true);
    const { error } = await verifySignupCode(email, code);
    setBusy(false);
    if (error) return setError(error);
    // onAuthStateChange in AuthContext picks up the new session automatically.
  };

  const submitSignin = async () => {
    reset();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address');
    if (!password) return setError('Enter your password');
    setBusy(true);
    const { error } = await signInWithEmail(email, password);
    setBusy(false);
    if (error) return setError(error);
  };

  const submitPhone = async () => {
    reset();
    const digits = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(digits)) return setError('Enter a valid 10-digit mobile number');
    setBusy(true);
    const { error } = await signInWithPhone(`+91${digits}`);
    setBusy(false);
    if (error) return setError(error);
    setInfo(`We've texted a 6-digit code to +91 ${digits}`);
    setMode('phone-otp');
  };

  const submitPhoneOtp = async () => {
    reset();
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from your SMS');
    setBusy(true);
    const digits = phone.replace(/\D/g, '');
    const { error } = await verifyPhoneCode(`+91${digits}`, code);
    setBusy(false);
    if (error) return setError(error);
  };

  const inputClass =
    'w-full rounded-[2px] border border-walnut/20 bg-ivory px-3.5 py-3 text-[14px] text-ink placeholder-muted/60 outline-none focus:border-gold-dark';

  return (
    <div className={compact ? '' : 'mx-auto max-w-xs'}>
      {mode === 'choose' && (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-2.5 rounded-[2px] border border-walnut/25 bg-ivory py-3 text-[13px] font-semibold text-ink transition-colors hover:border-gold-dark"
          >
            <GoogleMark />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setMode('phone');
            }}
            className="flex w-full items-center justify-center gap-2.5 rounded-[2px] border border-walnut/25 py-3 text-[13px] font-semibold text-ink transition-colors hover:border-gold-dark"
          >
            <Smartphone className="h-4 w-4" />
            Continue with Phone
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setMode('signin');
            }}
            className="flex w-full items-center justify-center gap-2.5 rounded-[2px] border border-walnut/25 py-3 text-[13px] font-semibold text-ink transition-colors hover:border-gold-dark"
          >
            <Mail className="h-4 w-4" />
            Continue with Email
          </button>
        </div>
      )}

      {mode === 'phone' && (
        <div className="space-y-3">
          <div className="flex rounded-[2px] border border-walnut/20 bg-ivory focus-within:border-gold-dark">
            <span className="flex items-center pl-3.5 text-[14px] text-muted">+91</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              inputMode="numeric"
              className="w-full bg-transparent px-2 py-3 text-[14px] text-ink placeholder-muted/60 outline-none"
            />
          </div>
          {error && <p className="text-[12px] text-maroon">{error}</p>}
          <button type="button" onClick={submitPhone} disabled={busy} className="btn btn-ghost-dark w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Code'}
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setMode('choose');
            }}
            className="w-full text-center text-[12px] text-muted hover:text-ink"
          >
            ← Back
          </button>
        </div>
      )}

      {mode === 'phone-otp' && (
        <div className="space-y-3">
          {info && (
            <p className="flex items-start gap-2 text-[12px] leading-relaxed text-muted">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-dark" />
              {info}
            </p>
          )}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            inputMode="numeric"
            className={`${inputClass} text-center tracking-[0.4em]`}
          />
          {error && <p className="text-[12px] text-maroon">{error}</p>}
          <button type="button" onClick={submitPhoneOtp} disabled={busy} className="btn btn-gold btn-sheen w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Continue'}
          </button>
        </div>
      )}

      {mode === 'signin' && (
        <div className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className={inputClass}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className={inputClass}
          />
          {error && <p className="text-[12px] text-maroon">{error}</p>}
          <button type="button" onClick={submitSignin} disabled={busy} className="btn btn-ghost-dark w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
          </button>
          <p className="text-center text-[12px] text-muted">
            New here?{' '}
            <button
              type="button"
              onClick={() => {
                reset();
                setMode('signup');
              }}
              className="font-semibold text-gold-dark hover:underline"
            >
              Create an account
            </button>
          </p>
        </div>
      )}

      {mode === 'signup' && (
        <div className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className={inputClass}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a password"
            type="password"
            className={inputClass}
          />
          {error && <p className="text-[12px] text-maroon">{error}</p>}
          <button type="button" onClick={submitSignup} disabled={busy} className="btn btn-ghost-dark w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Verification Code'}
          </button>
          <p className="text-center text-[12px] text-muted">
            Have an account?{' '}
            <button
              type="button"
              onClick={() => {
                reset();
                setMode('signin');
              }}
              className="font-semibold text-gold-dark hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      )}

      {mode === 'signup-otp' && (
        <div className="space-y-3">
          {info && (
            <p className="flex items-start gap-2 text-[12px] leading-relaxed text-muted">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-dark" />
              {info}
            </p>
          )}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            inputMode="numeric"
            className={`${inputClass} text-center tracking-[0.4em]`}
          />
          {error && <p className="text-[12px] text-maroon">{error}</p>}
          <button type="button" onClick={submitOtp} disabled={busy} className="btn btn-gold btn-sheen w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Continue'}
          </button>
        </div>
      )}
    </div>
  );
}
