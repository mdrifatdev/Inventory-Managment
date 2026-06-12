import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Edit3, 
  Plus, 
  Minus, 
  AlertTriangle, 
  Info, 
  Filter, 
  Grid,
  Layers,
  ArrowUpDown,
  CircleAlert,
  ChevronRight,
  Package,
  X,
  PlusSquare,
  MinusSquare,
  Sparkles,
  Zap,
  Coins,
  TrendingUp,
  TrendingDown,
  History
} from 'lucide-react';
import { Product, Category, InventoryLog } from '../types';
import { getProductBatches } from '../batchUtils';

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
    transactionPrice?: number,
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

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'qty-asc' | 'qty-desc';

export default function ProductsList({ 
  products, 
  logs = [],
  initialFilter = 'all',
  onEdit, 
  onDelete, 
  onUpdateQuantity,
  onViewChange
}: ProductsListProps) {
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low-stock' | 'out-of-stock'>(initialFilter);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  
  // Selected product for detailed modal popup
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(null);

  // Selected product for standalone history modal
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  // States for Quick Stock Transaction Form
  const [transType, setTransType] = useState<'addition' | 'reduction'>('addition');
  const [transQty, setTransQty] = useState<number>(1);
  const [priceMode, setPriceMode] = useState<'listed' | 'custom'>('listed');
  const [customPriceVal, setCustomPriceVal] = useState<string>('');
  const [transNotes, setTransNotes] = useState<string>('');
  const [transError, setTransError] = useState<string | null>(null);
  const [transSuccess, setTransSuccess] = useState<boolean>(false);

  // Computed state to keep inspected product fully updated with parent product edits
  const activeInspectedProduct = inspectedProduct 
    ? products.find(p => p.id === inspectedProduct.id) || inspectedProduct 
    : null;

  // Associated logs of active inspected product for ledger list
  const productLogs = activeInspectedProduct 
    ? logs.filter(l => l.productId === activeInspectedProduct.id) 
    : [];

  // Whenever inspectedProduct is changed or opened, reset transaction panel state
  const handleInspectProduct = (prod: Product) => {
    setInspectedProduct(prod);
    setTransType('addition');
    setTransQty(1);
    setPriceMode('listed');
    setCustomPriceVal(prod.price.toString());
    setTransNotes('');
    setTransError(null);
    setTransSuccess(false);
  };

  // Execute quick stock transaction (addition/reduction with custom price option)
  const handleExecuteTransaction = () => {
    if (!activeInspectedProduct) return;
    
    if (transQty <= 0) {
      setTransError("Quantity must be greater than zero.");
      return;
    }

    const priceToUse = priceMode === 'listed' 
      ? activeInspectedProduct.price 
      : parseFloat(customPriceVal) || activeInspectedProduct.price;

    let targetQty = activeInspectedProduct.quantity;
    if (transType === 'addition') {
      targetQty += transQty;
    } else {
      if (activeInspectedProduct.quantity < transQty) {
        setTransError(`Insufficient stock. You only have ${activeInspectedProduct.quantity} units, but you are trying to sell ${transQty} units.`);
        return;
      }
      targetQty -= transQty;
    }

    // Call callback to perform actual DB update & Log writing
    onUpdateQuantity(
      activeInspectedProduct.id,
      targetQty,
      transType,
      priceToUse,
      transNotes
    );

    // Show success feedback
    setTransSuccess(true);
    setTransError(null);
    setTransQty(1);
    setTransNotes('');
    
    // Auto clear success layout state in a moment
    setTimeout(() => {
      setTransSuccess(false);
    }, 3500);
  };

  // Filter products based on search, category, and stocks
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    
    let matchesStatus = true;
    if (stockStatusFilter === 'low-stock') {
      matchesStatus = p.quantity <= p.minThreshold && p.quantity > 0;
    } else if (stockStatusFilter === 'out-of-stock') {
      matchesStatus = p.quantity === 0;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort filtered items
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'qty-asc':
        return a.quantity - b.quantity;
      case 'qty-desc':
        return b.quantity - a.quantity;
      default:
        return 0;
    }
  });

  const handleStockIncrement = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation(); // Avoid opening the inspecting modal
    onUpdateQuantity(prod.id, prod.quantity + 1, 'addition');
  };

  const handleStockDecrement = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation(); // Avoid opening the inspecting modal
    if (prod.quantity > 0) {
      onUpdateQuantity(prod.id, prod.quantity - 1, 'reduction');
    }
  };

  const confirmDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you absolutely sure you want to delete "${name}" from inventory?`)) {
      onDelete(id);
      if (inspectedProduct?.id === id) {
        setInspectedProduct(null);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-12">
      
      {/* 1. Header & Filters block resembling Google Photos top interface */}
      <div className="sticky top-0 z-20 bg-pagebg/95 backdrop-blur-md pt-2 pb-4 -mx-4 px-4 space-y-4">
        
        {/* Row 1: Search & Sort selectors */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
              <Search className="h-4 w-4" />
            </span>
            <input 
              id="list-search-bar"
              type="text"
              placeholder="Search specifications, electrical brands, SKUs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-border-subtle focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand-light rounded-full pl-10 pr-4 py-2.5 font-sans text-sm shadow-xs text-text-primary"
            />
            {searchQuery && (
              <button 
                id="clear-search"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto shrink-0 pb-1 sm:pb-0 scrollbar-hidden">
            {/* View status option dropdown */}
            <div className="flex items-center gap-1.5 text-xs shrink-0 bg-white border border-border-subtle rounded-full px-3 py-1.5 shadow-xs">
              <Layers className="h-3.5 w-3.5 text-brand" />
              <select 
                id="list-status-select"
                value={stockStatusFilter} 
                onChange={(e) => setStockStatusFilter(e.target.value as 'all' | 'low-stock' | 'out-of-stock')}
                className="bg-transparent focus:outline-none text-text-primary font-medium font-sans cursor-pointer text-xs"
              >
                <option value="all">View: All Items</option>
                <option value="low-stock">View: Low Stock</option>
                <option value="out-of-stock">View: Empty Stock</option>
              </select>
            </div>

            {/* Sorting trigger */}
            <div className="flex items-center gap-1.5 text-xs shrink-0 bg-white border border-border-subtle rounded-full px-3 py-1.5 shadow-xs">
              <Filter className="h-3.5 w-3.5 text-brand" />
              <select 
                id="list-sort-select"
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent focus:outline-none text-text-primary font-medium font-sans cursor-pointer text-xs"
              >
                <option value="name-asc">A to Z Alphabetical</option>
                <option value="name-desc">Z to A Alphabetical</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="qty-asc">In-Stock: Low to High</option>
                <option value="qty-desc">In-Stock: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Horizontal scroll of categories chips (resembles albums filtering) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hidden">
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                id={`cat-pill-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium font-sans whitespace-nowrap shrink-0 transition-all border cursor-pointer ${
                  isSelected 
                    ? 'bg-brand-light border-brand/40 text-brand-dark font-bold' 
                    : 'bg-white border-border-subtle text-text-secondary hover:bg-sidebarbg'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

      </div>

      {/* 2. Photo-style dynamic responsive grid */}
      {sortedProducts.length === 0 ? (
        <div className="bg-white border border-border-subtle rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs">
          <div className="bg-sidebarbg p-4 w-12 h-12 rounded-full mx-auto flex items-center justify-center text-text-secondary border border-border-subtle">
            <Package className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-text-primary text-md font-sans">No matching electrical devices</h3>
            <p className="text-xs text-text-secondary font-sans block">
              We couldn't locate any products matching your query or selected categories.
            </p>
          </div>
          <button
            id="reset-query-btn"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setStockStatusFilter('all');
            }}
            className="text-xs font-semibold bg-brand text-white hover:brightness-110 rounded-full px-5 py-2 transition-all inline-block cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {sortedProducts.map((prod) => {
            const isLow = prod.quantity <= prod.minThreshold;
            const isOut = prod.quantity === 0;

            return (
              <div 
                id={`product-card-${prod.id}`}
                key={prod.id}
                onClick={() => handleInspectProduct(prod)}
                className="group relative bg-white border border-border-subtle rounded-3xl overflow-hidden cursor-pointer shadow-xs hover:shadow-md hover:border-brand/35 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image Section with Google Photos subtle metadata card overlay */}
                <div className="relative aspect-video sm:aspect-square bg-sidebarbg overflow-hidden shrink-0 border-b border-border-subtle">
                  <img 
                    src={prod.image_url} 
                    alt={prod.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600&auto=format&fit=crop&q=80';
                    }}
                  />

                  {/* Badges on image */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                    <span className="bg-brand-dark/95 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider">
                      {prod.sku}
                    </span>
                    
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

                  {/* Stock quantity overlay bottom right */}
                  <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs text-text-primary text-[11px] font-extrabold font-sans min-w-6 h-6 px-1.5 flex items-center justify-center rounded-full border border-border-subtle shadow-xs">
                    {prod.quantity}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="text-[11px] text-text-secondary font-mono flex items-center justify-between">
                      <span className="truncate max-w-[120px] font-semibold text-brand">{prod.category}</span>
                      <span className="font-bold text-text-primary">${prod.price.toFixed(2)}</span>
                    </div>
                    <h3 className="font-sans font-bold text-sm text-text-primary leading-snug group-hover:text-brand transition-colors line-clamp-2">
                      {prod.name}
                    </h3>
                  </div>

                  {/* Bottom Counter block with increment/decrement */}
                  <div className="pt-2.5 border-t border-border-subtle flex flex-col gap-2">
                    <div className="flex items-center justify-between font-sans">
                      <span className="text-[9px] font-mono tracking-wider font-bold text-text-secondary uppercase">STORE QTY</span>
                      <span className={`font-mono text-xs font-bold ${isOut ? 'text-warning-primary' : isLow ? 'text-warning-primary' : 'text-text-primary'}`}>
                        {prod.quantity} units
                      </span>
                    </div>

                    {/* Stock quick adjusted controller buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        id={`dec-qty-${prod.id}`}
                        type="button"
                        disabled={prod.quantity <= 0}
                        onClick={(e) => handleStockDecrement(e, prod)}
                        className="flex-1 py-2 px-1.5 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 disabled:opacity-35 disabled:hover:bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xxs"
                        title="Sell Stock (Decrement by 1 unit)"
                      >
                        <Minus className="h-3 w-3 stroke-[2.5]" />
                        <span>Sell Stock</span>
                      </button>

                      {/* Standalone product history quick trigger in the middle */}
                      <button
                        id={`view-history-${prod.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Avoid opening the details modal
                          setHistoryProduct(prod);
                        }}
                        className="p-2 sm:p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-xxs shrink-0"
                        title="View Sell & Audit History"
                      >
                        <History className="h-4 w-4" />
                      </button>

                      <button
                        id={`inc-qty-${prod.id}`}
                        type="button"
                        onClick={(e) => handleStockIncrement(e, prod)}
                        className="flex-1 py-2 px-1.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 border border-emerald-100 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xxs"
                        title="Add Stock (Increment by 1 unit)"
                      >
                        <Plus className="h-3 w-3 stroke-[2.5]" />
                        <span>Add Stock</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hover overlay menu for advanced operations (Edit, Delete) */}
                <div className="px-4 py-2 border-t border-border-subtle bg-sidebarbg/50 flex items-center justify-between rounded-b-3xl">
                  <span className="text-[10px] font-sans text-text-secondary font-semibold flex items-center gap-1">
                    <Info className="h-3 w-3 text-text-secondary" /> Press to open specs
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      id={`edit-${prod.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(prod);
                      }}
                      className="p-1.5 bg-white border border-border-subtle text-text-secondary hover:bg-brand-light hover:text-brand-dark rounded-lg transition-colors cursor-pointer"
                      title="Edit Specifications"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      id={`del-${prod.id}`}
                      type="button"
                      onClick={(e) => confirmDelete(e, prod.id, prod.name)}
                      className="p-1.5 bg-white border border-border-subtle text-text-secondary hover:bg-warning-light hover:text-warning-primary rounded-lg transition-colors cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 3. M3 Bottom Sheet/Side Drawer for inspect product details */}
      {activeInspectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center sm:items-center animate-fade-in" onClick={() => setInspectedProduct(null)}>
          <div 
            className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col justify-between animate-slide-up border border-border-subtle" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Sheet head info */}
            <div className="p-6 pb-4 border-b border-border-subtle flex items-start justify-between">
              <div className="space-y-1">
                <span className="bg-brand-light text-brand-dark font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-brand-light/40 uppercase tracking-widest">
                  {activeInspectedProduct.sku}
                </span>
                <h3 className="font-sans font-bold text-text-primary text-lg md:text-xl leading-snug mt-1.5 animate-fade-in">
                  {activeInspectedProduct.name}
                </h3>
              </div>
              <button 
                id="close-spec-drawer"
                onClick={() => setInspectedProduct(null)} 
                className="p-1.5 bg-sidebarbg text-text-secondary hover:text-text-primary hover:bg-brand-light hover:text-brand rounded-full border border-border-subtle transition-colors shrink-0 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Specifications */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Cover photo */}
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-sidebarbg border border-border-subtle relative shadow-inner">
                <img 
                  src={activeInspectedProduct.image_url} 
                  alt={activeInspectedProduct.name} 
                  className="w-full h-full object-cover"
                />
                
                {activeInspectedProduct.quantity <= activeInspectedProduct.minThreshold && (
                  <div className="absolute inset-0 bg-gradient-to-t from-red-950/80 via-transparent to-transparent flex items-end p-4">
                    <p className="text-white text-xs font-sans font-bold flex items-center gap-1.5 leading-snug">
                      <AlertTriangle className="h-5 w-5 fill-amber-300 stroke-amber-900 shrink-0" />
                      Critical Stock level threshold warning. Reserve item below specifications safety value!
                    </p>
                  </div>
                )}
              </div>

              {/* Attributes grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-border-subtle text-xs font-sans">
                <div className="bg-sidebarbg p-4 border border-border-subtle rounded-2xl flex flex-col justify-between shadow-xxs">
                  <span className="text-text-secondary font-mono uppercase text-[9px] font-bold">UNIT PRICE</span>
                  <span className="text-brand font-sans font-bold text-md mt-1">${activeInspectedProduct.price.toFixed(2)}</span>
                </div>
                <div className="bg-sidebarbg p-4 border border-border-subtle rounded-2xl flex flex-col justify-between shadow-xxs">
                  <span className="text-text-secondary font-mono uppercase text-[9px] font-bold">ON STORE LIMIT</span>
                  <span className={`font-sans font-bold text-md mt-1 ${activeInspectedProduct.quantity <= activeInspectedProduct.minThreshold ? 'text-warning-primary' : 'text-text-primary'}`}>
                    {activeInspectedProduct.quantity} units
                  </span>
                </div>
                <div className="bg-sidebarbg p-4 border border-border-subtle rounded-2xl flex flex-col justify-between shadow-xxs">
                  <span className="text-text-secondary font-mono uppercase text-[9px] font-bold">CUMULATIVE VALUE</span>
                  <span className="text-text-primary font-sans font-bold text-md mt-1">
                    ${(activeInspectedProduct.price * activeInspectedProduct.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-sidebarbg p-4 border border-border-subtle rounded-2xl flex flex-col justify-between shadow-xxs">
                  <span className="text-text-secondary font-mono uppercase text-[9px] font-bold">ALERT ON LEVEL</span>
                  <span className="text-warning-primary font-bold text-[11px] mt-1 bg-warning-light border border-warning-light/35 rounded-md py-0.5 px-2 text-center">
                    &lt;= {activeInspectedProduct.minThreshold} qty
                  </span>
                </div>
              </div>

              {/* Details specifications info */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-1">
                    <span className="text-text-secondary font-bold font-mono uppercase text-[9px]">MANUFACTURE BRAND</span>
                    <p className="text-text-primary font-semibold bg-sidebarbg p-3 rounded-xl border border-border-subtle">{activeInspectedProduct.brand}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-text-secondary font-bold font-mono uppercase text-[9px]">STOCK CATEGORY</span>
                    <p className="text-text-primary font-semibold bg-sidebarbg p-3 rounded-xl border border-border-subtle">{activeInspectedProduct.category}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-text-secondary font-bold font-mono uppercase text-[9px]">TECHNICAL DESCRIPTION</span>
                  <div className="bg-sidebarbg p-4 rounded-2xl border border-border-subtle">
                    <p className="text-text-secondary font-sans text-xs leading-relaxed whitespace-pre-wrap">
                      {activeInspectedProduct.description}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-text-secondary flex items-center justify-between pt-2">
                  <span>SYSTEM METADATA ID: {activeInspectedProduct.id}</span>
                  <span>UPDATED: {new Date(activeInspectedProduct.updated_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Batches breakdown list */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-text-secondary">
                    Active Stock Batches (FIFO Order)
                  </span>
                  <span className="text-[10px] bg-brand-light text-brand-dark px-2.5 py-0.5 rounded-full font-bold">
                    {getProductBatches(activeInspectedProduct).filter(b => b.quantity > 0).length} Active Batches
                  </span>
                </div>
                <div className="bg-sidebarbg rounded-2xl border border-border-subtle overflow-hidden">
                  <table className="w-full text-left font-sans text-xs border-collapse divide-y divide-border-subtle">
                    <thead>
                      <tr className="bg-white/40 text-text-secondary font-semibold uppercase text-[9px] tracking-wider">
                        <th className="py-2.5 px-4 font-bold">Batch Sequence / Date Added</th>
                        <th className="py-2.5 px-4 font-bold">Unit Price</th>
                        <th className="py-2.5 px-4 font-bold">Current Stock</th>
                        <th className="py-2.5 px-4 font-bold">Original Batch Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/40 text-text-secondary">
                      {getProductBatches(activeInspectedProduct).map((batch, idx) => (
                        <tr key={batch.id} className={`hover:bg-white/60 transition-colors ${batch.quantity === 0 ? 'opacity-35 italic bg-slate-50' : ''}`}>
                          <td className="py-2.5 px-4">
                            <div className="font-bold text-text-primary text-[11px]">
                              Batch #{idx + 1} {batch.quantity === 0 ? '[DEPLETED]' : idx === 0 ? '[INITIAL]' : '[REPLY]'}
                            </div>
                            <div className="text-[9.5px] text-text-secondary mt-0.5 font-mono">
                              {new Date(batch.addedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 font-extrabold text-brand font-sans">
                            ${batch.price.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-text-primary">
                            {batch.quantity} units
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[10.5px]">
                            {batch.originalQuantity} units
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INTERACTIVE INVENTORY TRANSACTOR FORM */}
              <div className="bg-sidebarbg p-5 rounded-2xl border border-border-subtle space-y-4 shadow-xxs">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-brand" />
                    <span className="font-sans font-bold text-xs text-text-primary uppercase tracking-wider">Quick Stock Ledger Transaction</span>
                  </div>
                  <span className="text-[10px] font-mono text-text-secondary uppercase">Unified Ledger</span>
                </div>

                {/* Switcher Buttons (Add Units / Buy vs Sell Units) */}
                <div className="flex rounded-xl bg-white border border-border-subtle p-1 gap-1 text-xs font-semibold relative">
                  <button
                    id="trans-type-add"
                    type="button"
                    onClick={() => {
                      setTransType('addition');
                      setTransError(null);
                    }}
                    className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      transType === 'addition'
                        ? 'bg-emerald-500 text-white shadow-sm font-bold'
                        : 'text-text-secondary hover:bg-sidebarbg hover:text-text-primary'
                    }`}
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    Add Units
                  </button>
                  <button
                    id="trans-type-sell"
                    type="button"
                    onClick={() => {
                      setTransType('reduction');
                      setTransError(null);
                    }}
                    className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      transType === 'reduction'
                        ? 'bg-amber-600 text-white shadow-sm font-bold'
                        : 'text-text-secondary hover:bg-sidebarbg hover:text-text-primary'
                    }`}
                  >
                    <Minus className="h-4 w-4 stroke-[2.5]" />
                    Sell Unit
                  </button>
                </div>

                {/* Input Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-text-secondary font-bold font-mono uppercase text-[9px]" htmlFor="transaction-qty-input">Quantity to Transact</label>
                    <div className="flex items-center bg-white border border-border-subtle rounded-xl overflow-hidden focus-within:border-brand">
                      <button
                        type="button"
                        onClick={() => setTransQty(prev => Math.max(1, prev - 1))}
                        className="px-3 py-2 text-text-secondary hover:bg-sidebarbg hover:text-text-primary transition-colors cursor-pointer font-bold border-r border-border-subtle"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        id="transaction-qty-input"
                        value={transQty}
                        onChange={(e) => setTransQty(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full text-center py-2 bg-transparent focus:outline-none font-semibold text-text-primary font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setTransQty(prev => prev + 1)}
                        className="px-3 py-2 text-text-secondary hover:bg-sidebarbg hover:text-text-primary transition-colors cursor-pointer font-bold border-l border-border-subtle"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Ask for same or custom price */}
                  <div className="space-y-1.5">
                    <label className="text-text-secondary font-bold font-mono uppercase text-[9px]">Price Decision Mode</label>
                    <div className="grid grid-cols-2 gap-1 bg-white p-1 border border-border-subtle rounded-xl text-[10px]">
                      <button
                        id="price-opt-listed"
                        type="button"
                        onClick={() => {
                          setPriceMode('listed');
                          setCustomPriceVal(activeInspectedProduct.price.toString());
                        }}
                        className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer font-bold ${
                          priceMode === 'listed'
                            ? 'bg-brand text-white font-bold shadow-xxs'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        Same Listed Price (${activeInspectedProduct.price.toFixed(2)})
                      </button>
                      <button
                        id="price-opt-custom"
                        type="button"
                        onClick={() => setPriceMode('custom')}
                        className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer font-bold ${
                          priceMode === 'custom'
                            ? 'bg-brand text-white font-bold shadow-xxs'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        Different Price ($)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom price field */}
                {priceMode === 'custom' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-text-secondary font-bold font-mono uppercase text-[9px]" htmlFor="custom-price-field">Custom Transaction Unit Price ($)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary font-mono text-xs font-semibold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        id="custom-price-field"
                        value={customPriceVal}
                        onChange={(e) => setCustomPriceVal(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white border border-border-subtle focus:outline-none focus:border-brand rounded-xl pl-7.5 pr-4 py-2 font-mono text-xs text-text-primary font-bold shadow-xxs"
                      />
                    </div>
                  </div>
                )}

                {/* Notes log */}
                <div className="space-y-1.5">
                  <label className="text-text-secondary font-bold font-mono uppercase text-[9px]" htmlFor="trans-notes-field">Transaction Audit Notes (Optional)</label>
                  <input
                    type="text"
                    id="trans-notes-field"
                    value={transNotes}
                    onChange={(e) => setTransNotes(e.target.value)}
                    placeholder={
                      transType === 'addition'
                        ? "e.g., Supplier bulk warehousing batch replenishment"
                        : "e.g., Walk-in customer direct counter invoice sale"
                    }
                    className="w-full bg-white border border-border-subtle focus:outline-none focus:border-brand rounded-xl px-3.5 py-2 font-sans text-xs text-text-primary shadow-xxs"
                  />
                </div>

                {/* Messages feedback */}
                {transError && (
                  <div className="p-3 bg-red-50 text-red-800 border border-red-250 rounded-xl text-xs font-medium flex items-start gap-2 animate-fade-in leading-snug">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 animate-pulse" />
                    <span>{transError}</span>
                  </div>
                )}

                {transSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border-emerald-250 rounded-xl text-xs font-semibold flex items-start gap-2 animate-fade-in leading-snug">
                    <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Product ledger and logs registered cleanly!</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  id="trans-execute-submit"
                  type="button"
                  onClick={handleExecuteTransaction}
                  className={`w-full py-3 rounded-xl font-sans text-xs font-bold tracking-wider uppercase shadow-sm transition-all focus:outline-none focus:ring-2 cursor-pointer flex items-center justify-center gap-1.5 text-white ${
                    transType === 'addition'
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-850 focus:ring-emerald-200'
                      : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-850 focus:ring-amber-205'
                  }`}
                >
                  {transType === 'addition' ? (
                    <>
                      <Plus className="h-4 w-4 stroke-[2.5]" />
                      Add {transQty} Units @ ${parseFloat(priceMode === 'listed' ? activeInspectedProduct.price.toString() : customPriceVal).toFixed(2)}
                    </>
                  ) : (
                    <>
                      <Minus className="h-4 w-4 stroke-[2.5]" />
                      Sell {transQty} Units @ ${parseFloat(priceMode === 'listed' ? activeInspectedProduct.price.toString() : customPriceVal).toFixed(2)}
                    </>
                  )}
                </button>
              </div>

              {/* DYNAMIC PRODUCT HISTORY TIMELINE LOGS */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-1.5 border-b border-border-subtle">
                  <History className="h-4 w-4 text-brand" />
                  <span className="text-text-secondary font-bold font-mono uppercase text-[9px] tracking-wider">Product Stock History & Movement logs</span>
                </div>

                <div className="bg-sidebarbg p-4 rounded-2xl border border-border-subtle space-y-4 max-h-56 overflow-y-auto scrollbar-hidden">
                  {productLogs.length === 0 ? (
                    <p className="text-center text-text-secondary text-[11px] py-4 font-sans italic">
                      No audited movement events discovered for this electrical SKU.
                    </p>
                  ) : (
                    <div className="space-y-3.5 relative pl-3 border-l border-border-subtle font-sans">
                      {productLogs.map((item) => {
                        const isAdd = item.type === 'addition';
                        const isRed = item.type === 'reduction';
                        const isDel = item.type === 'deletion';
                        
                        let dotColor = 'bg-gray-400';
                        let textColor = 'text-text-secondary';
                        if (isAdd) {
                          dotColor = 'bg-emerald-500';
                        } else if (isRed) {
                          dotColor = 'bg-amber-500';
                        } else if (isDel) {
                          dotColor = 'bg-red-500';
                        }

                        return (
                          <div key={item.id} className="relative space-y-1 text-xs">
                            {/* Dot */}
                            <span className={`absolute -left-[16.5px] top-1 h-2 w-2 rounded-full ${dotColor} border border-white`} />
                            
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-text-primary text-[11.5px]">
                                {isAdd ? 'Inbound Stock Replenished' : isRed ? 'Outbound Stock Dispatched' : item.type === 'update' ? 'Specifications Adjusted' : 'SKU De-allocated'}
                              </span>
                              <span className="text-[9px] text-text-secondary font-mono">
                                {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-text-secondary font-sans leading-relaxed text-xs pl-0.5">
                              {item.notes}
                            </p>
                            <span className="inline-block text-[9.5px] font-mono font-bold bg-white text-text-primary border border-border-subtle rounded px-1.5 py-0.5">
                              Change: {item.quantityChange > 0 ? `+${item.quantityChange}` : item.quantityChange} units
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Quick Actions Footer */}
            <div className="p-6 border-t border-border-subtle bg-sidebarbg/50 flex flex-col sm:flex-row gap-3.5 items-center justify-between">
              <button
                id="drawer-delete-shortcut"
                type="button"
                onClick={(e) => {
                  confirmDelete(e, activeInspectedProduct.id, activeInspectedProduct.name);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-warning-light text-warning-primary rounded-xl text-xs font-bold border border-warning-light/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" /> De-allocate SKU
              </button>
              
              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <button
                  id="drawer-close"
                  type="button"
                  onClick={() => setInspectedProduct(null)}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-border-subtle rounded-full font-sans text-xs font-semibold text-text-secondary hover:bg-sidebarbg transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  id="drawer-edit-switch"
                  type="button"
                  onClick={() => {
                    onEdit(activeInspectedProduct);
                    setInspectedProduct(null);
                  }}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-brand text-white rounded-full font-sans text-xs font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Adjust Spec Config
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Standalone Product History Modal */}
      {historyProduct && (
        <div className="fixed inset-0 z-55 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" onClick={() => setHistoryProduct(null)}>
          <div 
            className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col justify-between animate-slide-up border border-border-subtle" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-border-subtle flex items-start justify-between bg-sidebarbg/40">
              <div className="space-y-1">
                <span className="bg-brand text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {historyProduct.sku}
                </span>
                <h3 className="font-sans font-extrabold text-text-primary text-base md:text-lg flex items-center gap-2 mt-1">
                  <History className="h-5 w-5 text-brand animate-pulse" />
                  <span>Stock Moving Ledger</span>
                </h3>
              </div>
              <button 
                id="close-history-modal"
                type="button" 
                onClick={() => setHistoryProduct(null)}
                className="p-1.5 hover:bg-slate-100 text-text-secondary hover:text-text-primary rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content info card */}
            <div className="px-5 py-3 bg-slate-50 border-b border-border-subtle flex items-center justify-between text-xs font-sans">
              <div>
                <span className="text-text-secondary font-semibold">SKU Name:</span>{' '}
                <span className="text-text-primary font-bold">{historyProduct.name}</span>
              </div>
              <div className="flex gap-2.5">
                <span className="bg-white border border-border-subtle text-text-primary rounded-md px-2 py-0.5 font-bold">
                  Current: {historyProduct.quantity} qty
                </span>
              </div>
            </div>

            {/* List area */}
            <div className="p-5 overflow-y-auto space-y-4 max-h-[50vh] scrollbar-hidden">
              {(() => {
                const filteredLogs = logs.filter(l => l.productId === historyProduct.id);
                if (filteredLogs.length === 0) {
                  return (
                    <div className="text-center py-10 space-y-2">
                      <History className="h-10 w-10 text-slate-300 mx-auto animate-pulse" />
                      <p className="text-text-secondary text-xs font-sans italic">
                        No auditable transfer ledger logs found for this SKU yet.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4 relative pl-3.5 border-l border-border-subtle">
                    {filteredLogs.map((item) => {
                      const isAdd = item.type === 'addition';
                      const isRed = item.type === 'reduction';
                      const isDel = item.type === 'deletion';

                      let badgeBg = 'bg-slate-100 text-slate-700';
                      let labelText = 'Updated Attributes';
                      let changeColor = 'text-slate-700';
                      
                      if (isAdd) {
                        badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-100';
                        labelText = 'Inbound Replenishment';
                        changeColor = 'text-emerald-700 font-extrabold';
                      } else if (isRed) {
                        badgeBg = 'bg-amber-50 text-amber-850 border-amber-100';
                        labelText = 'Sales Transaction / Outbound';
                        changeColor = 'text-amber-800 font-extrabold';
                      } else if (isDel) {
                        badgeBg = 'bg-red-50 text-red-800 border-red-100';
                        labelText = 'SKU Removed';
                        changeColor = 'text-red-700 font-extrabold';
                      }

                      return (
                        <div key={item.id} className="relative space-y-1.5 animate-fade-in text-xs font-sans">
                          {/* Chronological dot indicator */}
                          <span className={`absolute -left-[19.5px] top-1.5 h-2.5 w-2.5 rounded-full ${
                            isAdd ? 'bg-emerald-500' : isRed ? 'bg-amber-500' : isDel ? 'bg-red-500' : 'bg-slate-400'
                          } border-2 border-white shadow-xs`} />

                          {/* Top row */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badgeBg} font-bold`}>
                              {labelText}
                            </span>
                            <span className="text-[10px] text-text-secondary font-mono">
                              {new Date(item.timestamp).toLocaleString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Notes */}
                          <p className="text-text-primary text-xs font-semibold leading-relaxed pl-1.5 bg-sidebarbg/35 p-2 rounded-xl border border-border-subtle/50">
                            {item.notes}
                          </p>

                          {/* Change amount badge */}
                          <div className="flex items-center justify-between pl-1.5 pt-0.5 text-[10.5px]">
                            <span className="text-text-secondary">Quantity movement:</span>
                            <span className={changeColor}>
                              {item.quantityChange > 0 ? `+${item.quantityChange}` : item.quantityChange} units
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border-subtle bg-sidebarbg/50 flex justify-end">
              <button
                id="close-history-modal-btn"
                type="button"
                onClick={() => setHistoryProduct(null)}
                className="px-5 py-2.5 bg-brand text-white rounded-xl font-sans text-xs font-bold hover:brightness-105 shadow-xs transition-colors cursor-pointer"
              >
                Dismiss History
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
