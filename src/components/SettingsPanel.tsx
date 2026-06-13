import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Image, 
  Save, 
  HelpCircle, 
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Zap,
  Power,
  RotateCcw,
  Sun,
  Moon
} from 'lucide-react';
import { Settings } from '../types';
import { loadSettings, saveSettings, fetchProducts } from '../supabaseClient';

interface SettingsPanelProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSettingsSaved: () => void;
}

export default function SettingsPanel({ 
  isDarkMode, 
  onToggleDarkMode, 
  onSettingsSaved 
}: SettingsPanelProps) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState('');
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    const current = loadSettings();
    setSupabaseUrl(current.supabaseUrl || '');
    setSupabaseAnonKey(current.supabaseAnonKey || '');
    setCloudinaryCloudName(current.cloudinaryCloudName || '');
    setCloudinaryUploadPreset(current.cloudinaryUploadPreset || '');
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const updated: Settings = {
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      cloudinaryCloudName: cloudinaryCloudName.trim(),
      cloudinaryUploadPreset: cloudinaryUploadPreset.trim(),
    };

    try {
      saveSettings(updated);
      
      // Test Supabase connection if parameters are supplied
      if (updated.supabaseUrl && updated.supabaseAnonKey) {
        setMsg({ type: 'success', text: 'Settings cached. Verifying connection to databases...' });
        // Attempt quick fetch to verify if schema is active
        try {
          await fetchProducts();
          setMsg({ type: 'success', text: 'Connected successfully! Settings are verified and active on production.' });
        } catch (dbErr) {
          console.error("Database connection check failed", dbErr);
          setMsg({ 
            type: 'error', 
            text: 'Credentials set, but we failed to fetch tables. Please ensure the Supabase SQL tables are initialized.' 
          });
        }
      } else {
        setMsg({ type: 'success', text: 'Local configurations updated. App running on offline cache database mode.' });
      }

      onSettingsSaved();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update credentials. Please check input formats.' });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sqlProductsScript = `
-- 1. Create electrical products catalog table
create table products (
  id text primary key,
  name text not null,
  sku text not null unique,
  category text,
  "isUsed" boolean default false,
  "addedAt" text,
  "usedAt" text,
  quantity integer default 0,
  "minThreshold" integer default 10,
  image_url text,
  brand text default 'Generic',
  description text,
  updated_at text
);

-- Enable general Row Level Security (RLS) policies 
alter table products enable row level security;
create policy "Allow public read access" on products for select using (true);
create policy "Allow public insert" on products for insert with check (true);
create policy "Allow public update" on products for update using (true);
create policy "Allow public delete" on products for delete using (true);
`.trim();

  const sqlLogsScript = `
-- 2. Create stock logging and audit history table
create table inventory_logs (
  id text primary key,
  "productId" text,
  "productName" text,
  type text,
  "quantityChange" integer,
  timestamp text,
  notes text
);

-- Enable general Row Level Security (RLS) policies
alter table inventory_logs enable row level security;
create policy "Allow public log read" on inventory_logs for select using (true);
create policy "Allow public log insert" on inventory_logs for insert with check (true);
`.trim();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* Title */}
      <div>
        <h2 className="font-sans font-bold text-text-primary text-2xl tracking-tight">
          Cloud Credentials Configuration
        </h2>
        <p className="text-xs text-text-secondary font-sans mt-0.5">
          Wire up your personal free Supabase database and Cloudinary storage endpoints.
        </p>
      </div>

      {/* Appearance Customization */}
      <div className="bg-white border border-border-subtle rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs animate-fade-in">
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

      {msg && (
        <div className={`p-4 rounded-2xl flex items-start gap-2.5 border ${
          msg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-warning-light text-warning-primary border-warning-light/30'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0 animate-pulse text-warning-primary" />}
          <p className="text-xs font-sans font-semibold">{msg.text}</p>
        </div>
      )}

      {/* Grid: Credentials Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2/3 Settings Input form */}
        <form onSubmit={handleSave} className="bg-white border border-border-subtle rounded-3xl p-6 md:p-8 space-y-6 lg:col-span-2 shadow-xs">
          
          {/* Supabase details section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
              <Database className="h-5 w-5 text-text-primary" />
              <div>
                <h3 className="font-sans font-bold text-xs text-text-primary uppercase tracking-wide">1. Supabase Connection Settings</h3>
                <p className="text-[10px] text-text-secondary">Stores inventory data tables persistently online</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-text-secondary block">
                SUPABASE URL
              </label>
              <input 
                id="set-sub-url"
                type="url" 
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                className="w-full bg-sidebarbg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-white focus:outline-none transition-all rounded-xl px-4 py-2 font-mono text-xs text-text-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-text-secondary block">
                SUPABASE PUBLIC ANON KEY
              </label>
              <input 
                id="set-sub-key"
                type="password" 
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-sidebarbg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-white focus:outline-none transition-all rounded-xl px-4 py-2 font-mono text-xs text-text-primary"
              />
            </div>
          </div>

          {/* Cloudinary media section */}
          <div className="space-y-4 pt-4 border-t border-border-subtle">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
              <Image className="h-5 w-5 text-text-primary" />
              <div>
                <h3 className="font-sans font-bold text-xs text-text-primary uppercase tracking-wide">2. Cloudinary Media Storage Settings</h3>
                <p className="text-[10px] text-text-secondary">Enables high-performance image optimization uploads</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-text-secondary block">
                CLOUDINARY CLOUD NAME
              </label>
              <input 
                id="set-cl-name"
                type="text" 
                value={cloudinaryCloudName}
                onChange={(e) => setCloudinaryCloudName(e.target.value)}
                placeholder="e.g. dxyz12345"
                className="w-full bg-sidebarbg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-white focus:outline-none transition-all rounded-xl px-4 py-2 font-mono text-xs text-text-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-text-secondary block">
                CLOUDINARY UPLOAD PRESET (Unsigned)
              </label>
              <input 
                id="set-cl-preset"
                type="text" 
                value={cloudinaryUploadPreset}
                onChange={(e) => setCloudinaryUploadPreset(e.target.value)}
                placeholder="e.g. electric_preset_unsigned"
                className="w-full bg-sidebarbg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-white focus:outline-none transition-all rounded-xl px-4 py-2 font-mono text-xs text-text-primary"
              />
              <p className="text-[10px] text-text-secondary italic mt-1 font-sans">
                Note: In Cloudinary Settings &gt; Upload, configure an "Unsigned" upload preset to allow clients to push photos directly.
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-border-subtle flex items-center justify-end">
            <button
              id="save-settings-btn"
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-brand hover:brightness-110 text-white font-sans font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Validating Connections...' : 'Apply Cloud Settings'}</span>
            </button>
          </div>

        </form>

        {/* Right 1/3 Quick guidelines panel */}
        <div className="space-y-4">
          <div className="bg-brand-dark text-white rounded-3xl p-5 border border-border-subtle shadow-xs flex flex-col gap-3 font-sans">
            <div className="flex items-center gap-2 text-brand-light">
              <Zap className="h-5 w-5" />
              <h4 className="font-sans font-extrabold text-xs uppercase tracking-wide">Sync Status</h4>
            </div>
            <p className="text-[11.5px] text-white/90 leading-relaxed font-sans">
              If Supabase or Cloudinary keys are empty, this application behaves as an elegant <strong>offline-first local-storage tool</strong>.
            </p>
            <p className="text-[11.5px] text-white/80 leading-relaxed font-sans">
              All electrical specs, image compression data, and movement historical logs will be kept in your browser storage. You can bind remote clouds at any time to sync data.
            </p>
          </div>

          <div className="bg-white border border-border-subtle rounded-3xl p-5 flex flex-col gap-3 font-sans">
            <div className="flex items-center gap-2 text-text-primary">
              <HelpCircle className="h-5 w-5 text-brand" />
              <h4 className="font-sans font-bold text-xs text-text-primary">Unsplash Fallback Ready</h4>
            </div>
            <p className="text-[11.5px] text-text-secondary leading-relaxed font-sans">
              The Add Product form has prebuilt digital assets and electric image categories, so you can easily assign accurate wires and panel images without setting up buckets first.
            </p>
          </div>
        </div>

      </div>

      {/* SQL Setup block */}
      <div className="bg-white border border-border-subtle rounded-3xl p-6 md:p-8 space-y-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
          <Terminal className="h-5 w-5 text-text-primary" />
          <div>
            <h3 className="font-sans font-bold text-xs text-text-primary uppercase tracking-wide">Supabase SQL Editor Bootstrapping</h3>
            <p className="text-[10px] text-text-secondary">Run these statements in public schema to match data properties</p>
          </div>
        </div>

        <div className="space-y-4">
          
          {/* Products SQL */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-text-secondary font-semibold uppercase">1. Products catalog SQL</span>
              <button
                id="copy-sql-products"
                type="button"
                onClick={() => copyToClipboard(sqlProductsScript, 'products')}
                className="text-[11px] text-brand font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copiedText === 'products' ? 'Copied' : 'Copy Query'}</span>
              </button>
            </div>
            <pre className="p-4 bg-neutral-900 text-neutral-200 font-mono text-[10.5px] rounded-xl overflow-x-auto border border-neutral-800 leading-relaxed shadow-inner">
              {sqlProductsScript}
            </pre>
          </div>

          {/* Logs SQL */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-text-secondary font-semibold uppercase">2. Auditing Logs SQL</span>
              <button
                id="copy-sql-logs"
                type="button"
                onClick={() => copyToClipboard(sqlLogsScript, 'logs')}
                className="text-[11px] text-brand font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copiedText === 'logs' ? 'Copied' : 'Copy Query'}</span>
              </button>
            </div>
            <pre className="p-4 bg-neutral-900 text-neutral-200 font-mono text-[10.5px] rounded-xl overflow-x-auto border border-neutral-800 leading-relaxed shadow-inner">
              {sqlLogsScript}
            </pre>
          </div>

        </div>
      </div>

    </div>
  );
}
