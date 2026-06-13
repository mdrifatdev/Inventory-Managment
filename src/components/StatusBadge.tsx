import React from 'react';
import { AlertTriangle, CloudLightning } from 'lucide-react';

interface StatusBadgeProps {
  quantity: number;
  minThreshold: number;
  isSynced?: boolean;
}

export function StatusBadge({ quantity, minThreshold, isSynced = true }: StatusBadgeProps) {
  const isOut = quantity === 0;
  const isLow = quantity > 0 && quantity <= minThreshold;

  return (
    <div className="flex flex-col gap-1.5 items-start">
      {!isSynced && (
        <span className="bg-amber-500/90 backdrop-blur-xs text-white font-sans text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs border border-amber-600/10 flex items-center gap-1 animate-pulse" title="Saved locally. Pending upload sync.">
          <CloudLightning className="h-2.5 w-2.5 shrink-0" />
          <span>Pending Sync</span>
        </span>
      )}
      
      {isOut ? (
        <span className="bg-warning-primary text-white font-sans text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs border border-warning-primary/20 flex items-center gap-1">
          <span>Out of Stock</span>
          <AlertTriangle className="h-3 w-3 shrink-0" />
        </span>
      ) : isLow ? (
        <span className="bg-warning-light text-warning-primary font-sans text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs border border-warning-light/35 flex items-center gap-1">
          <span>Low Stock Alert</span>
          <AlertTriangle className="h-3 w-3 shrink-0" />
        </span>
      ) : null}
    </div>
  );
}
