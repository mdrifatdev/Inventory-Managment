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
  User as UserIcon
} from 'lucide-react';

interface NavbarProps {
  lowStockCount: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  sessionUser: SupabaseUser | null;
}

export default function Navbar({ 
  lowStockCount,
  isDarkMode,
  onToggleDarkMode,
  sessionUser
}: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const navigationItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/products', name: 'Product List', icon: Package },
    { path: '/add', name: 'Add Product', icon: PlusCircle },
    { path: '/logs', name: 'History Logs', icon: History },
    { path: '/settings', name: 'Settings', icon: SettingsIcon },
    { path: '/auth', name: sessionUser ? 'Account Profile' : 'Sign In', icon: UserIcon },
  ];

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile AppBar / Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-sidebarbg border-b border-border-subtle sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-brand text-white p-1.5 rounded-xl">
            <Zap className="h-5 w-5 fill-none stroke-current" />
          </div>
          <span className="font-sans font-bold text-text-primary tracking-tight text-md">
            Electric Inventory
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lowStockCount > 0 && (
            <Link 
              to="/products"
              onClick={handleNavClick}
              className="flex items-center gap-1 bg-warning-light text-warning-primary px-2.5 py-1 rounded-full text-xs font-semibold border border-warning-light/30"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{lowStockCount} Low</span>
            </Link>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-text-secondary hover:bg-border-subtle rounded-full"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer (Overlay) */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-30 transition-opacity" onClick={() => setIsOpen(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-72 bg-sidebarbg p-4 shadow-xl flex flex-col gap-4" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-2 py-4 border-b border-border-subtle">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-none stroke-current stroke-2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <span className="font-bold text-text-primary tracking-tight text-lg">Electrical Storage</span>
            </div>
            
            <nav className="flex flex-col gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-full text-left font-sans text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-brand-light text-brand-dark font-medium' 
                        : 'text-text-secondary hover:bg-border-subtle hover:text-text-primary'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-brand' : 'text-text-secondary'}`} />
                    <span>{item.name}</span>
                    {item.path === '/products' && lowStockCount > 0 && (
                      <span className="ml-auto bg-warning-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-extrabold shrink-0">
                        {lowStockCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            
            {/* Mobile Drawer Theme Preference & Status Footer */}
            <div className="mt-auto pt-2 border-t border-border-subtle flex flex-col gap-2">
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="flex items-center justify-between w-full px-4 py-2 rounded-full text-left font-sans text-xs font-bold text-text-secondary hover:bg-border-subtle hover:text-text-primary transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {isDarkMode ? <Moon className="h-4 w-4 text-brand" /> : <Sun className="h-4 w-4 text-amber-500" />}
                  <span>{isDarkMode ? 'Dark Theme' : 'Light Theme'}</span>
                </div>
                <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-brand-light dark:bg-brand/35">
                  <span
                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                      isDarkMode ? 'translate-x-4 bg-brand' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
              <div className="px-4 py-1.5 text-text-secondary text-[10px] font-mono flex flex-col gap-0.5">
                <div>⚡ Status: Local DB Live</div>
                {sessionUser && (
                  <div className="text-emerald-600 dark:text-emerald-400 font-sans font-bold truncate">
                    👤 Active: {sessionUser.email}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar (Geometric Balance Navigation Drawer) */}
      <aside className="hidden md:flex flex-col w-72 bg-sidebarbg border-r border-border-subtle p-6 sticky top-0 h-screen shrink-0">
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-none stroke-current stroke-2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div>
            <h1 className="font-sans font-bold text-text-primary tracking-tight text-md leading-tight">
              Electrical Storage
            </h1>
            <p className="font-sans text-[11px] text-text-secondary tracking-wide mt-0.5">
              Geometric Balance
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-4 px-4 py-3 rounded-full text-left font-sans text-[14px] font-medium tracking-wide transition-all group ${
                  isActive 
                    ? 'text-brand-dark font-semibold bg-brand-light' 
                    : 'text-text-secondary hover:bg-border-subtle hover:text-text-primary'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform ${isActive ? 'text-brand scale-105' : 'text-text-secondary group-hover:scale-105'}`} />
                <span>{item.name}</span>
                
                {item.path === '/products' && lowStockCount > 0 && (
                  <span className="ml-auto bg-warning-light text-warning-primary border border-warning-light/50 rounded-full text-[10px] font-bold px-2 py-0.5 animate-pulse">
                    {lowStockCount} Critical
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {lowStockCount > 0 && (
          <div className="mt-6 p-4 bg-border-subtle rounded-3xl border border-border-subtle flex flex-col gap-2.5">
            <div className="flex items-start gap-2.5 text-warning-primary">
              <div className="w-2.5 h-2.5 rounded-full bg-warning-primary shrink-0 mt-1.5 animate-pulse" />
              <div>
                <h4 className="font-sans font-bold text-xs text-text-primary leading-tight">Low Stock Alert</h4>
                <p className="text-[11px] text-text-secondary font-sans mt-1">
                  {lowStockCount} items critical. Immediate attention requested.
                </p>
              </div>
            </div>
            <Link
              to="/products"
              className="mt-1 text-center bg-brand hover:brightness-110 text-white rounded-full py-1.5 px-3 text-[11px] font-medium tracking-wide transition-all cursor-pointer block"
            >
              Inspect Shortages
            </Link>
          </div>
        )}

        {/* Desktop Sidebar Preference Toggle */}
        <div className="mt-auto mb-3">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-full text-left font-sans text-xs font-bold text-text-secondary hover:bg-border-subtle hover:text-text-primary transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              {isDarkMode ? <Moon className="h-4.5 w-4.5 text-brand" /> : <Sun className="h-4.5 w-4.5 text-amber-500" />}
              <span>{isDarkMode ? 'Dark Theme' : 'Light Theme'}</span>
            </div>
            <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-brand-light dark:bg-brand/35">
              <span
                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                  isDarkMode ? 'translate-x-4 bg-brand' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Desktop Mini-footer info */}
        <div className="px-4 py-2.5 bg-white border border-border-subtle rounded-2xl flex flex-col gap-1.5 text-[10.5px] font-mono text-text-secondary">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Local Sync Active</span>
          </div>
          {sessionUser && (
            <div className="flex items-center gap-2 text-text-primary font-sans font-bold">
              <UserIcon className="h-3 w-3 text-brand" />
              <span className="truncate w-40">{sessionUser.email}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
