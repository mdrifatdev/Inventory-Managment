import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  LogOut,
  LogIn,
  UserPlus,
  ShieldAlert,
  CheckCircle,
  Eye,
  EyeOff,
  Zap,
  Sun,
  Moon,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface AuthPanelProps {
  sessionUser: SupabaseUser | null;
  isOfflineModeEnabled: boolean;
  onViewChange: (view: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function AuthPanel({
  sessionUser,
  onViewChange,
  isDarkMode,
  onToggleDarkMode,
}: AuthPanelProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const isOnline = useOnlineStatus();

  const supabase = getSupabaseClient();
  const isSyncConfigured = !!supabase;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSyncConfigured || !supabase) {
      setMessage({
        type: 'error',
        text: 'Supabase is not configured. Check your .env file.',
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
      setMessage({ type: 'error', text: err.message || 'Authentication failed.' });
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

  const isForceOffline = localStorage.getItem('force_offline') === 'true';

  return (
    <div className="max-w-md mx-auto pb-12 animate-fade-in space-y-4">

      {/* Page heading */}
      <div>
        <h2 className="font-bold text-lg text-text-primary tracking-tight">
          {isForceOffline ? 'Offline Mode' : sessionUser ? 'Account' : 'Sign In'}
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          {isForceOffline
            ? 'Running locally in your browser.'
            : sessionUser
              ? 'Manage your session and preferences.'
              : 'Sign in to manage your inventory.'}
        </p>
      </div>

      {/* Alert message */}
      {message && (
        <div
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-xs font-medium leading-relaxed
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

      {isForceOffline ? (
        /* ── Offline Mode Panel ────────────────────────────────────── */
        <div className="rounded-xl border border-border-subtle bg-card overflow-hidden">
          <div className="px-5 pt-6 pb-5 flex flex-col items-center gap-2.5 border-b border-border-subtle bg-gradient-to-b from-warning-light/35 to-transparent">
            <div className="relative">
              <div className="h-14 w-14 rounded-full bg-warning-light flex items-center justify-center">
                <WifiOff className="h-7 w-7 text-warning-primary" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-text-primary">Offline / Local Mode Enabled</p>
              <p className="text-[10px] text-text-secondary mt-0.5">Your inventory data is stored locally in your browser.</p>
            </div>
          </div>

          <div className="px-5 py-3 divide-y divide-border-subtle">
            <div className="flex justify-between items-center py-2.5 text-xs">
              <span className="text-text-secondary">Storage</span>
              <span className="bg-warning-light text-warning-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                LocalStorage (Offline)
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5 text-xs">
              <span className="text-text-secondary">Status</span>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-warning-primary">
                <WifiOff className="h-3.5 w-3.5" /> Forced Offline
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5 text-xs">
              <span className="text-text-secondary">Theme</span>
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                {isDarkMode
                  ? <><Moon className="h-3.5 w-3.5 text-brand" /> Dark Mode</>
                  : <><Sun className="h-3.5 w-3.5 text-amber-500" /> Light Mode</>
                }
              </button>
            </div>
          </div>

          <div className="px-5 pb-5 pt-2">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('force_offline');
                window.location.reload();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand text-white hover:brightness-105 font-bold text-xs transition-all cursor-pointer shadow-sm"
            >
              <Wifi className="h-3.5 w-3.5" />
              <span>Enable Cloud Sync Mode</span>
            </button>
          </div>
        </div>
      ) : sessionUser ? (
        /* ── Logged-in state ────────────────────────────────────── */
        <div className="rounded-xl border border-border-subtle bg-card overflow-hidden">
          {/* Avatar header */}
          <div className="px-5 pt-6 pb-5 flex flex-col items-center gap-2.5 border-b border-border-subtle bg-gradient-to-b from-brand-light/30 to-transparent">
            <div className="relative">
              <div className="h-14 w-14 rounded-full bg-brand-light flex items-center justify-center">
                <User className="h-7 w-7 text-brand" />
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-card" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-text-primary">Active Session</p>
              <p className="text-[10px] font-mono text-text-muted mt-0.5 break-all">{sessionUser.email}</p>
            </div>
          </div>

          {/* Details */}
          <div className="px-5 py-3 divide-y divide-border-subtle">
            <div className="flex justify-between items-center py-2.5 text-xs">
              <span className="text-text-secondary">Provider</span>
              <span className="bg-brand-light text-brand text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                {sessionUser.app_metadata?.provider || 'Email'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5 text-xs">
              <span className="text-text-secondary">Last Sign-In</span>
              <span className="font-mono text-text-muted text-[10px]">
                {sessionUser.last_sign_in_at
                  ? new Date(sessionUser.last_sign_in_at).toLocaleString()
                  : 'Just now'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5 text-xs">
              <span className="text-text-secondary">Status</span>
              <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${isOnline ? 'text-emerald-600' : 'text-red-500'}`}>
                {isOnline
                  ? <><Wifi className="h-3.5 w-3.5" /> Online</>
                  : <><WifiOff className="h-3.5 w-3.5" /> Offline</>
                }
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5 text-xs">
              <span className="text-text-secondary">Theme</span>
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                {isDarkMode
                  ? <><Moon className="h-3.5 w-3.5 text-brand" /> Dark Mode</>
                  : <><Sun className="h-3.5 w-3.5 text-amber-500" /> Light Mode</>
                }
              </button>
            </div>
          </div>

          {/* Sign-out */}
          <div className="px-5 pb-5 pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-warning-light text-warning-primary hover:brightness-95 font-bold text-xs transition-all cursor-pointer border border-warning-primary/15 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>

      ) : (
        /* ── Sign-in / Sign-up ──────────────────────────────────── */
        <div className="rounded-xl border border-border-subtle bg-card overflow-hidden shadow-sm">

          {/* Card header */}
          <div className="px-5 pt-6 pb-4 border-b border-border-subtle bg-gradient-to-br from-brand-light/40 via-brand-light/15 to-transparent">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-white fill-none stroke-current" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary leading-none">Electric Inventory</p>
                <p className="text-[10px] text-text-muted mt-0.5">Secure authentication</p>
              </div>
            </div>
            {/* Segmented tab */}
            <div className="flex bg-pagebg p-1 rounded-lg gap-1">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setMessage(null); }}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer
                  ${!isSignUp ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setMessage(null); }}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer
                  ${isSignUp ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="px-5 py-5">
            {!isSyncConfigured && (
              <div className="mb-4 flex gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Supabase is not configured. Add your credentials in the <code className="font-mono font-bold">.env</code> file.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
                  <input
                    type="email"
                    required
                    disabled={loading || !isSyncConfigured}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-pagebg border border-border-subtle text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/10 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={loading || !isSyncConfigured}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? 'Minimum 6 characters' : '••••••••'}
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-pagebg border border-border-subtle text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/10 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={loading || !isSyncConfigured}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isSyncConfigured}
                className="mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand hover:brightness-105 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-40"
              >
                {isSignUp ? (
                  <><UserPlus className="h-3.5 w-3.5" /><span>{loading ? 'Creating Account...' : 'Create Account'}</span></>
                ) : (
                  <><LogIn className="h-3.5 w-3.5" /><span>{loading ? 'Signing In...' : 'Sign In'}</span></>
                )}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-border-subtle"></div>
                <span className="flex-shrink mx-3 text-[10px] text-text-muted font-bold uppercase">Or</span>
                <div className="flex-grow border-t border-border-subtle"></div>
              </div>

              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('force_offline', 'true');
                  window.location.reload();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-pagebg hover:bg-border-subtle text-text-secondary hover:text-text-primary font-bold text-xs transition-all cursor-pointer border border-border-subtle"
              >
                <span>Continue in Local Offline Mode</span>
              </button>
            </form>
          </div>

          <div className="px-5 pb-4 border-t border-border-subtle pt-3">
            <p className="text-[10px] text-text-muted text-center leading-relaxed">
              {isSignUp
                ? 'Your account will be stored in your Supabase auth system.'
                : 'Sign in to enable cloud sync for your inventory.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
