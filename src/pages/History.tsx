import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, History as HistoryIcon, Filter } from 'lucide-react';
import { InventoryLog } from '../types';

interface HistoryProps {
  logs: InventoryLog[];
}

type FilterType = 'all' | 'in' | 'out';

export default function HistoryPage({ logs }: HistoryProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'in') return log.type === 'addition';
    if (filter === 'out') return log.type === 'reduction';
    return true;
  });

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'in', label: 'Stock In' },
    { key: 'out', label: 'Stock Used' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg text-text-primary tracking-tight">History</h2>
          <p className="text-xs text-text-secondary mt-0.5">Stock movement log for all products.</p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 bg-pagebg border border-border-subtle p-1 rounded-lg">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => setFilter(btn.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filter === btn.key
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-border-subtle'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log list */}
      <div className="rounded-xl border border-border-subtle bg-card overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center">
            <HistoryIcon className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No history entries found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {filteredLogs.map((log) => {
              const isIn = log.type === 'addition';
              const date = new Date(log.timestamp);
              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3 hover:bg-pagebg/50 transition-colors">
                  {/* Direction icon */}
                  <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${
                    isIn
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-500'
                  }`}>
                    {isIn
                      ? <ArrowUpRight className="h-4 w-4" />
                      : <ArrowDownRight className="h-4 w-4" />
                    }
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{log.productName}</p>
                    {log.notes && (
                      <p className="text-[11px] text-text-muted truncate mt-0.5">{log.notes}</p>
                    )}
                  </div>

                  {/* Quantity badge */}
                  <span className={`shrink-0 text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                    isIn
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {isIn ? '+' : ''}{log.quantityChange}
                  </span>

                  {/* Date */}
                  <div className="shrink-0 text-right hidden sm:block">
                    <p className="text-[11px] font-medium text-text-secondary">{dateStr}</p>
                    <p className="text-[10px] text-text-muted">{timeStr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
