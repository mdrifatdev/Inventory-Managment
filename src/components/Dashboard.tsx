import React from 'react';
import { 
  DollarSign, 
  Package, 
  AlertTriangle,
  Flame,
  Plus,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';
import { Product, InventoryLog } from '../types';

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
  
  // Calculations
  const totalProducts = products.length;
  
  const getProductValuation = (p: Product) => {
    if (p.batches && p.batches.length > 0) {
      return p.batches.reduce((sum, b) => sum + (b.price * b.quantity), 0);
    }
    return p.price * p.quantity;
  };

  const totalValue = products.reduce((acc, curr) => {
    return acc + getProductValuation(curr);
  }, 0);

  const lowStockProducts = products.filter(p => p.quantity <= p.minThreshold && p.quantity > 0);
  const outOfStockProducts = products.filter(p => p.quantity === 0);

  // Distribution calculations for SVG Chart
  const categoryCounts: Record<string, { count: number; value: number }> = {};
  products.forEach(p => {
    if (!categoryCounts[p.category]) {
      categoryCounts[p.category] = { count: 0, value: 0 };
    }
    categoryCounts[p.category].count += p.quantity;
    categoryCounts[p.category].value += getProductValuation(p);
  });

  const categoriesData = Object.entries(categoryCounts).map(([name, stats]) => ({
    name,
    count: stats.count,
    value: stats.value,
    percentage: totalValue > 0 ? (stats.value / totalValue) * 100 : 0
  })).sort((a, b) => b.value - a.value);

  // Elegant color palette for categories matching Geometric Balance
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <div className="flex w-full sm:w-auto">
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
        
        {/* Total Stock Value Card */}
        <div className="bg-brand-dark text-white rounded-3xl p-6 shadow-sm overflow-hidden relative flex flex-col justify-between min-h-[160px] group transition-all duration-300 hover:shadow-md border border-brand-dark">
          <div className="absolute top-0 right-0 p-8 transform translate-x-3 -translate-y-3 opacity-15 group-hover:scale-110 transition-transform">
            <DollarSign className="h-28 w-28 text-white stroke-[1.5]" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-brand-light/70 text-xs font-mono uppercase tracking-widest font-bold">Inventory Value</span>
            <span className="bg-brand-light/20 text-brand-light font-sans text-[11px] font-semibold tracking-wide py-0.5 px-2 rounded-full border border-brand-light/10 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Active
            </span>
          </div>
          <div>
            <h3 className="font-sans text-3xl font-extrabold tracking-tight mt-3 text-brand-light">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="font-sans text-[11px] text-brand-light/70 mt-1.5 flex items-center gap-1">
              Cumulative financial asset value in stockpile
            </p>
          </div>
        </div>

        {/* Unique SKUs / Products Card */}
        <div className="bg-white border border-border-subtle rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[160px] group hover:border-brand/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs font-mono uppercase tracking-widest font-bold">Catalogue Items</span>
            <div className="bg-brand-light text-brand p-2 rounded-xl group-hover:bg-brand group-hover:text-white transition-colors">
              <Package className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="font-sans text-3xl font-bold tracking-tight text-text-primary mt-2">
              {totalProducts} <span className="text-sm font-medium text-text-secondary font-sans">SKUs</span>
            </h3>
            <p className="font-sans text-[11px] text-text-secondary mt-1.5">
              Unique electrical products managed
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
            <span className="text-text-secondary text-xs font-mono uppercase tracking-widest font-bold">Low Stock Items</span>
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

        {/* Out of Stock Card */}
        <div 
          id="stat-out-of-stock"
          onClick={onFilterOutOfStock}
          className={`border rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[160px] cursor-pointer transition-all duration-300 ${
            outOfStockProducts.length > 0 
              ? 'bg-warning-light/55 border-warning-primary hover:border-warning-primary text-warning-primary' 
              : 'bg-white border-border-subtle hover:border-brand'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs font-mono uppercase tracking-widest font-bold">Empty Stock</span>
            <div className={`p-2 rounded-xl ${outOfStockProducts.length > 0 ? 'bg-warning-primary text-white' : 'bg-sidebarbg text-text-secondary'}`}>
              <Flame className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className={`font-sans text-3xl font-bold tracking-tight mt-2 ${outOfStockProducts.length > 0 ? 'text-warning-primary font-extrabold' : 'text-text-primary'}`}>
              {outOfStockProducts.length} <span className="text-sm font-medium text-text-secondary font-sans">Depleted</span>
            </h3>
            <p className="font-sans text-[11px] text-text-secondary mt-1.5 flex items-center gap-1">
              <span>Awaiting reorder/arrival</span>
              <span className="text-brand font-bold hover:underline inline-flex items-center gap-0.5 ml-auto">
                Critical <ArrowRight className="h-3 w-3" />
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
              <h4 className="font-sans font-bold text-text-primary text-[15px] leading-tight font-sans">Stock valuation share</h4>
              <p className="text-[11px] text-text-secondary font-sans mt-0.5">Asset percentage by electrical classification</p>
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
                  <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-widest">Total</span>
                  <span className="text-xl font-sans font-extrabold text-text-primary mt-0.5">
                    ${totalValue > 1000 ? `${(totalValue/1000).toFixed(1)}k` : totalValue.toFixed(0)}
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
                  <span className="text-text-secondary font-mono text-[11px]">${item.value.toFixed(0)}</span>
                  <span className="font-bold text-text-primary text-[11px]">{item.percentage.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2/3: Top Product Quantities Bar Chart & Warning panel */}
        <div className="bg-white border border-border-subtle rounded-3xl p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand" />
                <div>
                  <h4 className="font-sans font-bold text-text-primary text-[15px] leading-tight">Stock level indicators</h4>
                  <p className="text-[11px] text-text-secondary font-sans mt-0.5">Item stock count relative to safety reserve limits</p>
                </div>
              </div>
              <button 
                id="view-inventory-shortcut"
                onClick={() => onViewChange('products')}
                className="text-[11px] text-brand font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                Full List <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="my-6 font-sans">
              {products.length === 0 ? (
                <div className="py-12 text-center text-text-secondary font-sans text-xs">
                  Add products to view inventory stock level comparison.
                </div>
              ) : (
                <div className="space-y-4">
                  {products.slice(0, 5).map((prod) => {
                    const ratio = Math.min(1, prod.quantity / (prod.minThreshold * 2 || 50));
                    const isLow = prod.quantity <= prod.minThreshold;
                    const percentText = `${Math.min(100, Math.round(ratio * 100))}%`;

                    return (
                      <div key={prod.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-sans">
                          <span className="text-text-primary font-bold truncate max-w-[200px] sm:max-w-xs">{prod.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-text-secondary text-[10px] font-mono">{prod.brand}</span>
                            <span className={`font-mono text-xs font-bold ${isLow ? 'text-warning-primary' : 'text-brand'}`}>
                              {prod.quantity} <span className="text-[10px] font-normal text-text-secondary font-sans">qty</span>
                            </span>
                          </div>
                        </div>
                        
                        {/* Progress Bar track */}
                        <div className="w-full bg-sidebarbg h-3.5 rounded-full overflow-hidden relative border border-border-subtle">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLow ? 'bg-warning-primary' : 'bg-brand'
                            }`}
                            style={{ width: percentText }}
                          />
                          {/* Marker for warning threshold */}
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-warning-primary/45"
                            style={{ left: `${(prod.minThreshold / (prod.minThreshold * 2 || 50)) * 100}%` }}
                            title={`Threshold: ${prod.minThreshold}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle flex items-center justify-between bg-sidebarbg p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-warning-primary animate-pulse" />
              <span className="text-xs font-sans text-text-secondary">Red bars indicate items below custom warning threshold limits.</span>
            </div>
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
