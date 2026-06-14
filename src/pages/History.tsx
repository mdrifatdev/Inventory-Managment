import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, History as HistoryIcon, Filter } from 'lucide-react';
import { InventoryLog } from '../types';
import { formatDateTime, groupByDate } from '../lib/dateUtils';

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

  // Sort global history descending
  const sortedLogs = [...filteredLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Group by date
  const groupedLogs = groupByDate(sortedLogs);

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'in', label: 'Stock In' },
    { key: 'out', label: 'Stock Used' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg text-text-primary tracking-tight">History</h2>
          <p className="text-xs text-text-secondary mt-0.5">Stock movement log for all products.</p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 bg-card border border-border-subtle p-1 rounded-lg shadow-sm">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => setFilter(btn.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filter === btn.key
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-pagebg'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log list grouped by date */}
      <div>
        {sortedLogs.length === 0 ? (
          <div className="py-16 text-center bg-card rounded-xl border border-border-subtle">
            <HistoryIcon className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No history entries found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedLogs).map(([dateLabel, dayLogs]) => (
              <div key={dateLabel}>
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                  <span className="h-px bg-border-subtle flex-1"></span>
                  {dateLabel}
                  <span className="h-px bg-border-subtle flex-1"></span>
                </h3>
                
                <div className="rounded-xl border border-border-subtle bg-card overflow-hidden shadow-sm">
                  <div className="divide-y divide-border-subtle">
                    {dayLogs.map((log) => {
                      const isIn = log.type === 'addition';
                      const { timeStr } = formatDateTime(log.timestamp);

                      return (
                        <div key={log.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-pagebg/50 transition-colors">
                          {/* Direction icon */}
                          <div className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${
                            isIn
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-red-50 text-red-500'
                          }`}>
                            {isIn
                              ? <ArrowUpRight className="h-5 w-5" />
                              : <ArrowDownRight className="h-5 w-5" />
                            }
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{log.productName}</p>
                            {log.notes && (
                              <p className="text-[11px] text-text-muted truncate mt-0.5">{log.notes}</p>
                            )}
                          </div>

                          {/* Quantity & Time */}
                          <div className="flex items-center gap-4">
                            <span className={`shrink-0 text-sm font-bold font-mono px-2.5 py-1 rounded-md ${
                              isIn
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-600'
                            }`}>
                              {isIn ? '+' : ''}{log.quantityChange}
                            </span>
                            <div className="shrink-0 text-right w-16 hidden sm:block">
                              <p className="text-xs font-medium text-text-secondary">{timeStr}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
