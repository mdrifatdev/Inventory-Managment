import React, { useState } from 'react';
import {
  Package,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { Product, InventoryLog } from '../types';
import TodayStockDrawer from '../components/TodayStockDrawer';

interface DashboardProps {
  products: Product[];
  logs: InventoryLog[];
  onViewChange: (view: string) => void;
  onFilterLowStock: () => void;
  onFilterOutOfStock: () => void;
}

export default function Dashboard({
  products,
  logs,
  onViewChange,
  onFilterLowStock,
}: DashboardProps) {
  const [activeTodayDrawerType, setActiveTodayDrawerType] = useState<'addition' | 'reduction' | null>(null);
  const totalProducts = products.length;
  const totalStock = products.reduce((acc, p) => acc + p.quantity, 0);

  // Today's stats from logs
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysLogs = logs.filter((log) => {
    const logDate = new Date(log.timestamp);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime();
  });

  const stockInToday = todaysLogs
    .filter((l) => l.type === 'addition')
    .reduce((acc, l) => acc + Math.abs(l.quantityChange), 0);

  const stockUsedToday = todaysLogs
    .filter((l) => l.type === 'reduction')
    .reduce((acc, l) => acc + Math.abs(l.quantityChange), 0);

  const lowStockProducts = products.filter(p => p.quantity <= p.minThreshold && p.quantity > 0);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── 4 Stat Cards (2×2) ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Products */}
        <div 
          onClick={() => onViewChange('products')}
          className="bg-card border border-border-subtle rounded-xl p-5 flex flex-col justify-between group hover:border-brand/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Total Products</span>
            <div className="h-8 w-8 rounded-lg bg-brand-light flex items-center justify-center text-brand">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary tracking-tight">{totalProducts}</p>
        </div>

        {/* Total Stock */}
        <div 
          onClick={() => onViewChange('products')}
          className="bg-card border border-border-subtle rounded-xl p-5 flex flex-col justify-between group hover:border-brand/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Total Stock</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary tracking-tight">{totalStock.toLocaleString()}</p>
        </div>

        {/* Stock In Today */}
        <div 
          onClick={() => setActiveTodayDrawerType('addition')}
          className="bg-card border border-border-subtle rounded-xl p-5 flex flex-col justify-between group hover:border-emerald-300/80 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Stock In Today</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 tracking-tight">+{stockInToday}</p>
        </div>

        {/* Stock Used Today */}
        <div 
          onClick={() => setActiveTodayDrawerType('reduction')}
          className="bg-card border border-border-subtle rounded-xl p-5 flex flex-col justify-between group hover:border-red-300/80 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Stock Used Today</span>
            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-500 tracking-tight">-{stockUsedToday}</p>
        </div>

      </div>

      {/* ── Low Stock Alert ─────────────────────────────────── */}
      {lowStockProducts.length > 0 && (
        <div
          onClick={onFilterLowStock}
          className="border border-warning-primary/30 bg-warning-light/60 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-warning-light transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-warning-primary animate-pulse shrink-0" />
            <div>
              <p className="text-xs font-bold text-warning-primary">Low Stock</p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                {lowStockProducts.length} item{lowStockProducts.length > 1 ? 's' : ''} below threshold
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-warning-primary" />
        </div>
      )}

      {/* ── Recent Activity ─────────────────────────────────── */}
      <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-brand" />
            <h4 className="text-sm font-bold text-text-primary">Recent Activity</h4>
          </div>
          <button
            onClick={() => onViewChange('logs')}
            className="text-[11px] text-brand font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          >
            View All <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="divide-y divide-border-subtle">
          {logs.length === 0 ? (
            <div className="py-10 text-center text-text-muted text-xs">
              No activity recorded yet.
            </div>
          ) : (
            logs.slice(0, 5).map((log) => {
              const isIn = log.type === 'addition';
              const date = new Date(log.timestamp);
              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={log.id} className="flex items-center gap-3 px-5 py-3 hover:bg-pagebg/50 transition-colors">
                  <div className={`shrink-0 h-7 w-7 rounded-md flex items-center justify-center ${
                    isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                  }`}>
                    {isIn ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{log.productName}</p>
                  </div>
                  <span className={`shrink-0 text-[11px] font-bold font-mono ${isIn ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isIn ? '+' : ''}{log.quantityChange}
                  </span>
                  <span className="shrink-0 text-[10px] text-text-muted hidden sm:block">{dateStr} {timeStr}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
      <TodayStockDrawer 
        isOpen={activeTodayDrawerType !== null}
        onClose={() => setActiveTodayDrawerType(null)}
        logs={logs}
        type={activeTodayDrawerType || 'addition'}
      />
    </div>
  );
}
