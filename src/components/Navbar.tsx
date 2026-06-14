import React from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  History,
  Zap,
  AlertTriangle,
  Menu,
  X,
  Sun,
  Moon,
  Settings as SettingsIcon,
  User as UserIcon,
  ChevronRight,
} from 'lucide-react';

interface NavbarProps {
  lowStockCount: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  sessionUser: SupabaseUser | null;
}

const navigationItems = [
  { path: '/',          name: 'Dashboard',    icon: LayoutDashboard },
  { path: '/products',  name: 'Products',     icon: Package },
  { path: '/add',       name: 'Add Product',  icon: PlusCircle },
  { path: '/logs',      name: 'History',      icon: History },
  { path: '/settings',  name: 'Settings',     icon: SettingsIcon },
  { path: '/auth',      name: 'Account',      icon: UserIcon },
];

export default function Navbar({
  lowStockCount,
  isDarkMode,
  onToggleDarkMode,
  sessionUser,
}: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) =>
    path === '/'
      ? currentPath === '/'
      : currentPath === path || currentPath.startsWith(path);

  const close = () => setIsOpen(false);

  // ── Shared nav link renderer ──────────────────────────────────────────────
  const NavLink = ({
    item,
    compact = false,
  }: {
    item: (typeof navigationItems)[0];
    compact?: boolean;
  }) => {
    const active = isActive(item.path);
    const Icon = item.icon;
    const showBadge = item.path === '/products' && lowStockCount > 0;

    return (
      <Link
        to={item.path}
        onClick={close}
        className={`relative flex items-center gap-3 rounded-lg transition-all duration-150 group
          ${compact ? 'px-3 py-2' : 'px-3 py-2.5'}
          ${
            active
              ? 'bg-brand-light text-brand font-semibold'
              : 'text-text-secondary hover:bg-border-subtle hover:text-text-primary'
          }`}
      >
        <Icon
          className={`shrink-0 transition-colors ${compact ? 'h-4 w-4' : 'h-4 w-4'}
            ${active ? 'text-brand' : 'text-text-muted group-hover:text-text-primary'}`}
        />
        <span className={`text-sm font-medium tracking-tight leading-none ${active ? 'text-brand' : ''}`}>
          {item.name}
        </span>
        {showBadge && (
          <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-warning-primary text-white rounded-full text-[10px] font-bold">
            {lowStockCount}
          </span>
        )}
      </Link>
    );
  };

  // ── Theme toggle ─────────────────────────────────────────────────────────
  const ThemeToggle = () => (
    <button
      type="button"
      onClick={onToggleDarkMode}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-border-subtle hover:text-text-primary transition-all cursor-pointer group"
      aria-label="Toggle theme"
    >
      <span className="shrink-0 h-4 w-4 flex items-center justify-center text-text-muted group-hover:text-text-primary transition-colors">
        {isDarkMode
          ? <Moon className="h-4 w-4 text-brand" />
          : <Sun className="h-4 w-4 text-amber-500" />}
      </span>
      <span className="text-sm font-medium tracking-tight flex-1 text-left">
        {isDarkMode ? 'Dark Mode' : 'Light Mode'}
      </span>
      {/* pill toggle */}
      <div
        data-on={isDarkMode ? 'true' : 'false'}
        className="toggle-track relative inline-flex h-5 w-9 rounded-full shrink-0"
      >
        <span
          className={`pointer-events-none absolute top-0.5 left-0.5 inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200
            ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </div>
    </button>
  );

  // ── Status footer ─────────────────────────────────────────────────────────
  const StatusFooter = () => (
    <div className="px-3 py-2.5 rounded-lg border border-border-subtle bg-pagebg flex items-center gap-2.5">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-mono text-text-muted leading-none">
          {sessionUser ? (
            <span className="text-text-secondary font-semibold truncate block">
              {sessionUser.email}
            </span>
          ) : (
            <span>Local DB · Active</span>
          )}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-sidebarbg border-b border-border-subtle">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-white fill-none stroke-current" />
          </div>
          <span className="font-bold text-text-primary text-sm tracking-tight leading-none">
            Electric Inventory
          </span>
        </div>

        <div className="flex items-center gap-2">
          {lowStockCount > 0 && (
            <Link
              to="/products"
              onClick={close}
              className="flex items-center gap-1 bg-warning-light text-warning-primary px-2 py-1 rounded-full text-[10px] font-bold border border-warning-primary/20"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>{lowStockCount}</span>
            </Link>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg text-text-secondary hover:bg-border-subtle hover:text-text-primary transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-sidebarbg border-r border-border-subtle flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border-subtle shrink-0">
              <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-white fill-none stroke-current" />
              </div>
              <span className="font-bold text-text-primary text-sm tracking-tight">Electric Inventory</span>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
              {navigationItems.map((item) => (
                <NavLink key={item.path} item={item} />
              ))}
            </nav>

            {/* Footer */}
            <div className="px-3 pb-4 flex flex-col gap-2 border-t border-border-subtle pt-3 shrink-0">
              <ThemeToggle />
              <StatusFooter />
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebarbg border-r border-border-subtle sticky top-0 h-screen shrink-0">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border-subtle shrink-0">
          <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-white fill-none stroke-current" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-text-primary text-[13px] tracking-tight leading-none truncate">
              Electric Inventory
            </p>
            <p className="text-[10px] text-text-muted mt-0.5 font-medium tracking-wide leading-none">
              Stock Manager
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5 scrollbar-hidden">
          {navigationItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>

        {/* Low-stock alert card */}
        {lowStockCount > 0 && (
          <div className="mx-3 mb-3 rounded-xl border border-warning-primary/20 bg-warning-light p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-warning-primary animate-pulse shrink-0" />
              <p className="text-[11px] font-bold text-warning-primary">Low Stock</p>
            </div>
            <p className="text-[10.5px] text-text-secondary leading-relaxed mb-2">
              {lowStockCount} item{lowStockCount > 1 ? 's' : ''} below safety threshold.
            </p>
            <Link
              to="/products"
              className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-warning-primary text-white text-[10px] font-bold hover:brightness-105 transition-all"
            >
              <span>Review</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Bottom controls */}
        <div className="px-3 pb-4 flex flex-col gap-2 border-t border-border-subtle pt-3 shrink-0">
          <ThemeToggle />
          <StatusFooter />
        </div>
      </aside>
    </>
  );
}
