import { useState, useEffect, useCallback, useRef } from 'react';
import { Product, InventoryLog } from '../types';
import {
  fetchProducts,
  insertProduct as insertProductDB,
  updateProductInDB,
  deleteProductFromDB,
  fetchLogs,
  addInventoryLog,
  getSupabaseClient,
} from '../lib/supabaseClient';
import { useOnlineStatus } from './useOnlineStatus';
import { queueOperation, syncPendingOps, getPendingCount } from '../lib/syncQueue';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(0);

  const isOnline = useOnlineStatus();
  const prevOnline = useRef(isOnline);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodsData, logsData] = await Promise.all([
        fetchProducts(),
        fetchLogs()
      ]);
      setProducts(prodsData);
      setLogs(logsData);
      setPendingSync(getPendingCount());
    } catch (err: any) {
      console.error("Failed loading data", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When coming back online, sync pending operations then reload
  useEffect(() => {
    if (isOnline && !prevOnline.current) {
      const doSync = async () => {
        const { synced } = await syncPendingOps();
        if (synced > 0) {
          await loadData();
        }
        setPendingSync(getPendingCount());
      };
      doSync();
    }
    prevOnline.current = isOnline;
  }, [isOnline, loadData]);

  const addProduct = async (productData: Omit<Product, 'id' | 'updated_at'>) => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      let newProduct: Product;

      if (supabase && isOnline) {
        newProduct = await insertProductDB(productData);
        await addInventoryLog(
          newProduct.id,
          newProduct.name,
          'addition',
          newProduct.quantity,
          `Added new product with initial quantity of ${newProduct.quantity} units.`
        );
      } else {
        newProduct = {
          ...productData,
          id: `prod-${Date.now()}`,
          updated_at: new Date().toISOString(),
        };
        // Save locally
        const local = localStorage.getItem('eim_products');
        const list: Product[] = local ? JSON.parse(local) : [];
        list.unshift(newProduct);
        localStorage.setItem('eim_products', JSON.stringify(list));

        const log: InventoryLog = {
          id: `log-${Date.now()}`,
          productId: newProduct.id,
          productName: newProduct.name,
          type: 'addition',
          quantityChange: newProduct.quantity,
          timestamp: new Date().toISOString(),
          notes: `Added new product with initial quantity of ${newProduct.quantity} units.`,
        };
        const localLogs = localStorage.getItem('eim_logs');
        const logList: InventoryLog[] = localLogs ? JSON.parse(localLogs) : [];
        logList.unshift(log);
        localStorage.setItem('eim_logs', JSON.stringify(logList));

        queueOperation('insert_product', newProduct);
        queueOperation('insert_log', log);
        setPendingSync(getPendingCount());
      }

      await loadData();
      return newProduct;
    } catch (err: any) {
      console.error("Failed to add product", err);
      setError(err.message || "Failed to add product");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (
    productData: Product,
    logType?: 'addition' | 'reduction' | 'update',
    quantityDiff?: number,
    notes?: string
  ) => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      let updatedProduct: Product;

      if (supabase && isOnline) {
        updatedProduct = await updateProductInDB(productData);
        if (logType) {
          await addInventoryLog(
            updatedProduct.id,
            updatedProduct.name,
            logType,
            quantityDiff || 0,
            notes || 'Product updated'
          );
        }
      } else {
        updatedProduct = { ...productData, updated_at: new Date().toISOString() };
        const local = localStorage.getItem('eim_products');
        const list: Product[] = local ? JSON.parse(local) : [];
        const idx = list.findIndex(p => p.id === updatedProduct.id);
        if (idx !== -1) list[idx] = updatedProduct;
        else list.unshift(updatedProduct);
        localStorage.setItem('eim_products', JSON.stringify(list));

        queueOperation('update_product', updatedProduct);

        if (logType) {
          const log: InventoryLog = {
            id: `log-${Date.now()}`,
            productId: updatedProduct.id,
            productName: updatedProduct.name,
            type: logType,
            quantityChange: quantityDiff || 0,
            timestamp: new Date().toISOString(),
            notes: notes || 'Product updated',
          };
          const localLogs = localStorage.getItem('eim_logs');
          const logList: InventoryLog[] = localLogs ? JSON.parse(localLogs) : [];
          logList.unshift(log);
          localStorage.setItem('eim_logs', JSON.stringify(logList));
          queueOperation('insert_log', log);
        }
        setPendingSync(getPendingCount());
      }

      await loadData();
      return updatedProduct;
    } catch (err: any) {
      console.error("Failed to update product", err);
      setError(err.message || "Failed to update product");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string, name: string, quantity: number) => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();

      if (supabase && isOnline) {
        const success = await deleteProductFromDB(id);
        if (success) {
          await addInventoryLog(id, name, 'deletion', -quantity, 'Deleted product from inventory');
        }
      } else {
        const local = localStorage.getItem('eim_products');
        if (local) {
          const list: Product[] = JSON.parse(local);
          localStorage.setItem('eim_products', JSON.stringify(list.filter(p => p.id !== id)));
        }

        const log: InventoryLog = {
          id: `log-${Date.now()}`,
          productId: id,
          productName: name,
          type: 'deletion',
          quantityChange: -quantity,
          timestamp: new Date().toISOString(),
          notes: 'Deleted product from inventory',
        };
        const localLogs = localStorage.getItem('eim_logs');
        const logList: InventoryLog[] = localLogs ? JSON.parse(localLogs) : [];
        logList.unshift(log);
        localStorage.setItem('eim_logs', JSON.stringify(logList));

        queueOperation('delete_product', { id });
        queueOperation('insert_log', log);
        setPendingSync(getPendingCount());
      }

      await loadData();
      return true;
    } catch (err: any) {
      console.error("Failed to delete product", err);
      setError(err.message || "Failed to delete product");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    logs,
    loading,
    error,
    pendingSync,
    refresh: loadData,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
