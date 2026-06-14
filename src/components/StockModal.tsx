import React, { useState, useEffect } from 'react';
import { Plus, Minus, X, AlertTriangle } from 'lucide-react';
import { Product } from '../types';

interface StockModalProps {
  product: Product;
  mode: 'in' | 'out';
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, notes?: string) => void;
}

export default function StockModal({ product, mode, isOpen, onClose, onConfirm }: StockModalProps) {
  const [quantity, setQuantity] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickAmounts = [1, 5, 10, 20, 50];

  const handleQuickAdd = (amount: number) => {
    const current = typeof quantity === 'number' ? quantity : 0;
    setQuantity(current + amount);
  };

  const handleConfirm = () => {
    const qty = typeof quantity === 'number' ? quantity : 0;
    
    if (qty <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (mode === 'out' && qty > product.quantity) {
      setError("Not enough stock.");
      return;
    }

    onConfirm(qty, notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border-subtle shadow-lg max-w-sm w-full overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className={`px-5 py-4 border-b border-border-subtle flex items-center justify-between ${mode === 'in' ? 'bg-success-light/30' : 'bg-warning-light/30'}`}>
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${mode === 'in' ? 'bg-success-light text-success' : 'bg-warning-light text-warning-primary'}`}>
              {mode === 'in' ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-bold text-text-primary">{mode === 'in' ? 'Stock In' : 'Stock Used'}</h3>
              <p className="text-[10px] text-text-secondary truncate max-w-[200px]">{product.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Current Stock */}
          <div className="flex items-center justify-between bg-pagebg p-3 rounded-lg border border-border-subtle">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Current Stock</span>
            <span className="font-mono font-bold text-lg text-text-primary">{product.quantity}</span>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Enter Quantity</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                autoFocus
                value={quantity}
                onChange={(e) => {
                  setError(null);
                  setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0);
                }}
                className={`w-full text-center text-3xl font-bold font-mono py-4 rounded-xl border ${error ? 'border-red-400 bg-red-50 focus:ring-red-500/20' : 'border-border-subtle bg-pagebg focus:border-brand focus:ring-brand/20'} focus:outline-none focus:ring-2 transition-all`}
                placeholder="0"
              />
            </div>
            {error && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3" /> {error}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide block">Notes / Reason (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={mode === 'in' ? 'e.g. Restocked from supplier' : 'e.g. Broken or sold'}
              className="w-full bg-pagebg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:outline-none transition-all rounded-lg px-3 py-2 text-xs text-text-primary resize-none"
            />
          </div>

          {/* Quick Amounts */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Quick Add</label>
            <div className="flex gap-1.5 flex-wrap">
              {quickAmounts.map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleQuickAdd(amount)}
                  className={`flex-1 py-2 rounded-lg font-mono text-sm font-bold transition-all cursor-pointer border ${
                    mode === 'in' 
                      ? 'bg-success-light text-success border-success/20 hover:brightness-95' 
                      : 'bg-warning-light text-warning-primary border-warning-primary/20 hover:brightness-95'
                  }`}
                >
                  +{amount}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border-subtle flex gap-3 bg-pagebg/50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border-subtle text-sm font-bold text-text-secondary hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-2.5 rounded-lg text-white text-sm font-bold transition-all shadow-sm cursor-pointer ${
              mode === 'in' ? 'bg-success hover:brightness-110' : 'bg-warning-primary hover:brightness-110'
            }`}
          >
            Confirm
          </button>
        </div>

      </div>
    </div>
  );
}
