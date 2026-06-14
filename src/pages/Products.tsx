import React, { useState } from 'react';
import {
  Search,
  Trash2,
  Edit3,
  Plus,
  Minus,
  AlertTriangle,
  Package,
  X,
} from 'lucide-react';
import { Product, Category, InventoryLog } from '../types';

interface ProductsListProps {
  products: Product[];
  logs?: InventoryLog[];
  initialFilter?: 'all' | 'low-stock' | 'out-of-stock';
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onUpdateQuantity: (
    id: string,
    newQty: number,
    actionType: 'addition' | 'reduction',
    isUsedCustom?: boolean,
    customNotes?: string
  ) => void;
  onViewChange: (view: string) => void;
}

const ALL_CATEGORIES: (Category | "All")[] = [
  "All",
  "Cables & Wiring",
  "Switches & Sockets",
  "Lighting & Bulbs",
  "Circuit Breakers & Fuses",
  "Fans & Ventilation",
  "Power Tools",
  "Testing Equipment",
  "Other Accessories"
];

type SortOption = 'name-asc' | 'name-desc' | 'date-desc' | 'qty-asc' | 'qty-desc';

export default function ProductsList({
  products,
  initialFilter = 'all',
  onEdit,
  onDelete,
  onUpdateQuantity,
}: ProductsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low-stock' | 'out-of-stock'>(initialFilter);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filter
  let filtered = products.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !p.name.toLowerCase().includes(q) &&
        !p.sku.toLowerCase().includes(q) &&
        !p.category.toLowerCase().includes(q)
      )
        return false;
    }
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (stockStatusFilter === 'low-stock' && !(p.quantity <= p.minThreshold && p.quantity > 0)) return false;
    if (stockStatusFilter === 'out-of-stock' && p.quantity !== 0) return false;
    return true;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'date-desc': return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case 'qty-asc': return a.quantity - b.quantity;
      case 'qty-desc': return b.quantity - a.quantity;
      default: return 0;
    }
  });

  const isLowStock = (p: Product) => p.quantity <= p.minThreshold && p.quantity > 0;
  const isOutOfStock = (p: Product) => p.quantity === 0;

  const handleStockIn = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    onUpdateQuantity(p.id, p.quantity + 1, 'addition', p.isUsed, 'Quick stock in +1');
  };

  const handleStockUsed = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    if (p.quantity <= 0) return;
    onUpdateQuantity(p.id, p.quantity - 1, 'reduction', p.isUsed, 'Quick stock used -1');
  };

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirm(id);
  };

  const handleDeleteConfirmed = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg text-text-primary tracking-tight">Products</h2>
          <p className="text-xs text-text-secondary mt-0.5">{products.length} items in inventory</p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, SKU..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-card border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/10 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-3 py-2.5 rounded-lg bg-card border border-border-subtle text-xs font-medium text-text-secondary focus:outline-none focus:border-brand cursor-pointer"
        >
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="date-desc">Newest First</option>
          <option value="qty-asc">Stock: Low → High</option>
          <option value="qty-desc">Stock: High → Low</option>
        </select>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border cursor-pointer ${
              selectedCategory === cat
                ? 'bg-brand text-white border-brand'
                : 'bg-card border-border-subtle text-text-secondary hover:bg-brand-light hover:text-brand'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stock status filters */}
      <div className="flex gap-1.5">
        {[
          { key: 'all' as const, label: 'All' },
          { key: 'low-stock' as const, label: 'Low Stock' },
          { key: 'out-of-stock' as const, label: 'Out of Stock' },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStockStatusFilter(f.key)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              stockStatusFilter === f.key
                ? 'bg-brand text-white'
                : 'bg-card border border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Product list table */}
      <div className="rounded-xl border border-border-subtle bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No products found.</p>
          </div>
        ) : (
          <>
            {/* Table header (desktop) */}
            <div className="hidden md:grid md:grid-cols-[auto_1fr_140px_120px_100px_140px] gap-4 items-center px-4 py-2.5 bg-pagebg border-b border-border-subtle text-[10px] font-bold text-text-muted uppercase tracking-wider">
              <span className="w-10"></span>
              <span>Product</span>
              <span>Category</span>
              <span>Date Added</span>
              <span className="text-center">In Stock</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border-subtle">
              {filtered.map((product) => {
                const low = isLowStock(product);
                const out = isOutOfStock(product);
                const dateStr = product.addedAt
                  ? new Date(product.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                  : '—';

                return (
                  <div
                    key={product.id}
                    className={`grid grid-cols-1 md:grid-cols-[auto_1fr_140px_120px_100px_140px] gap-3 md:gap-4 items-center px-4 py-3 hover:bg-pagebg/50 transition-colors ${
                      low ? 'border-l-3 border-l-red-400' : out ? 'border-l-3 border-l-gray-300' : ''
                    }`}
                  >
                    {/* Image */}
                    <div className="hidden md:block">
                      <img
                        src={product.image_url || 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=100&auto=format&fit=crop&q=60'}
                        alt={product.name}
                        className="h-10 w-10 rounded-lg object-cover border border-border-subtle"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=100&auto=format&fit=crop&q=60';
                        }}
                      />
                    </div>

                    {/* Name + SKU */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {/* Mobile image */}
                        <img
                          src={product.image_url || 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=100&auto=format&fit=crop&q=60'}
                          alt={product.name}
                          className="md:hidden h-9 w-9 rounded-lg object-cover border border-border-subtle shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=100&auto=format&fit=crop&q=60';
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{product.name}</p>
                          <p className="text-[10px] text-text-muted font-mono">{product.sku}</p>
                        </div>
                      </div>
                      {/* Mobile-only extra info */}
                      <div className="md:hidden flex items-center gap-2 mt-1.5 text-[11px] text-text-muted">
                        <span>{product.category}</span>
                        <span>·</span>
                        <span>{dateStr}</span>
                        {low && (
                          <>
                            <span>·</span>
                            <span className="text-red-500 font-bold flex items-center gap-0.5"><AlertTriangle className="h-3 w-3" /> Low</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <div className="hidden md:block">
                      <span className="text-xs text-text-secondary truncate">{product.category}</span>
                    </div>

                    {/* Date */}
                    <div className="hidden md:block">
                      <span className="text-xs text-text-muted">{dateStr}</span>
                    </div>

                    {/* Quantity */}
                    <div className="hidden md:flex items-center justify-center">
                      <span className={`text-sm font-bold font-mono ${out ? 'text-gray-400' : low ? 'text-red-500' : 'text-text-primary'}`}>
                        {product.quantity}
                      </span>
                      {low && <AlertTriangle className="h-3 w-3 text-red-400 ml-1" />}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      {/* Stock In */}
                      <button
                        onClick={(e) => handleStockIn(e, product)}
                        className="h-7 px-2 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer border border-emerald-200/50"
                        title="Stock In"
                      >
                        <Plus className="h-3 w-3" /> In
                      </button>

                      {/* Used */}
                      <button
                        onClick={(e) => handleStockUsed(e, product)}
                        disabled={product.quantity <= 0}
                        className="h-7 px-2 rounded-md bg-red-50 text-red-500 hover:bg-red-100 text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer border border-red-200/50 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Used"
                      >
                        <Minus className="h-3 w-3" /> Used
                      </button>

                      {/* Mobile qty display */}
                      <span className="md:hidden text-xs font-bold font-mono text-text-primary px-1.5">
                        {product.quantity}
                      </span>

                      {/* Edit */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                        className="h-7 w-7 rounded-md text-text-muted hover:bg-pagebg hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => confirmDelete(e, product.id)}
                        className="h-7 w-7 rounded-md text-text-muted hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card rounded-xl border border-border-subtle shadow-lg p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Delete Product</h3>
                <p className="text-xs text-text-secondary mt-0.5">This action cannot be undone. The product will be permanently removed.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3.5 py-1.5 rounded-lg border border-border-subtle text-xs font-medium text-text-secondary hover:bg-pagebg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-3.5 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
