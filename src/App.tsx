/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  fetchProducts, 
  fetchLogs, 
  insertProduct, 
  updateProductInDB, 
  deleteProductFromDB, 
  addInventoryLog,
  loadSettings
} from './supabaseClient';
import { Product, InventoryLog } from './types';
import { 
  getProductBatches, 
  addProductToBatches, 
  sellProductFromBatches 
} from './batchUtils';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductsList from './components/ProductsList';
import AddProductForm from './components/AddProductForm';
import SettingsPanel from './components/SettingsPanel';
import { 
  Zap, 
  History, 
  FileText, 
  Search, 
  AlertTriangle,
  RotateCcw,
  CloudLightning,
  CornerDownRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [productsListFilter, setProductsListFilter] = useState<'all' | 'low-stock' | 'out-of-stock'>('all');

  // Logs search query
  const [logsQuery, setLogsQuery] = useState('');

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

  const loadAllData = async () => {
    setLoading(true);
    try {
      const prodsData = await fetchProducts();
      const logsData = await fetchLogs();
      setProducts(prodsData);
      setLogs(logsData);
    } catch (e) {
      console.error("Failed loading stock data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleLowStockFilterClick = () => {
    setProductsListFilter('low-stock');
    setCurrentView('products');
  };

  const handleOutOfStockFilterClick = () => {
    setProductsListFilter('out-of-stock');
    setCurrentView('products');
  };

  const handleCreateOrUpdateProduct = async (payload: Omit<Product, 'id' | 'updated_at'> & { id?: string }) => {
    setLoading(true);
    try {
      // Check if a product with the exact same SKU already exists (only for additions, not for editing an existing product ID)
      const existingProductWithSKU = !payload.id 
        ? products.find(p => p.sku.trim().toUpperCase() === payload.sku.trim().toUpperCase()) 
        : null;

      if (existingProductWithSKU) {
        // This is a reorder / replenishment batch of an existing product! Merge it.
        const updatedWithBatch = addProductToBatches(existingProductWithSKU, payload.quantity, payload.price);
        
        // Also copy over any fresh details if edited
        updatedWithBatch.name = payload.name;
        updatedWithBatch.brand = payload.brand || updatedWithBatch.brand;
        updatedWithBatch.description = payload.description || updatedWithBatch.description;
        updatedWithBatch.image_url = payload.image_url || updatedWithBatch.image_url;
        updatedWithBatch.category = payload.category || updatedWithBatch.category;
        updatedWithBatch.minThreshold = payload.minThreshold;

        const updated = await updateProductInDB(updatedWithBatch);

        await addInventoryLog(
          updated.id,
          updated.name,
          'addition',
          payload.quantity,
          `Replenished stock with new batch: +${payload.quantity} units at different price of $${payload.price.toFixed(2)}/unit.`
        );
      } else if (payload.id) {
        // Find existing to log quantity difference correctly
        const existing = products.find(p => p.id === payload.id);
        const qtyDiff = payload.quantity - (existing?.quantity || 0);
        
        let updatedPayload = { ...payload } as Product;

        if (qtyDiff !== 0) {
          if (qtyDiff > 0) {
            // Addition: append new batch with current price
            updatedPayload = addProductToBatches(existing!, qtyDiff, payload.price);
          } else {
            // Reduction: deplete FIFO
            const { updatedProduct } = sellProductFromBatches(existing!, Math.abs(qtyDiff));
            updatedPayload = updatedProduct;
          }
        } else {
          // No quantity change: conserve existing batches
          updatedPayload.batches = existing?.batches || getProductBatches(existing!);
        }

        const updated = await updateProductInDB(updatedPayload);
        
        let note = `Updated device details & specifications for SKU: ${payload.sku}`;
        let logType: InventoryLog['type'] = 'update';

        if (qtyDiff !== 0) {
          logType = qtyDiff > 0 ? 'addition' : 'reduction';
          note = `Stock level adjusted manually by ${qtyDiff > 0 ? `+${qtyDiff}` : qtyDiff} units on specification edit.`;
        }

        await addInventoryLog(updated.id, updated.name, logType, qtyDiff, note);
      } else {
        // Inserting a totally new product SKU: initialize with its first batch
        const productWithInitBatch: Omit<Product, 'id' | 'updated_at'> = {
          ...payload,
          batches: [
            {
              id: `batch-${Date.now()}-init`,
              price: payload.price,
              quantity: payload.quantity,
              originalQuantity: payload.quantity,
              addedAt: new Date().toISOString()
            }
          ]
        };

        const newlyAdded = await insertProduct(productWithInitBatch);
        await addInventoryLog(
          newlyAdded.id, 
          newlyAdded.name, 
          'addition', 
          newlyAdded.quantity, 
          `Registered new product catalogue with initial amount of ${newlyAdded.quantity} units.`
        );
      }
      
      // Reload everything
      await loadAllData();
      setEditingProduct(null);
      setProductsListFilter('all');
      setCurrentView('products');
    } catch (err) {
      console.error("Failed to save product", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const prodToRemove = products.find(p => p.id === id);
    if (!prodToRemove) return;

    setLoading(true);
    try {
      const ok = await deleteProductFromDB(id);
      if (ok) {
        await addInventoryLog(
          id, 
          prodToRemove.name, 
          'deletion', 
          -prodToRemove.quantity, 
          `De-allocated product SKU: ${prodToRemove.sku} completely from active warehouse.`
        );
        await loadAllData();
      }
    } catch (err) {
      console.error("Failed to delete item", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProductQuantityOnly = async (
    id: string, 
    newQty: number, 
    logType: 'addition' | 'reduction',
    transactionPrice?: number,
    customNotes?: string
  ) => {
    const original = products.find(p => p.id === id);
    if (!original) return;

    const diff = newQty - original.quantity;
    if (diff === 0) return;

    let updatedPayload: Product;
    let logNotes = "";

    if (logType === 'addition') {
      const priceToUse = transactionPrice !== undefined ? transactionPrice : original.price;
      updatedPayload = addProductToBatches(original, Math.abs(diff), priceToUse);
      
      const transPriceFormatted = priceToUse.toFixed(2);
      if (customNotes && customNotes.trim() !== "") {
        logNotes = `${customNotes.trim()} [Replenished at $${transPriceFormatted}/unit]`;
      } else {
        logNotes = `Dispatched addition: +${Math.abs(diff)} units in new batch at $${transPriceFormatted}/unit.`;
      }
    } else {
      // FIFO depletion from batches!
      const { updatedProduct, priceDetails, notes } = sellProductFromBatches(original, Math.abs(diff), customNotes);
      updatedPayload = updatedProduct;
      logNotes = notes;
    }

    try {
      const updated = await updateProductInDB(updatedPayload);
      
      await addInventoryLog(
        id, 
        original.name, 
        logType, 
        diff, 
        logNotes
      );
      
      // Refresh local states
      const prodsCopy = [...products];
      const idx = prodsCopy.findIndex(p => p.id === id);
      if (idx !== -1) {
        prodsCopy[idx] = updated;
        setProducts(prodsCopy);
      }
      
      const newLogs = await fetchLogs();
      setLogs(newLogs);
    } catch (err) {
      console.error("Failed quick quantity adjustment", err);
    }
  };

  const handleEditClick = (prod: Product) => {
    setEditingProduct(prod);
    setCurrentView('add-product');
  };

  const handleCancelForm = () => {
    setEditingProduct(null);
    setCurrentView('products');
  };

  // Filter logs for ledger search
  const filteredLogs = logs.filter(l => 
    l.productName.toLowerCase().includes(logsQuery.toLowerCase()) ||
    l.type.toLowerCase().includes(logsQuery.toLowerCase()) ||
    (l.notes && l.notes.toLowerCase().includes(logsQuery.toLowerCase()))
  );

  const lowStockCount = products.filter(p => p.quantity <= p.minThreshold && p.quantity > 0).length;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-pagebg text-text-primary font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
          setEditingProduct(null);
          // When clicking inventory tab, clear active statuses so they see everything by default
          if (view === 'products') {
            setProductsListFilter('all');
          }
          setCurrentView(view);
        }} 
        lowStockCount={lowStockCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 font-sans">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
            <p className="text-xs text-text-secondary font-semibold tracking-wide">Syncing product ledger caches...</p>
          </div>
        ) : (
          <>
            {/* View Switching */}
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
              <ProductsList 
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
              <AddProductForm 
                productToEdit={editingProduct}
                onSave={handleCreateOrUpdateProduct}
                onCancel={handleCancelForm}
              />
            )}

            {currentView === 'logs' && (
              <div className="bg-white border border-border-subtle rounded-3xl p-6 md:p-8 space-y-6 animate-fade-in shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <History className="h-6 w-6 text-brand" />
                    <div>
                      <h2 className="font-sans font-bold text-text-primary text-lg md:text-xl">Audit Movement Logs</h2>
                      <p className="text-xs text-text-secondary font-sans">Full trace records of all stock updates, additions, and de-allocations</p>
                    </div>
                  </div>
                  
                  {/* Search logs input */}
                  <div className="relative w-full sm:max-w-xs shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                      <Search className="h-3.5 w-3.5" />
                    </span>
                    <input
                      id="log-list-search"
                      type="text"
                      placeholder="Search ledger entries..."
                      value={logsQuery}
                      onChange={(e) => setLogsQuery(e.target.value)}
                      className="w-full bg-inputbg border border-border-subtle focus:outline-none focus:border-brand rounded-full pl-8.5 pr-3 py-2 font-sans text-xs text-text-primary"
                    />
                  </div>
                </div>

                {/* Logs Listing table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs border-collapse divide-y divide-border-subtle">
                    <thead>
                      <tr className="text-text-secondary uppercase tracking-wider font-semibold text-[10px] bg-sidebarbg rounded-lg">
                        <th className="py-3.5 px-4 font-bold">Timestamp</th>
                        <th className="py-3.5 px-4 font-bold">Item Target</th>
                        <th className="py-3.5 px-4 font-bold">Action Type</th>
                        <th className="py-3.5 px-4 font-bold">Shift Amount</th>
                        <th className="py-3.5 px-4 font-bold">Technical Details / Logs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle font-sans text-text-secondary">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-text-secondary font-sans text-xs">
                            No matching audited transactions discovered.
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => {
                          let badgeStyle = "bg-sidebarbg text-text-secondary border border-border-subtle";
                          if (log.type === "addition") badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-250 font-semibold";
                          if (log.type === "reduction") badgeStyle = "bg-amber-50 text-amber-950 border-amber-250 font-semibold";
                          if (log.type === "deletion") badgeStyle = "bg-warning-light text-warning-primary border-warning-light/30 font-semibold";

                          return (
                            <tr key={log.id} className="hover:bg-sidebarbg/50 transition-colors">
                              <td className="py-3.5 px-4 font-mono text-[10.5px] text-text-secondary whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString("en-US", {
                                  year: 'numeric',
                                  month: 'short',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-text-primary max-w-[150px] truncate">
                                {log.productName}
                              </td>
                              <td className="py-3.5 px-4 font-bold">
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badgeStyle}`}>
                                  {log.type}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold">
                                {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange} units
                              </td>
                              <td className="py-3.5 px-4 text-text-secondary max-w-sm font-sans flex items-start gap-1">
                                <CornerDownRight className="h-3 w-3 mt-1 shrink-0 text-text-secondary" />
                                <span className="line-clamp-2">{log.notes || "System update logging statement"}</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentView === 'settings' && (
              <SettingsPanel 
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
                onSettingsSaved={async () => {
                  await loadAllData();
                }} 
              />
            )}
          </>
        )}
      </main>

      {/* Floating Action Button */}
      <AnimatePresence>
        {currentView !== 'add-product' && (
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
