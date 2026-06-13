import React, { useState, useEffect } from 'react';
import { 
  Sun,
  Moon,
  Database,
  Save,
  CheckCircle2,
  AlertCircle,
  Zap,
  RefreshCw
} from 'lucide-react';
import { loadSettings, saveSettings, fetchProducts, getSupabaseClient } from '../lib/supabaseClient';
import { Settings } from '../types';

interface SettingsPanelProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSettingsSaved: () => void;
  isOfflineModeEnabled: boolean;
  onToggleOfflineMode: () => void;
}

export default function SettingsPanel({ 
  isDarkMode, 
  onToggleDarkMode, 
  onSettingsSaved,
  isOfflineModeEnabled,
  onToggleOfflineMode
}: SettingsPanelProps) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const current = loadSettings();
    setSupabaseUrl(current.supabaseUrl || '');
    setSupabaseAnonKey(current.supabaseAnonKey || '');
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const updated: Settings = {
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      cloudinaryCloudName: loadSettings().cloudinaryCloudName || '', 
      cloudinaryUploadPreset: loadSettings().cloudinaryUploadPreset || '',
    };

    try {
      saveSettings(updated);
      
      if (updated.supabaseUrl && updated.supabaseAnonKey) {
        setMsg({ type: 'success', text: 'Validating Supabase connection...' });
        try {
          const supabase = getSupabaseClient();
          if (!supabase) throw new Error("Supabase client failed to initialize.");
          const { error } = await supabase.from('products').select('id').limit(1);
          if (error) throw error;
          
          setMsg({ type: 'success', text: 'Backend Sync Active! Successfully connected to your Supabase tables.' });
        } catch (dbErr) {
          console.error("Database connection check failed", dbErr);
          setMsg({ 
            type: 'error', 
            text: 'Credentials saved, but verification failed. Ensure your tables (products, inventory_logs) exist and allow public access.' 
          });
        }
      } else {
        setMsg({ type: 'success', text: 'Settings updated. Running in localized storage sync mode.' });
      }

      onSettingsSaved();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update credentials. Please check input formats.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* Title */}
      <div>
        <h2 className="font-sans font-bold text-text-primary text-2xl tracking-tight">
          Settings & Preferences
        </h2>
        <p className="text-xs text-text-secondary font-sans mt-0.5">
          Customize your application workspace and hook up your remote cloud synchronizer.
        </p>
      </div>

      {/* Supabase Connection Setup */}
      <form onSubmit={handleSave} className="bg-white border border-border-subtle rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
          <div className="bg-[#3ecf8e]/10 p-2 rounded-full text-[#3ecf8e] shrink-0">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-text-primary">Supabase Database Integration</h3>
            <p className="text-xs text-text-secondary">Provide credentials to persist electrical products and history logs on cloud</p>
          </div>
        </div>

        {msg && (
          <div className={`p-4 rounded-xl flex items-start gap-2.5 border ${
            msg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-warning-light text-warning-primary border-warning-light/30'
          }`}>
            {msg.type === 'success' ? (
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-warning-primary mt-0.5 animate-pulse" />
            )}
            <p className="text-xs font-sans font-semibold leading-relaxed">{msg.text}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="set-sub-url" className="text-[11px] font-mono font-bold text-text-secondary block">
                SUPABASE URL
              </label>
              {((import.meta as any).env.VITE_SUPABASE_URL || "").trim() && !supabaseUrl && (
                <span className="text-[10px] text-text-secondary font-sans italic">Using default system environment</span>
              )}
            </div>
            <input 
              id="set-sub-url"
              type="url" 
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full bg-sidebarbg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-white focus:outline-none transition-all rounded-xl px-4 py-2.5 font-mono text-xs text-text-primary"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="set-sub-key" className="text-[11px] font-mono font-bold text-text-secondary block">
                SUPABASE PUBLIC ANON KEY
              </label>
              {((import.meta as any).env.VITE_SUPABASE_ANON_KEY || "").trim() && !supabaseAnonKey && (
                <span className="text-[10px] text-text-secondary font-sans italic">Using default system environment</span>
              )}
            </div>
            <input 
              id="set-sub-key"
              type="password" 
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-sidebarbg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-white focus:outline-none transition-all rounded-xl px-4 py-2.5 font-mono text-xs text-text-primary"
            />
          </div>

          {/* Sync Mode Toggle Option */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-sidebarbg/40 border border-border-subtle rounded-2xl gap-3">
            <div>
              <h4 className="font-sans font-bold text-xs text-text-primary">Cloud Connection Preference</h4>
              <p className="text-[10.5px] text-text-secondary mt-0.5 max-w-md leading-relaxed font-sans">
                Set cache sync preference. Toggle to <strong className="text-amber-600 dark:text-amber-500 font-bold">Offline Only</strong> to operate strictly locally, or <strong className="text-emerald-600 dark:text-emerald-500 font-bold">Online Connection</strong> to stream records with Supabase.
              </p>
            </div>
            <button
              id="settings-offline-toggle"
              type="button"
              onClick={onToggleOfflineMode}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isOfflineModeEnabled ? 'bg-amber-500/80' : 'bg-emerald-500/80'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                  isOfflineModeEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-secondary">
            <Zap className={`h-3 w-3 ${supabaseUrl && supabaseAnonKey ? 'text-[#3ecf8e]' : 'text-text-secondary'}`} />
            <span>{supabaseUrl && supabaseAnonKey ? 'Ready to sync cloud records' : 'Offline local database mode active'}</span>
          </div>

          <button
            id="save-settings-btn"
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-full bg-brand hover:brightness-105 active:scale-[0.98] text-white font-sans font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            {saving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>{saving ? 'Testing Connection...' : 'Save & Sync Backend'}</span>
          </button>
        </div>
      </form>

      {/* Appearance Customization */}
      <div className="bg-white border border-border-subtle rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-brand-light p-2.5 rounded-full text-brand shrink-0">
            {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-text-primary">Theme Appearance</h3>
            <p className="text-xs text-text-secondary">Switch between dark slate workspace and light ambient display themes</p>
          </div>
        </div>

        <button
          id="toggle-theme-btn"
          type="button"
          onClick={onToggleDarkMode}
          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-brand-light dark:bg-brand/35"
        >
          <span className="sr-only">Toggle theme setting</span>
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              isDarkMode ? 'translate-x-5 bg-brand' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

    </div>
  );
}

