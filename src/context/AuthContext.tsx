import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface Result {
  error?: string;
}

interface AuthValue {
  /** The signed-in customer, or null. Always null when Supabase isn't configured. */
  user: User | null;
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
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
    return { error: error?.message };
  };

  const signInWithEmail = async (email: string, password: string): Promise<Result> => {
    if (!supabase) return { error: 'Accounts are not set up on this site yet.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        enabled: isSupabaseConfigured,
        signInWithGoogle,
        signUpWithEmail,
        verifySignupCode,
        signInWithEmail,
        signOut,
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
