import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  Settings as SettingsIcon, 
  History, 
  Zap,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  lowStockCount: number;
}

export default function Sidebar({ currentView, onViewChange, lowStockCount }: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', name: 'Product List', icon: Package },
    { id: 'add-product', name: 'Add Product', icon: PlusCircle },
    { id: 'logs', name: 'History Logs', icon: History },
    { id: 'settings', name: 'Cloud Settings', icon: SettingsIcon },
  ];

  const handleNavClick = (id: string) => {
    onViewChange(id);
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
            <button 
              id="low-stock-mobile-btn"
              onClick={() => handleNavClick('products')}
              className="flex items-center gap-1 bg-warning-light text-warning-primary px-2.5 py-1 rounded-full text-xs font-semibold border border-warning-light/30"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{lowStockCount} Low</span>
            </button>
          )}
          <button
            id="mobile-menu-toggle"
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
                const isActive = currentView === item.id;
                return (
                  <button
                    id={`nav-mob-${item.id}`}
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-full text-left font-sans text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-brand-light text-brand-dark font-medium' 
                        : 'text-text-secondary hover:bg-border-subtle hover:text-text-primary'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-brand' : 'text-text-secondary'}`} />
                    <span>{item.name}</span>
                    {item.id === 'products' && lowStockCount > 0 && (
                      <span className="ml-auto bg-warning-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-extrabold shrink-0">
                        {lowStockCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            
            <div className="mt-auto px-4 py-3 text-text-secondary text-xs font-mono border-t border-border-subtle">
              ⚡ Status: Local DB Live
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
            const isActive = currentView === item.id;
            return (
              <button
                id={`nav-dt-${item.id}`}
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`relative flex items-center gap-4 px-4 py-3 rounded-full text-left font-sans text-[14px] font-medium tracking-wide transition-all group ${
                  isActive 
                    ? 'text-brand-dark font-semibold bg-brand-light' 
                    : 'text-text-secondary hover:bg-border-subtle hover:text-text-primary'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform ${isActive ? 'text-brand scale-105' : 'text-text-secondary group-hover:scale-105'}`} />
                <span>{item.name}</span>
                
                {item.id === 'products' && lowStockCount > 0 && (
                  <span className="ml-auto bg-warning-light text-warning-primary border border-warning-light/50 rounded-full text-[10px] font-bold px-2 py-0.5 animate-pulse">
                    {lowStockCount} Critical
                  </span>
                )}
              </button>
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
            <button
              id="sidebar-warning-btn"
              onClick={() => onViewChange('products')}
              className="mt-1 text-center bg-brand hover:brightness-110 text-white rounded-full py-1.5 px-3 text-[11px] font-medium tracking-wide transition-all cursor-pointer"
            >
              Inspect Shortages
            </button>
          </div>
        )}

        <div className="mt-auto px-4 py-3 bg-border-subtle/55 rounded-2xl border border-border-subtle flex flex-col gap-1">
          <p className="text-[10px] font-mono text-text-secondary font-bold uppercase tracking-wide">ENGINE STATE</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-2 w-2 rounded-full bg-emerald-600 shadow-sm" />
            <span className="text-[11px] font-sans font-semibold text-text-secondary">Offline-First Cache DB</span>
          </div>
        </div>
      </aside>
    </>
  );
}
