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
  EyeOff
} from 'lucide-react';
import { getSupabaseClient } from '../supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthPanelProps {
  sessionUser: SupabaseUser | null;
  isOfflineModeEnabled: boolean;
  onViewChange: (view: string) => void;
}

export default function AuthPanel({ 
  sessionUser, 
  isOfflineModeEnabled,
  onViewChange
}: AuthPanelProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = getSupabaseClient();

  // If supabase client cannot be initialized due to missing keys or force_offline
  const isSyncConfigured = !!supabase;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSyncConfigured || !supabase) {
      setMessage({ 
        type: 'error', 
        text: 'Supabase client is not initialized. Please verify your URL and Anon Key in Settings first.' 
      });
      return;
    }

    if (!email.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all credentials fields.' });
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

        if (error) {
          throw error;
        }

        if (data.user && data.session === null) {
          setMessage({
            type: 'success',
            text: 'Account created! Please check your email inbox to verify your account or sign in directly.'
          });
        } else {
          setMessage({
            type: 'success',
            text: 'Sign up successful! You are now logged in.'
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          throw error;
        }

        setMessage({
          type: 'success',
          text: `Welcome back! Logged in successfully as ${data.user?.email}.`
        });
      }
    } catch (err: any) {
      console.error('Authentication process failed:', err);
      setMessage({
        type: 'error',
        text: err.message || 'Authentication failed. Please check your credentials.'
      });
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
    <div className="max-w-md mx-auto space-y-6 pb-12 animate-fade-in">
      {/* View Header */}
      <div>
        <h2 className="font-sans font-extrabold text-2xl text-text-primary dark:text-zinc-100 tracking-tight">
          {sessionUser ? 'Your Profile' : 'Supabase Authentication'}
        </h2>
        <p className="text-xs text-text-secondary font-sans mt-0.5">
          {sessionUser 
            ? 'Account profile details and database permissions' 
            : 'Access synchronized real-time tables secure backup endpoints'
          }
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800' 
            : 'bg-warning-light text-warning-primary border-warning-primary/10 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          ) : (
            <ShieldAlert className="h-5 w-5 shrink-0 text-warning-primary dark:text-red-400 mt-0.5" />
          )}
          <div className="text-xs font-sans font-semibold leading-relaxed">
            {message.text}
          </div>
        </div>
      )}

      {sessionUser ? (
        /* Logged In View */
        <div className="bg-white border border-border-subtle rounded-3xl p-6 md:p-8 space-y-6 shadow-xs animate-fade-in">
          <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-border-subtle">
            <div className="bg-brand-light p-4 rounded-full text-brand relative">
              <User className="h-10 w-10" />
              <div className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-md text-text-primary dark:text-zinc-200">
                Active Session
              </h3>
              <p className="text-[11px] font-mono text-text-secondary mt-0.5">
                UID: {sessionUser.id}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs py-1">
              <span className="text-text-secondary font-medium font-sans">User Email</span>
              <span className="text-text-primary font-bold font-mono text-right">{sessionUser.email}</span>
            </div>

            <div className="flex justify-between items-center text-xs py-1">
              <span className="text-text-secondary font-medium font-sans">Provider</span>
              <span className="bg-brand-light text-brand text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                {sessionUser.app_metadata?.provider || 'Email/Password'}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs py-1">
              <span className="text-text-secondary font-medium font-sans">Last Sign-In</span>
              <span className="text-text-secondary font-mono text-right">
                {sessionUser.last_sign_in_at ? new Date(sessionUser.last_sign_in_at).toLocaleString() : 'Just now'}
              </span>
            </div>
          </div>

          <button
            id="auth-signout-btn"
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-warning-light text-warning-primary hover:brightness-95 active:scale-[0.98] font-sans font-bold text-xs transition-all cursor-pointer border border-warning-primary/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{loading ? 'Signing out...' : 'Sign Out of Session'}</span>
          </button>
        </div>
      ) : (
        /* Sign In / Sign Up Form */
        <div className="bg-white border border-border-subtle rounded-3xl p-6 md:p-8 space-y-6 shadow-xs animate-fade-in">
          
          {/* Custom Info Warning block if not connected */}
          {!isSyncConfigured && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/15 border border-amber-200/50 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 flex gap-2.5">
              <Database className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-sans font-bold">Unconfigured Backend Context</h4>
                <p className="text-[11px] font-sans leading-relaxed text-amber-700 dark:text-amber-300">
                  Authentication requires an active remote connection. Go to settings, supply your credentials, and turn off "Forced Offline" mode to enable security.
                </p>
                <button
                  id="auth-goto-settings-btn"
                  type="button"
                  onClick={() => onViewChange('settings')}
                  className="text-xs font-sans font-bold underline hover:opacity-80 block mt-1 cursor-pointer"
                >
                  Configure Cloud Settings →
                </button>
              </div>
            </div>
          )}

          <div className="flex bg-sidebarbg p-1 rounded-2xl">
            <button
              id="auth-toggle-signin-btn"
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setMessage(null);
              }}
              className={`flex-1 text-center py-2 rounded-xl text-xs font-sans font-bold cursor-pointer transition-all ${
                !isSignUp 
                  ? 'bg-white text-text-primary shadow-xs dark:bg-zinc-800' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-toggle-signup-btn"
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setMessage(null);
              }}
              className={`flex-1 text-center py-2 rounded-xl text-xs font-sans font-bold cursor-pointer transition-all ${
                isSignUp 
                  ? 'bg-white text-text-primary shadow-xs dark:bg-zinc-800' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sign Up / Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="auth-email-input" className="text-[11px] font-mono font-bold text-text-secondary block uppercase">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text-secondary">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  disabled={loading || !isSyncConfigured}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-sidebarbg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-white focus:outline-none transition-all rounded-xl pl-10 pr-4 py-2.5 font-sans text-xs text-text-primary disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="auth-password-input" className="text-[11px] font-mono font-bold text-text-secondary block uppercase">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text-secondary">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading || !isSyncConfigured}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? 'Choose a strong password (min 6 characters)' : '••••••••'}
                  className="w-full bg-sidebarbg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-white focus:outline-none transition-all rounded-xl pl-10 pr-10 py-2.5 font-sans text-xs text-text-primary disabled:opacity-50"
                />
                <button
                  id="auth-toggle-password-view"
                  type="button"
                  disabled={loading || !isSyncConfigured}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading || !isSyncConfigured}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-brand hover:brightness-105 active:scale-[0.98] text-white font-sans font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-40"
            >
              {isSignUp ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>{loading ? 'Creating Account...' : 'Sign Up & Register'}</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>{loading ? 'Verifying Session...' : 'Sign In with Email'}</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-text-secondary font-sans leading-relaxed text-center">
            {isSignUp 
              ? 'By creating an account, you will register your user profile inside your connected Supabase auth tables.' 
              : 'Sign in to let your local storage sync securely with your cloud DB user data tables.'
            }
          </p>

        </div>
      )}
    </div>
  );
}
