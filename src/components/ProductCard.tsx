import React from 'react';
import { Minus, Plus, History, Info, Edit3, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { StatusBadge } from './StatusBadge';

interface ProductCardProps {
  product: Product;
  onInspect: (product: Product) => void;
  onIncrement: (e: React.MouseEvent, product: Product) => void;
  onDecrement: (e: React.MouseEvent, product: Product) => void;
  onHistory: (e: React.MouseEvent, product: Product) => void;
  onEdit: (e: React.MouseEvent, product: Product) => void;
  onDelete: (e: React.MouseEvent, product: Product) => void;
}

export function ProductCard({ 
  product, 
  onInspect, 
  onIncrement, 
  onDecrement, 
  onHistory, 
  onEdit, 
  onDelete 
}: ProductCardProps) {
  const isOut = product.quantity === 0;
  const isLow = product.quantity <= product.minThreshold;

  return (
    <div 
      onClick={() => onInspect(product)}
      className="group relative bg-white border border-border-subtle rounded-3xl overflow-hidden cursor-pointer shadow-xs hover:shadow-md hover:border-brand/35 transition-all duration-300 flex flex-col justify-between"
    >
      <div className="relative aspect-video sm:aspect-square bg-sidebarbg overflow-hidden shrink-0 border-b border-border-subtle">
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600&auto=format&fit=crop&q=80';
          }}
        />

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          <span className="bg-brand-dark/95 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider">
            {product.sku}
          </span>
          <StatusBadge quantity={product.quantity} minThreshold={product.minThreshold} isSynced={(product as any).synced !== false} />
        </div>

        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs text-text-primary text-[11px] font-extrabold font-sans min-w-6 h-6 px-1.5 flex items-center justify-center rounded-full border border-border-subtle shadow-xs">
          {product.quantity}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <div className="text-[11px] text-text-secondary font-mono flex items-center justify-between">
            <span className="truncate max-w-[120px] font-semibold text-brand">{product.category}</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${product.isUsed ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-[#005FB0]'}`}>
              {product.isUsed ? 'Used' : 'New'}
            </span>
          </div>
          <h3 className="font-sans font-bold text-sm text-text-primary leading-snug group-hover:text-brand transition-colors line-clamp-2">
            {product.name}
          </h3>
        </div>

        <div className="pt-2.5 border-t border-border-subtle flex flex-col gap-2">
          <div className="flex items-center justify-between font-sans">
            <span className="text-[9px] font-mono tracking-wider font-bold text-text-secondary uppercase">STORE QTY</span>
            <span className={`font-mono text-xs font-bold ${isOut || isLow ? 'text-warning-primary' : 'text-text-primary'}`}>
              {product.quantity} units
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-row-reverse">
            <button
              type="button"
              disabled={product.quantity <= 0}
              onClick={(e) => onDecrement(e, product)}
              className="flex-1 py-2 px-1.5 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 disabled:opacity-35 disabled:hover:bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xxs"
              title="Record Stock Used"
            >
              <Minus className="h-3 w-3 stroke-[2.5]" />
              <span>Stock Used</span>
            </button>

            <button
              type="button"
              onClick={(e) => onHistory(e, product)}
              className="p-2 sm:p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-xxs shrink-0"
              title="View Sell & Audit History"
            >
              <History className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={(e) => onIncrement(e, product)}
              className="flex-1 py-2 px-1.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 border border-emerald-100 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xxs"
              title="Record Stock Addition"
            >
              <Plus className="h-3 w-3 stroke-[2.5]" />
              <span>Add Stock</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-border-subtle bg-sidebarbg/50 flex items-center justify-between rounded-b-3xl">
        <span className="text-[10px] font-sans text-text-secondary font-semibold flex items-center gap-1">
          <Info className="h-3 w-3 text-text-secondary" /> Press to open specs
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => onEdit(e, product)}
            className="p-1.5 bg-white border border-border-subtle text-text-secondary hover:bg-brand-light hover:text-brand-dark rounded-lg transition-colors cursor-pointer"
            title="Edit Specifications"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => onDelete(e, product)}
            className="p-1.5 bg-white border border-border-subtle text-text-secondary hover:bg-warning-light hover:text-warning-primary rounded-lg transition-colors cursor-pointer"
            title="Delete Product"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
