/** আজকের স্টক ড্রয়ার | Today's stock in/out log drawer */
import { X, ArrowUpRight, ArrowDownRight, History as HistoryIcon } from 'lucide-react';
import { InventoryLog } from '../types';
import { formatDateTime } from '../lib/dateUtils';

interface TodayStockDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: InventoryLog[];
  type: 'addition' | 'reduction';
}

export default function TodayStockDrawer({ isOpen, onClose, logs, type }: TodayStockDrawerProps) {
  if (!isOpen) return null;

  // Filter logs for today and sort descending
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysLogs = logs
    .filter((log) => {
      const logDate = new Date(log.timestamp);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime() && log.type === type;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const isIn = type === 'addition';
  const title = isIn ? 'Stock In Today' : 'Stock Used Today';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-pagebg h-full shadow-2xl flex flex-col animate-slide-left border-l border-border-subtle">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-subtle bg-card flex items-center justify-between">
          <h2 className="font-bold text-lg text-text-primary flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-brand" /> 
            {title}
          </h2>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-pagebg rounded-lg transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {todaysLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-60">
              <HistoryIcon className="h-10 w-10 text-text-muted" />
              <p className="text-sm font-medium text-text-secondary">No logs recorded for today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-text-secondary mb-2">Today's history log for stock movements.</p>
              <div className="bg-card border border-border-subtle rounded-xl overflow-hidden divide-y divide-border-subtle shadow-sm">
                {todaysLogs.map((log) => {
                  const { timeStr } = formatDateTime(log.timestamp);
                  
                  return (
                    <div key={log.id} className="p-3 flex items-start gap-3 hover:bg-pagebg/50 transition-colors">
                      <div className={`mt-0.5 shrink-0 h-6 w-6 rounded-md flex items-center justify-center ${
                        isIn ? 'bg-success-light text-success' : 'bg-warning-light text-warning-primary'
                      }`}>
                        {isIn ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {log.productName}
                        </p>
                        {log.notes && (
                          <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{log.notes}</p>
                        )}
                      </div>
                      
                      <div className="shrink-0 text-right">
                        <span className={`block font-mono font-bold text-sm ${isIn ? 'text-success' : 'text-warning-primary'}`}>
                          {isIn ? '+' : ''}{log.quantityChange}
                        </span>
                        <span className="text-[10px] text-text-muted font-medium">{timeStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
