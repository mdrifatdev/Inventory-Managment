import React, { useState, useEffect } from 'react';
import {
  Search,
  Trash2,
  Edit3,
  Plus,
  Minus,
  AlertTriangle,
  Package,
  X,
  History as HistoryIcon,
  Maximize2,
  Download
} from 'lucide-react';
import { Product, Category, InventoryLog } from '../types';
import StockModal from '../components/StockModal';
import ProductHistoryDrawer from '../components/ProductHistoryDrawer';
import { ProductCard } from '../components/ProductCard';
import { formatDateTime } from '../lib/dateUtils';

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
  logs = [],
  initialFilter = 'all',
  onEdit,
  onDelete,
  onUpdateQuantity,
}: ProductsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low-stock' | 'out-of-stock'>(initialFilter);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  useEffect(() => {
    setStockStatusFilter(initialFilter);
  }, [initialFilter]);
  
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const exportToCSV = () => {
    // CSV Header row
    const headers = ['Product Name', 'SKU', 'Category', 'Condition', 'Quantity', 'Min Threshold', 'Brand', 'Added Date', 'Description'];
    
    // Map products to CSV rows
    const rows = products.map((p) => {
      const addedDate = p.addedAt ? new Date(p.addedAt).toLocaleDateString('en-GB') : 'N/A';
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.sku}"`,
        `"${p.category}"`,
        p.isUsed ? 'Used' : 'New',
        p.quantity,
        p.minThreshold,
        `"${(p.brand || 'Generic').replace(/"/g, '""')}"`,
        `"${addedDate}"`,
        `"${(p.description || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `electric_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Modals state
  const [stockModalConfig, setStockModalConfig] = useState<{ product: Product | null, mode: 'in' | 'out' }>({ product: null, mode: 'in' });
  const [historyDrawerProduct, setHistoryDrawerProduct] = useState<Product | null>(null);
  const [largeImageModal, setLargeImageModal] = useState<string | null>(null);

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

  const handleStockInClick = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    setStockModalConfig({ product: p, mode: 'in' });
  };

  const handleStockUsedClick = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    setStockModalConfig({ product: p, mode: 'out' });
  };

  const handleHistoryClick = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    setHistoryDrawerProduct(p);
  };

  const handleImageClick = (e: React.MouseEvent, imageUrl: string) => {
    e.stopPropagation();
    setLargeImageModal(imageUrl);
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

  const handleStockConfirm = (amount: number, customNotes?: string) => {
    if (!stockModalConfig.product) return;
    const p = stockModalConfig.product;
    const isAdding = stockModalConfig.mode === 'in';
    const newQty = isAdding ? p.quantity + amount : p.quantity - amount;
    
    let logNotes = '';
    const prefix = `Stock ${isAdding ? 'in' : 'used'}: ${isAdding ? '+' : '-'}${amount} units.`;
    if (customNotes && customNotes.trim() !== '') {
      logNotes = `${prefix} ${customNotes.trim()}`;
    } else {
      logNotes = prefix;
    }

    onUpdateQuantity(
      p.id, 
      newQty, 
      isAdding ? 'addition' : 'reduction', 
      p.isUsed, 
      logNotes
    );
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg text-text-primary tracking-tight">Products</h2>
          <p className="text-xs text-text-secondary mt-0.5">{products.length} items in inventory</p>
        </div>
        {products.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white text-xs font-bold rounded-lg hover:brightness-115 transition-all cursor-pointer shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        )}
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
      <div className="flex overflow-x-auto gap-1.5 scrollbar-hidden pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border cursor-pointer ${
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
      <div className="flex gap-1.5 w-full">
        {[
          { key: 'all' as const, label: 'All' },
          { key: 'low-stock' as const, label: 'Low Stock' },
          { key: 'out-of-stock' as const, label: 'Out of Stock' },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStockStatusFilter(f.key)}
            className={`flex-1 sm:flex-initial px-3 py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-center ${
              stockStatusFilter === f.key
                ? 'bg-brand text-white'
                : 'bg-card border border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-card py-16 text-center shadow-sm">
          <Package className="h-8 w-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-secondary">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onInspect={(p) => setHistoryDrawerProduct(p)}
              onIncrement={(e, p) => handleStockInClick(e, p)}
              onDecrement={(e, p) => handleStockUsedClick(e, p)}
              onHistory={(e, p) => handleHistoryClick(e, p)}
              onEdit={(e, p) => { onEdit(p); }}
              onDelete={(e, p) => { confirmDelete(e, p.id); }}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card rounded-2xl border border-border-subtle shadow-xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-5">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div className="pt-1">
                <h3 className="text-base font-bold text-text-primary">Delete Product</h3>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">This action cannot be undone. The product will be permanently removed from inventory.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-border-subtle text-sm font-medium text-text-secondary hover:bg-pagebg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 shadow-sm transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Large Image Modal */}
      {largeImageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setLargeImageModal(null)}>
          <div className="relative max-w-4xl w-full flex items-center justify-center">
            <button 
              className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              onClick={() => setLargeImageModal(null)}
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={largeImageModal} 
              alt="Full size view" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      <StockModal 
        product={stockModalConfig.product!}
        mode={stockModalConfig.mode}
        isOpen={!!stockModalConfig.product}
        onClose={() => setStockModalConfig({ product: null, mode: 'in' })}
        onConfirm={handleStockConfirm}
      />

      {/* History Drawer */}
      <ProductHistoryDrawer 
        product={historyDrawerProduct}
        logs={logs}
        isOpen={!!historyDrawerProduct}
        onClose={() => setHistoryDrawerProduct(null)}
      />

    </div>
  );
}
