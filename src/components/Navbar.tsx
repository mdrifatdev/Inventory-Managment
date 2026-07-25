/** নেভিগেশন বার | Sidebar nav — responsive with mobile drawer */
import { useState, type Key } from 'react';
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
  User as UserIcon,
  ChevronRight,
} from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface NavbarProps {
  lowStockCount: number;
  sessionUser: SupabaseUser | null;
  onLowStockClick?: () => void;
  onProductsClick?: () => void;
}

const navigationItems = [
  { path: '/',          name: 'Dashboard',    icon: LayoutDashboard },
  { path: '/products',  name: 'Products',     icon: Package },
  { path: '/add',       name: 'Add Product',  icon: PlusCircle },
  { path: '/logs',      name: 'History',      icon: History },
  { path: '/auth',      name: 'Account',      icon: UserIcon },
];

export default function Navbar({ lowStockCount, sessionUser, onLowStockClick, onProductsClick }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;
  const isOnline = useOnlineStatus();

  const isActive = (path: string) =>
    path === '/'
      ? currentPath === '/'
      : currentPath === path || currentPath.startsWith(path + '/');

  const close = () => setIsOpen(false);

  const NavLink = ({ item }: { item: (typeof navigationItems)[0]; key?: Key }) => {
    const active = isActive(item.path);
    const Icon = item.icon;
    const showBadge = item.path === '/products' && lowStockCount > 0;

    return (
      <Link
        to={item.path}
        onClick={(e) => {
          close();
          if (item.path === '/products' && onProductsClick) {
            e.preventDefault();
            onProductsClick();
          }
        }}
        className={`relative flex items-center gap-3 rounded-lg transition-all duration-150 group px-3 py-2.5
          ${active
            ? 'bg-brand-light text-brand font-semibold'
            : 'text-text-secondary hover:bg-border-subtle hover:text-text-primary'
          }`}
      >
        <Icon
          className={`shrink-0 h-4 w-4 transition-colors
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

  // Online/Offline dot only
  const OnlineDot = () => (
    <div className="px-3 py-2 flex items-center gap-2">
      <span className="relative flex h-2 w-2 shrink-0">
        {isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-success' : 'bg-red-400'}`} />
      </span>
      <span className="text-[10px] text-text-muted font-medium">{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-sidebarbg border-b border-border-subtle">
        <Link to="/" className="flex items-center gap-2.5 cursor-pointer">
          <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-white fill-none stroke-current" />
          </div>
          <span className="font-bold text-text-primary text-sm tracking-tight leading-none">
            Electric Inventory
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {lowStockCount > 0 && (
            <Link
              to="/products"
              onClick={(e) => {
                close();
                if (onLowStockClick) {
                  e.preventDefault();
                  onLowStockClick();
                }
              }}
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

      {/* ── Mobile drawer ──────────────────────────────────── */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-64 bg-sidebarbg border-r border-border-subtle flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              to="/"
              onClick={close}
              className="flex items-center gap-2.5 px-5 h-14 border-b border-border-subtle shrink-0 cursor-pointer"
            >
              <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-white fill-none stroke-current" />
              </div>
              <span className="font-bold text-text-primary text-sm tracking-tight">Electric Inventory</span>
            </Link>

            <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
              {navigationItems.map((item) => (
                <NavLink key={item.path} item={item} />
              ))}
            </nav>

            <div className="px-3 pb-4 border-t border-border-subtle pt-3 shrink-0">
              <OnlineDot />
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 bg-sidebarbg border-r border-border-subtle sticky top-0 h-screen shrink-0">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 px-5 h-14 border-b border-border-subtle shrink-0 cursor-pointer">
          <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-white fill-none stroke-current" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-text-primary text-[13px] tracking-tight leading-none truncate">
              Electric Inventory
            </p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5 scrollbar-hidden">
          {navigationItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>

        {/* Low-stock alert card */}
        {lowStockCount > 0 && (
          <div className="mx-3 mb-2 rounded-lg border border-warning-primary/20 bg-warning-light px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-warning-primary animate-pulse shrink-0" />
              <p className="text-[10px] font-bold text-warning-primary">{lowStockCount} Low Stock</p>
            </div>
            <Link
              to="/products"
              onClick={(e) => {
                if (onLowStockClick) {
                  e.preventDefault();
                  onLowStockClick();
                }
              }}
              className="flex items-center justify-center gap-1 w-full py-1 rounded-md bg-warning-primary text-white text-[10px] font-bold hover:brightness-105 transition-all"
            >
              <span>Review</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Bottom: online dot only */}
        <div className="px-3 pb-3 border-t border-border-subtle pt-2 shrink-0">
          <OnlineDot />
        </div>
      </aside>
    </>
  );
}
