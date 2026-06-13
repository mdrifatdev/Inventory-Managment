import React from 'react';
import { 
  Calendar, 
  Package, 
  AlertTriangle,
  Flame,
  Plus,
  ArrowRight,
  TrendingUp,
  Layers,
  ArrowUpRight,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Product, InventoryLog } from '../types';
import { useOnlineStatus } from '../useOnlineStatus';

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
  onFilterOutOfStock 
}: DashboardProps) {
  const isOnline = useOnlineStatus();
  
  // Calculations
  const totalProducts = products.length;
  
  // Total units sum
  const totalStockUnits = products.reduce((acc, p) => acc + p.quantity, 0);

  // Divide units by condition: New vs Used
  let totalNewUnits = 0;
  let totalUsedUnits = 0;

  products.forEach(p => {
    if (p.batches && p.batches.length > 0) {
      p.batches.forEach(b => {
        if (b.isUsed) {
          totalUsedUnits += b.quantity;
        } else {
          totalNewUnits += b.quantity;
        }
      });
    } else {
      if (p.isUsed) {
        totalUsedUnits += p.quantity;
      } else {
        totalNewUnits += p.quantity;
      }
    }
  });

  const lowStockProducts = products.filter(p => p.quantity <= p.minThreshold && p.quantity > 0);
  const outOfStockProducts = products.filter(p => p.quantity === 0);

  // Category counts by physical stock volume
  const categoryCounts: Record<string, { count: number }> = {};
  products.forEach(p => {
    if (!categoryCounts[p.category]) {
      categoryCounts[p.category] = { count: 0 };
    }
    categoryCounts[p.category].count += p.quantity;
  });

  const categoriesData = Object.entries(categoryCounts).map(([name, stats]) => ({
    name,
    count: stats.count,
    percentage: totalStockUnits > 0 ? (stats.count / totalStockUnits) * 100 : 0
  })).sort((a, b) => b.count - a.count);

  let newPercent = totalStockUnits > 0 ? (totalNewUnits / totalStockUnits) * 100 : 0;
  let usedPercent = totalStockUnits > 0 ? (totalUsedUnits / totalStockUnits) * 100 : 0;

  // Colors for category badges / tracking
  const categoryColors: Record<string, string> = {
    "Cables & Wiring": "bg-[#005FB0] text-[#005FB0] fill-[#005FB0]",
    "Switches & Sockets": "bg-[#00818A] text-[#00818A] fill-[#00818A]",
    "Lighting & Bulbs": "bg-[#4F46E5] text-[#4F46E5] fill-[#4F46E5]",
    "Circuit Breakers & Fuses": "bg-[#B3261E] text-[#B3261E] fill-[#B3261E]",
    "Fans & Ventilation": "bg-[#1E293B] text-[#1E293B] fill-[#1E293B]",
    "Power Tools": "bg-[#4B5563] text-[#4B5563] fill-[#4B5563]",
    "Testing Equipment": "bg-[#059669] text-[#059669] fill-[#059669]",
    "Other Accessories": "bg-[#6B7280] text-[#6B7280] fill-[#6B7280]"
  };

  const getCategoryColorClass = (cat: string) => {
    return categoryColors[cat] || "bg-[#6B7280] text-[#6B7280] fill-[#6B7280]";
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      
      {/* Upper Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          {/* Requested Connection Indicator Button */}
          <button
            id="network-indicator-btn"
            type="button"
            className={`w-full sm:w-auto flex items-center justify-center gap-2 font-sans font-extrabold text-xs uppercase tracking-wider px-5 py-3.5 rounded-full shadow-xxs transition-all cursor-pointer border select-none ${
              isOnline 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-emerald-650 shrink-0" />
                <span>🟢 Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-rose-650 shrink-0 animate-pulse" />
                <span>🔴 Offline</span>
              </>
            )}
          </button>

          <button 
            id="quick-add-btn"
            onClick={() => onViewChange('add-product')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand hover:brightness-110 text-white font-sans font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all transform hover:scale-[1.01] active:scale-95 cursor-pointer border border-brand/20"
          >
            <Plus className="h-5 w-5 stroke-[3] shrink-0" />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* Grid: 4 Core Stat Cards (Geometric Balance Bento Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        
        {/* Total Stock Units Card */}
        <div className="bg-brand-dark text-white rounded-3xl p-6 shadow-sm overflow-hidden relative flex flex-col justify-between min-h-[160px] group transition-all duration-300 hover:shadow-md border border-brand-dark">
          <div className="absolute top-0 right-0 p-8 transform translate-x-3 -translate-y-3 opacity-15 group-hover:scale-110 transition-transform">
            <Package className="h-28 w-28 text-white stroke-[1.5]" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-brand-light/70 text-xs font-mono uppercase tracking-widest font-bold">Total Stock Units</span>
            <span className="bg-brand-light/20 text-brand-light font-sans text-[11px] font-semibold tracking-wide py-0.5 px-2 rounded-full border border-brand-light/10 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Active
            </span>
          </div>
          <div>
            <h3 className="font-sans text-3xl font-extrabold tracking-tight mt-3 text-brand-light">
              {totalStockUnits.toLocaleString()}
            </h3>
            <p className="font-sans text-[11px] text-brand-light/70 mt-1.5">
              Cumulative parts currently in storage batches
            </p>
          </div>
        </div>

        {/* New Stock Units Card */}
        <div className="bg-white border border-border-subtle rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[160px] group hover:border-[#005FB0]/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs font-mono uppercase tracking-widest font-bold">New Inventory</span>
            <div className="bg-[#005FB0]/10 text-[#005FB0] p-2 rounded-xl group-hover:bg-[#005FB0] group-hover:text-white transition-colors">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="font-sans text-3xl font-bold tracking-tight text-text-primary mt-2">
              {totalNewUnits.toLocaleString()} <span className="text-xs font-semibold text-text-secondary">units</span>
            </h3>
            <p className="font-sans text-[11px] text-text-secondary mt-1.5">
              Unused components in initial packages
            </p>
          </div>
        </div>

        {/* Used/Renovated Stock Card */}
        <div className="bg-white border border-border-subtle rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[160px] group hover:border-warning-primary/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs font-mono uppercase tracking-widest font-bold">Used / Salvaged</span>
            <div className="bg-warning-light text-warning-primary p-2 rounded-xl group-hover:bg-warning-primary group-hover:text-white transition-colors">
              <RefreshCw className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="font-sans text-3xl font-bold tracking-tight text-text-primary mt-2">
              {totalUsedUnits.toLocaleString()} <span className="text-xs font-semibold text-text-secondary">units</span>
            </h3>
            <p className="font-sans text-[11px] text-text-secondary mt-1.5">
              Salvaged or returned electrician elements
            </p>
          </div>
        </div>

        {/* Low Stock Watch Card */}
        <div 
          id="stat-low-stock"
          onClick={onFilterLowStock}
          className={`border rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[160px] cursor-pointer transition-all duration-300 ${
            lowStockProducts.length > 0 
              ? 'bg-warning-light/80 border-warning-primary hover:border-warning-primary text-warning-primary' 
              : 'bg-white border-border-subtle hover:border-brand'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs font-mono uppercase tracking-widest font-bold">Low stock alarms</span>
            <div className={`p-2 rounded-xl ${lowStockProducts.length > 0 ? 'bg-warning-primary text-white animate-pulse' : 'bg-sidebarbg text-text-secondary'}`}>
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className={`font-sans text-3xl font-bold tracking-tight mt-2 ${lowStockProducts.length > 0 ? 'text-warning-primary font-extrabold' : 'text-text-primary'}`}>
              {lowStockProducts.length} <span className="text-sm font-medium text-text-secondary font-sans">Products</span>
            </h3>
            <p className="font-sans text-[11px] text-text-secondary mt-1.5 flex items-center gap-1 group">
              <span>Below safety reserve levels</span>
              <span className="text-brand font-bold hover:underline inline-flex items-center gap-0.5 ml-auto">
                View <ArrowRight className="h-3 w-3" />
              </span>
            </p>
          </div>
        </div>

      </div>

      {/* Bento Row 2: Analytics & Status visualizer (SVG charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Category Shares (Donut/Breakdown) */}
        <div className="bg-white border border-border-subtle rounded-3xl p-6 shadow-xs lg:col-span-1 flex flex-col">
          <div className="flex items-center gap-2 pb-4 border-b border-border-subtle">
            <Layers className="h-5 w-5 text-brand" />
            <div>
              <h4 className="font-sans font-bold text-text-primary text-[15px] leading-tight font-sans">Stock Volume Shares</h4>
              <p className="text-[11px] text-text-secondary font-sans mt-0.5">Asset percentage by catalog category counts</p>
            </div>
          </div>

          <div className="my-6 relative flex items-center justify-center h-48">
            {categoriesData.length === 0 ? (
              <div className="text-center text-text-secondary font-sans text-xs">
                No inventory data to chart.
              </div>
            ) : (
              <>
                {/* SVG Semi-Donut or stacked arc to show beautiful percentage */}
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    stroke="#F3F4F9"
                    strokeWidth="15"
                    fill="transparent"
                  />
                  {/* Stacking the circles according to cumulative percentage */}
                  {(() => {
                    let cumulativePercent = 0;
                    return categoriesData.map((item, index) => {
                      const strokeDasharray = 2 * Math.PI * 60; // ~377
                      const strokeDashoffset = strokeDasharray - (strokeDasharray * item.percentage) / 100;
                      const rotation = (cumulativePercent * 360) / 100;
                      cumulativePercent += item.percentage;
                      
                      // Extract color from color map safely
                      const colClass = getCategoryColorClass(item.name).split(' ')[1];
                      let strokeHex = "#6B7280";
                      if (colClass.includes("005FB0")) strokeHex = "#005FB0";
                      else if (colClass.includes("00818A")) strokeHex = "#00818A";
                      else if (colClass.includes("4F46E5")) strokeHex = "#4F46E5";
                      else if (colClass.includes("B3261E")) strokeHex = "#B3261E";
                      else if (colClass.includes("1E293B")) strokeHex = "#1E293B";
                      else if (colClass.includes("4B5563")) strokeHex = "#4B5563";
                      else if (colClass.includes("059669")) strokeHex = "#059669";
 
                      return (
                        <circle
                          key={index}
                          cx="80"
                          cy="80"
                          r="60"
                          stroke={strokeHex}
                          strokeWidth="16"
                          fill="transparent"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          transform={`rotate(${rotation} 80 80)`}
                          strokeLinecap="round"
                          className="transition-all duration-500 hover:stroke-[20px] cursor-pointer"
                        />
                      );
                    });
                  })()}
                </svg>
                {/* Center Badge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-widest text-center">In Stock</span>
                  <span className="text-xl font-sans font-extrabold text-text-primary mt-0.5">
                    {totalStockUnits > 1000 ? `${(totalStockUnits/1000).toFixed(1)}k` : totalStockUnits}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2 mt-auto">
            {categoriesData.slice(0, 4).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs font-sans">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`h-2.5 w-2.5 rounded-full ${getCategoryColorClass(item.name).split(' ')[0]}`} />
                  <span className="text-text-primary truncate font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-text-secondary font-mono text-[11px]">{item.count} units</span>
                  <span className="font-bold text-text-primary text-[11px]">{item.percentage.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2/3: New vs Used Stock Share comparison */}
        <div className="bg-white border border-border-subtle rounded-3xl p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand" />
                <div>
                  <h4 className="font-sans font-bold text-text-primary text-[15px] leading-tight">Stock Condition Allocation</h4>
                  <p className="text-[11px] text-text-secondary font-sans mt-0.5">Breakdown showing proportions of brand new versus used/extracted gear</p>
                </div>
              </div>
              <span className="text-xs bg-sidebarbg border border-border-subtle rounded-full py-1 px-3 text-text-secondary font-mono">
                {usedPercent.toFixed(0)}% Used
              </span>
            </div>

            {/* Micro bar visualizer for New vs Used ratios */}
            <div className="my-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end text-xs">
                  <div>
                    <span className="text-text-secondary text-[11px] font-mono block uppercase">NEW EQUIPMENTS</span>
                    <span className="text-xl font-extrabold text-[#005FB0] tracking-tight">{totalNewUnits} UNITS</span>
                  </div>
                  <span className="font-mono text-sm font-black text-[#005FB0]">{newPercent.toFixed(0)}%</span>
                </div>
                
                {/* Horizontal ratio split-track */}
                <div className="w-full bg-sidebarbg h-6 rounded-2xl overflow-hidden relative border border-border-subtle flex p-1 gap-1">
                  <div 
                    className="h-full rounded-xl transition-all duration-500 bg-[#005FB0] shadow-xs"
                    style={{ width: `${newPercent}%` }}
                    title={`New Items: ${newPercent.toFixed(0)}%`}
                  />
                  <div 
                    className="h-full rounded-xl transition-all duration-500 bg-warning-primary shadow-xs"
                    style={{ width: `${usedPercent}%` }}
                    title={`Used Items: ${usedPercent.toFixed(0)}%`}
                  />
                </div>

                <div className="flex justify-between items-end text-xs pt-2">
                  <div>
                    <span className="text-text-secondary text-[11px] font-mono block uppercase">USED / SALVAGED EQUIPMENTS</span>
                    <span className="text-xl font-extrabold text-warning-primary tracking-tight">{totalUsedUnits} UNITS</span>
                  </div>
                  <span className="font-mono text-sm font-black text-warning-primary">{usedPercent.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle flex items-center gap-2 bg-sidebarbg p-4 rounded-2xl">
            <Calendar className="h-4.5 w-4.5 text-brand shrink-0" />
            <span className="text-xs font-sans text-text-secondary leading-snug">
              Used elements have active date offsets monitoring when they were salvaged or refitted onto electric installations during field work.
            </span>
          </div>
        </div>

      </div>

      {/* Section 3: Recent Activity Logging */}
      <div className="bg-white border border-border-subtle rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-brand" />
            <div>
              <h4 className="font-sans font-bold text-text-primary text-[15px] leading-tight">Stock movement ledger</h4>
              <p className="text-[11px] text-text-secondary font-sans mt-0.5">Audit log of system actions and inventory modifications</p>
            </div>
          </div>
          <button 
            id="view-logs-shortcut"
            onClick={() => onViewChange('logs')}
            className="text-[11px] text-brand font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          >
            Audit History <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="divide-y divide-border-subtle overflow-hidden font-sans">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-text-secondary font-sans text-xs">
              No transactions or edits recorded.
            </div>
          ) : (
            logs.slice(0, 4).map((log) => {
              const dateText = new Date(log.timestamp).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              let badgeColor = "bg-sidebarbg text-text-secondary";
              if (log.type === "addition") badgeColor = "bg-emerald-50 text-emerald-800 border border-emerald-250 font-semibold";
              if (log.type === "reduction") badgeColor = "bg-amber-50 text-amber-955 border border-amber-200 font-semibold";
              if (log.type === "deletion") badgeColor = "bg-warning-light text-warning-primary border border-warning-light/35 font-semibold";

              return (
                <div key={log.id} className="py-3.5 flex flex-column sm:flex-row sm:items-center justify-between gap-2 first:pt-4 last:pb-0">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans text-xs font-bold text-text-primary">{log.productName}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase ${badgeColor}`}>
                        {log.type === 'addition' ? `+${log.quantityChange} units` : log.type === 'reduction' ? `${log.quantityChange} units` : log.type}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-[11px] text-text-secondary italic font-sans">{log.notes}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-text-secondary text-right shrink-0">
                    {dateText}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
