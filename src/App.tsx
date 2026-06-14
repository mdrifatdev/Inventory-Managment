import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { getSupabaseClient } from './lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';
import AuthPanel from './components/AuthPanel';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import HistoryPage from './pages/History';
import ProtectedRoute from './components/ProtectedRoute';
import { Product } from './types';
import { useProducts } from './hooks/useProducts';

export default function App() {
  const navigate = useNavigate();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productsListFilter, setProductsListFilter] = useState<'all' | 'low-stock' | 'out-of-stock'>('all');

  const { products, logs, loading, addProduct, updateProduct, deleteProduct } = useProducts();

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
  }, []);

  const handleLowStockFilterClick = () => {
    setProductsListFilter('low-stock');
    navigate('/products');
  };

  const handleOutOfStockFilterClick = () => {
    setProductsListFilter('out-of-stock');
    navigate('/products');
  };

  const handleProductsLinkClick = () => {
    setProductsListFilter('all');
    navigate('/products');
  };

  const handleCreateOrUpdateProduct = async (payload: Omit<Product, 'id' | 'updated_at'> & { id?: string }) => {
    if (payload.id) {
      const existing = products.find(p => p.id === payload.id);
      const qtyDiff = payload.quantity - (existing?.quantity || 0);
      let logType: 'addition' | 'reduction' | 'update' = 'update';
      let note = `Updated details for SKU: ${payload.sku}`;

      if (qtyDiff !== 0) {
        logType = qtyDiff > 0 ? 'addition' : 'reduction';
        note = `Stock adjusted by ${qtyDiff > 0 ? `+${qtyDiff}` : qtyDiff} units on edit.`;
      }
      await updateProduct(payload as Product, logType, qtyDiff, note);
    } else {
      await addProduct(payload);
    }
    setEditingProduct(null);
    setProductsListFilter('all');
    navigate('/products');
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
        logNotes = `Stock in: +${Math.abs(diff)} units.`;
      } else {
        logNotes = `Stock used: -${Math.abs(diff)} units.`;
      }
    }

    await updateProduct(updatedPayload, logType, diff, logNotes);
  };

  const handleEditClick = (prod: Product) => {
    setEditingProduct(prod);
    navigate(`/edit/${prod.id}`);
  };

  const handleCancelForm = () => {
    setEditingProduct(null);
    navigate('/products');
  };

  const lowStockCount = products.filter(p => p.quantity <= p.minThreshold && p.quantity > 0).length;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-pagebg text-text-primary font-sans antialiased">
      <Navbar
        lowStockCount={lowStockCount}
        sessionUser={sessionUser}
        onLowStockClick={handleLowStockFilterClick}
        onProductsClick={handleProductsLinkClick}
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl mx-auto w-full">
        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
            <p className="text-xs text-text-secondary font-semibold tracking-wide">Loading inventory...</p>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={
              <Dashboard
                products={products}
                logs={logs}
                onViewChange={(view) => {
                  if (view === 'products') {
                    setProductsListFilter('all');
                  }
                  navigate(view === 'dashboard' ? '/' : `/${view}`);
                }}
                onFilterLowStock={handleLowStockFilterClick}
                onFilterOutOfStock={handleOutOfStockFilterClick}
              />
            } />

            <Route path="/products" element={
              <Products
                products={products}
                logs={logs}
                initialFilter={productsListFilter}
                onEdit={handleEditClick}
                onDelete={handleDeleteProduct}
                onUpdateQuantity={handleUpdateProductQuantityOnly}
                onViewChange={(view) => navigate(view === 'dashboard' ? '/' : `/${view}`)}
              />
            } />

            <Route path="/add" element={
              <ProtectedRoute>
                <AddProduct
                  onSave={handleCreateOrUpdateProduct}
                  onCancel={handleCancelForm}
                />
              </ProtectedRoute>
            } />

            <Route path="/edit/:id" element={
              <ProtectedRoute>
                {editingProduct ? (
                  <EditProduct
                    product={editingProduct}
                    onSave={handleCreateOrUpdateProduct}
                    onCancel={handleCancelForm}
                  />
                ) : (
                  <div className="text-center py-20 text-text-secondary">Product not found. Go to Products and select Edit again.</div>
                )}
              </ProtectedRoute>
            } />

            <Route path="/logs" element={
              <HistoryPage logs={logs} />
            } />

            <Route path="/auth" element={
              <AuthPanel
                sessionUser={sessionUser}
                isOfflineModeEnabled={false}
                onViewChange={(view) => navigate(view === 'dashboard' ? '/' : `/${view}`)}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
              />
            } />

            <Route path="*" element={
              <div className="text-center py-20 text-text-secondary">
                <h2 className="text-lg font-bold mb-2">Page Not Found</h2>
                <button onClick={() => navigate('/')} className="text-brand hover:underline text-sm cursor-pointer">Return to Dashboard</button>
              </div>
            } />
          </Routes>
        )}
      </main>
    </div>
  );
}
