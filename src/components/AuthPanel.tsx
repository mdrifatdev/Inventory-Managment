import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  LogOut,
  LogIn,
  UserPlus,
  ShieldAlert,
  Database,
  CheckCircle,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthPanelProps {
  sessionUser: SupabaseUser | null;
  isOfflineModeEnabled: boolean;
  onViewChange: (view: string) => void;
}

export default function AuthPanel({
  sessionUser,
  isOfflineModeEnabled,
  onViewChange,
}: AuthPanelProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = getSupabaseClient();
  const isSyncConfigured = !!supabase;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSyncConfigured || !supabase) {
      setMessage({
        type: 'error',
        text: 'Supabase client is not initialized. Please verify your URL and Anon Key in Settings first.',
      });
      return;
    }
    if (!email.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        if (data.user && data.session === null) {
          setMessage({ type: 'success', text: 'Account created! Check your email to verify.' });
        } else {
          setMessage({ type: 'success', text: 'Sign up successful! You are now logged in.' });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        setMessage({ type: 'success', text: `Welcome back, ${data.user?.email}!` });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Authentication failed. Check your credentials.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setMessage({ type: 'success', text: 'Signed out successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to sign out.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-12 animate-fade-in">

      {/* Page heading */}
      <div className="mb-6">
        <h2 className="font-bold text-xl text-text-primary tracking-tight">
          {sessionUser ? 'Account Profile' : 'Authentication'}
        </h2>
        <p className="text-xs text-text-secondary mt-1 leading-relaxed">
          {sessionUser
            ? 'Manage your active session and database permissions.'
            : 'Sign in to sync inventory data with your Supabase backend.'}
        </p>
      </div>

      {/* Alert message */}
      {message && (
        <div
          className={`mb-4 flex items-start gap-3 px-4 py-3 rounded-xl border text-xs font-medium leading-relaxed
            ${message.type === 'success'
              ? 'bg-success-light text-success border-success/20'
              : 'bg-warning-light text-warning-primary border-warning-primary/20'
            }`}
        >
          {message.type === 'success'
            ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            : <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          }
          <span>{message.text}</span>
        </div>
      )}

      {sessionUser ? (
        /* ── Logged-in state ────────────────────────────────────────────── */
        <div className="rounded-2xl border border-border-subtle bg-card overflow-hidden">
          {/* Avatar header */}
          <div className="px-6 pt-8 pb-6 flex flex-col items-center gap-3 border-b border-border-subtle bg-gradient-to-b from-brand-light/40 to-transparent">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-brand-light flex items-center justify-center">
                <User className="h-8 w-8 text-brand" />
              </div>
              <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-success border-2 border-card" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-text-primary">Active Session</p>
              <p className="text-[10px] font-mono text-text-muted mt-0.5 break-all">{sessionUser.email}</p>
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-4 divide-y divide-border-subtle">
            <div className="flex justify-between items-center py-2.5 text-xs">
              <span className="text-text-secondary font-medium">Provider</span>
              <span className="bg-brand-light text-brand text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                {sessionUser.app_metadata?.provider || 'Email'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5 text-xs">
              <span className="text-text-secondary font-medium">Last Sign-In</span>
              <span className="font-mono text-text-secondary text-[10px]">
                {sessionUser.last_sign_in_at
                  ? new Date(sessionUser.last_sign_in_at).toLocaleString()
                  : 'Just now'}
              </span>
            </div>
            <div className="flex justify-between items-start py-2.5 text-xs gap-4">
              <span className="text-text-secondary font-medium shrink-0">User ID</span>
              <span className="font-mono text-text-muted text-[10px] text-right break-all">{sessionUser.id}</span>
            </div>
          </div>

          {/* Sign-out */}
          <div className="px-6 pb-6 pt-2">
            <button
              id="auth-signout-btn"
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-warning-light text-warning-primary hover:brightness-95 font-bold text-xs transition-all cursor-pointer border border-warning-primary/15 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>

      ) : (
        /* ── Sign-in / Sign-up ──────────────────────────────────────────── */
        <div className="rounded-2xl border border-border-subtle bg-card overflow-hidden shadow-sm">

          {/* Card header banner */}
          <div className="px-6 pt-7 pb-5 border-b border-border-subtle bg-gradient-to-br from-brand-light/50 via-brand-light/20 to-transparent">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl bg-brand flex items-center justify-center shrink-0">
                <Zap className="h-4.5 w-4.5 text-white fill-none stroke-current" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary leading-none">Electric Inventory</p>
                <p className="text-[10px] text-text-muted mt-0.5">Secure cloud authentication</p>
              </div>
            </div>
            {/* Segmented tab */}
            <div className="flex bg-inputbg p-1 rounded-xl gap-1">
              <button
                id="auth-toggle-signin-btn"
                type="button"
                onClick={() => { setIsSignUp(false); setMessage(null); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                  ${!isSignUp ? 'bg-white text-text-primary shadow-sm dark:bg-border-accent' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Sign In
              </button>
              <button
                id="auth-toggle-signup-btn"
                type="button"
                onClick={() => { setIsSignUp(true); setMessage(null); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                  ${isSignUp ? 'bg-white text-text-primary shadow-sm dark:bg-border-accent' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Form body */}
          <div className="px-6 py-6">

            {/* Unconfigured warning */}
            {!isSyncConfigured && (
              <div className="mb-5 flex gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                <Database className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400">Backend not configured</p>
                  <p className="text-[10.5px] text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                    Add your Supabase credentials in Settings to enable authentication.
                  </p>
                  <button
                    id="auth-goto-settings-btn"
                    type="button"
                    onClick={() => onViewChange('settings')}
                    className="text-[11px] font-bold underline text-amber-700 dark:text-amber-400 hover:opacity-80 mt-1 cursor-pointer"
                  >
                    Open Settings &rarr;
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="auth-email-input"
                  className="text-[10px] font-bold font-mono text-text-muted uppercase tracking-widest"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    disabled={loading || !isSyncConfigured}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-inputbg border border-border-subtle text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="auth-password-input"
                  className="text-[10px] font-bold font-mono text-text-muted uppercase tracking-widest"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
                  <input
                    id="auth-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={loading || !isSyncConfigured}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? 'Minimum 6 characters' : '••••••••'}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-inputbg border border-border-subtle text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all disabled:opacity-50"
                  />
                  <button
                    id="auth-toggle-password-view"
                    type="button"
                    disabled={loading || !isSyncConfigured}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading || !isSyncConfigured}
                className="mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand hover:brightness-105 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-40"
              >
                {isSignUp ? (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-3.5 w-3.5" />
                    <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Card footer */}
          <div className="px-6 pb-5 border-t border-border-subtle pt-4">
            <p className="text-[10.5px] text-text-muted text-center leading-relaxed">
              {isSignUp
                ? 'Your account will be stored in your connected Supabase auth tables.'
                : 'Sign in to enable cloud sync for your inventory data.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
