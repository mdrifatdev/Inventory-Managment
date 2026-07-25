/** প্রোডাক্ট হিস্ট্রি ড্রয়ার | Slide-out drawer showing a single product's stock history */
import { X, ArrowUpRight, ArrowDownRight, History as HistoryIcon } from 'lucide-react';
import { Product, InventoryLog, FALLBACK_IMAGE } from '../types';
import { formatDateTime, groupByDate } from '../lib/dateUtils';

interface ProductHistoryDrawerProps {
  product: Product | null;
  logs: InventoryLog[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductHistoryDrawer({ product, logs, isOpen, onClose }: ProductHistoryDrawerProps) {
  if (!isOpen || !product) return null;

  // Filter logs for this specific product and sort descending
  const productLogs = logs
    .filter(log => log.productId === product.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const groupedLogs = groupByDate(productLogs);

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
        <div className="px-5 py-4 border-b border-border-subtle bg-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-text-primary flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-brand" /> 
              History
            </h2>
            <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-pagebg rounded-lg transition-colors cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <img 
              src={product.image_url || FALLBACK_IMAGE}
              alt={product.name}
              className="h-10 w-10 rounded-lg object-cover border border-border-subtle shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
              }}
            />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-text-primary truncate">{product.name}</p>
              <p className="text-xs text-text-secondary font-mono">{product.sku}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {productLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-60">
              <HistoryIcon className="h-10 w-10 text-text-muted" />
              <p className="text-sm font-medium text-text-secondary">No history recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedLogs).map(([dateLabel, dayLogs]) => (
                <div key={dateLabel}>
                  <h3 className="sticky top-0 bg-pagebg/95 backdrop-blur-sm py-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 z-10">
                    {dateLabel}
                  </h3>
                  <div className="bg-card border border-border-subtle rounded-xl overflow-hidden divide-y divide-border-subtle shadow-sm">
                    {dayLogs.map((log) => {
                      const isIn = log.type === 'addition';
                      const { timeStr } = formatDateTime(log.timestamp);
                      
                      return (
                        <div key={log.id} className="p-3 flex items-start gap-3 hover:bg-pagebg/50 transition-colors">
                          <div className={`mt-0.5 shrink-0 h-6 w-6 rounded-md flex items-center justify-center ${
                            isIn ? 'bg-success-light text-success' : 'bg-warning-light text-warning-primary'
                          }`}>
                            {isIn ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary">
                              {isIn ? 'Stock In' : log.type === 'reduction' ? 'Stock Used' : 'Updated'}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
