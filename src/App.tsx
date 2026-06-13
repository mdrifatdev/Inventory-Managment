import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from './lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';
import AuthPanel from './components/AuthPanel';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import SettingsPanel from './components/SettingsPanel';
import { Product } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { useProducts } from './hooks/useProducts';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productsListFilter, setProductsListFilter] = useState<'all' | 'low-stock' | 'out-of-stock'>('all');

  const { products, logs, loading, addProduct, updateProduct, deleteProduct, refresh } = useProducts();

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme_preference');
    if (saved) return saved === 'dark';
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme_preference', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const [sessionUser, setSessionUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSessionUser(session?.user ?? null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSessionUser(session?.user ?? null);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setSessionUser(null);
    }
  }, [currentView]);

  const handleLowStockFilterClick = () => {
    setProductsListFilter('low-stock');
    setCurrentView('products');
  };

  const handleOutOfStockFilterClick = () => {
    setProductsListFilter('out-of-stock');
    setCurrentView('products');
  };

  const handleCreateOrUpdateProduct = async (payload: Omit<Product, 'id' | 'updated_at'> & { id?: string }) => {
    if (payload.id) {
      const existing = products.find(p => p.id === payload.id);
      const qtyDiff = payload.quantity - (existing?.quantity || 0);
      let logType: 'addition' | 'reduction' | 'update' = 'update';
      let note = `Updated details for SKU: ${payload.sku}`;

      if (qtyDiff !== 0) {
        logType = qtyDiff > 0 ? 'addition' : 'reduction';
        note = `Stock level adjusted manually by ${qtyDiff > 0 ? `+${qtyDiff}` : qtyDiff} units on specification edit.`;
      }
      await updateProduct(payload as Product, logType, qtyDiff, note);
    } else {
      await addProduct(payload);
    }
    setEditingProduct(null);
    setProductsListFilter('all');
    setCurrentView('products');
  };

  const handleDeleteProduct = async (id: string) => {
    const prodToRemove = products.find(p => p.id === id);
    if (!prodToRemove) return;
    await deleteProduct(id, prodToRemove.name, prodToRemove.quantity);
  };

  const handleUpdateProductQuantityOnly = async (
    id: string, 
    newQty: number, 
    logType: 'addition' | 'reduction',
    isUsedCustom?: boolean,
    customNotes?: string
  ) => {
    const original = products.find(p => p.id === id);
    if (!original) return;

    const diff = newQty - original.quantity;
    if (diff === 0) return;

    const updatedPayload = { ...original, quantity: newQty };
    
    let logNotes = customNotes;
    if (!logNotes || logNotes.trim() === "") {
      if (logType === 'addition') {
        const usedStatusToUse = isUsedCustom !== undefined ? isUsedCustom : (original.isUsed ?? false);
        logNotes = `Dispatched addition: +${Math.abs(diff)} units (${usedStatusToUse ? 'Used' : 'New'}).`;
      } else {
        logNotes = `Dispatched reduction: -${Math.abs(diff)} units.`;
      }
    }

    await updateProduct(updatedPayload, logType, diff, logNotes);
  };

  const handleEditClick = (prod: Product) => {
    setEditingProduct(prod);
    setCurrentView('edit-product');
  };

  const handleCancelForm = () => {
    setEditingProduct(null);
    setCurrentView('products');
  };

  const lowStockCount = products.filter(p => p.quantity <= p.minThreshold && p.quantity > 0).length;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-pagebg text-text-primary font-sans">
      <Navbar 
        currentView={currentView} 
        onViewChange={(view) => {
          setEditingProduct(null);
          if (view === 'products') {
            setProductsListFilter('all');
          }
          setCurrentView(view);
        }} 
        lowStockCount={lowStockCount}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
        sessionUser={sessionUser}
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 font-sans">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
            <p className="text-xs text-text-secondary font-semibold tracking-wide">Loading inventory...</p>
          </div>
        ) : (
          <>
            {currentView === 'dashboard' && (
              <Dashboard 
                products={products}
                logs={logs}
                onViewChange={(view) => {
                  setEditingProduct(null);
                  setCurrentView(view);
                }}
                onFilterLowStock={handleLowStockFilterClick}
                onFilterOutOfStock={handleOutOfStockFilterClick}
              />
            )}

            {currentView === 'products' && (
              <Products 
                products={products}
                logs={logs}
                initialFilter={productsListFilter}
                onEdit={handleEditClick}
                onDelete={handleDeleteProduct}
                onUpdateQuantity={handleUpdateProductQuantityOnly}
                onViewChange={setCurrentView}
              />
            )}

            {currentView === 'add-product' && (
              <AddProduct 
                onSave={handleCreateOrUpdateProduct}
                onCancel={handleCancelForm}
              />
            )}

            {currentView === 'edit-product' && editingProduct && (
              <EditProduct 
                product={editingProduct}
                onSave={handleCreateOrUpdateProduct}
                onCancel={handleCancelForm}
              />
            )}

            {currentView === 'settings' && (
              <SettingsPanel 
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
                isOfflineModeEnabled={false}
                onToggleOfflineMode={() => {}}
                onSettingsSaved={async () => {
                  refresh();
                }} 
              />
            )}

            {currentView === 'auth' && (
              <AuthPanel 
                sessionUser={sessionUser}
                isOfflineModeEnabled={false}
                onViewChange={setCurrentView}
              />
            )}
          </>
        )}
      </main>

      <AnimatePresence>
        {currentView !== 'add-product' && currentView !== 'edit-product' && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingProduct(null);
              setCurrentView('add-product');
            }}
            className="fixed bottom-6 right-6 z-40 bg-brand hover:brightness-110 text-white rounded-full w-14 h-14 md:w-auto md:h-auto md:pl-4 md:pr-5 md:py-3.5 shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 group border border-brand/20 active:scale-95"
            title="Add Product"
          >
            <Plus className="h-6 w-6 stroke-[3] shrink-0" />
            <span className="hidden md:inline font-sans font-bold text-xs uppercase tracking-wider whitespace-nowrap">
              Add Product
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
