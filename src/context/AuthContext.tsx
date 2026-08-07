import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { fetchProfile, upsertProfile, type CustomerProfile } from '../lib/customerApi';

interface Result {
  error?: string;
}

interface AuthValue {
  /** The signed-in customer, or null. Always null when Supabase isn't configured. */
  user: User | null;
  /** The customer's saved profile (name/phone/city) — null until loaded or signed out. */
  profile: CustomerProfile | null;
  /** True while the initial session check is in flight. */
  loading: boolean;
  /** Whether accounts are switched on at all (Supabase configured). */
  enabled: boolean;
  signInWithGoogle: () => Promise<void>;
  /** Step 1 of email signup: creates the account and emails a 6-digit code. */
  signUpWithEmail: (email: string, password: string) => Promise<Result>;
  /** Step 2: confirms the code from signUpWithEmail and completes sign-in. */
  verifySignupCode: (email: string, code: string) => Promise<Result>;
  /** Returning customer with an already-verified email. */
  signInWithEmail: (email: string, password: string) => Promise<Result>;
  /** Step 1 of phone sign-in: texts a 6-digit code. Needs an SMS provider
   *  configured in Supabase — see HANDOVER.md. */
  signInWithPhone: (phone: string) => Promise<Result>;
  /** Step 2: confirms the code from signInWithPhone. */
  verifyPhoneCode: (phone: string, code: string) => Promise<Result>;
  /** Saves name/phone/city against the signed-in account. */
  saveProfile: (fields: Partial<CustomerProfile>) => Promise<Result>;
  signOut: () => Promise<void>;
  /** Any component can call this to pop the sign-in modal — e.g. tapping a
   *  wishlist heart while signed out. Rendered once, at the top of the app. */
  authModalOpen: boolean;
  requestSignIn: () => void;
  closeAuthModal: () => void;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const loadProfile = async (u: User | null) => {
    if (!u) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile();
    setProfile(p);
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      loadProfile(u).finally(() => setLoading(false));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      loadProfile(u);
      if (u) setAuthModalOpen(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
  };

  const signUpWithEmail = async (email: string, password: string): Promise<Result> => {
    if (!supabase) return { error: 'Accounts are not set up on this site yet.' };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message };
  };

  const verifySignupCode = async (email: string, code: string): Promise<Result> => {
    if (!supabase) return { error: 'Accounts are not set up on this site yet.' };
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
    if (!error) await upsertProfile({ email, signup_method: 'email' });
    return { error: error?.message };
  };

  const signInWithEmail = async (email: string, password: string): Promise<Result> => {
    if (!supabase) return { error: 'Accounts are not set up on this site yet.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };

  const signInWithPhone = async (phone: string): Promise<Result> => {
    if (!supabase) return { error: 'Accounts are not set up on this site yet.' };
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error: error?.message };
  };

  const verifyPhoneCode = async (phone: string, code: string): Promise<Result> => {
    if (!supabase) return { error: 'Accounts are not set up on this site yet.' };
    const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
    if (!error) await upsertProfile({ phone, signup_method: 'phone' });
    return { error: error?.message };
  };

  const saveProfile = async (fields: Partial<CustomerProfile>): Promise<Result> => {
    if (!supabase || !user) return { error: 'Not signed in.' };
    const updated = await upsertProfile(fields);
    if (updated) setProfile(updated);
    return {};
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider
      value={{
        user,
        profile,
        loading,
        enabled: isSupabaseConfigured,
        signInWithGoogle,
        signUpWithEmail,
        verifySignupCode,
        signInWithEmail,
        signInWithPhone,
        verifyPhoneCode,
        saveProfile,
        signOut,
        authModalOpen,
        requestSignIn: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
