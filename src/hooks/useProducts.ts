import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { queueOperation, getPendingCount } from '../lib/syncQueue';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(0);

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
      const count = await getPendingCount();
      setPendingSync(count);
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

  const addProduct = async (productData: Omit<Product, 'id' | 'updated_at'>) => {
    setLoading(true);
    try {
      const supabase = await getSupabaseClient();
      let newProduct: Product;

      if (supabase) {
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
        const local = await AsyncStorage.getItem('eim_products');
        const list: Product[] = local ? JSON.parse(local) : [];
        list.unshift(newProduct);
        await AsyncStorage.setItem('eim_products', JSON.stringify(list));

        const log: InventoryLog = {
          id: `log-${Date.now()}`,
          productId: newProduct.id,
          productName: newProduct.name,
          type: 'addition',
          quantityChange: newProduct.quantity,
          timestamp: new Date().toISOString(),
          notes: `Added new product with initial quantity of ${newProduct.quantity} units.`,
        };
        const localLogs = await AsyncStorage.getItem('eim_logs');
        const logList: InventoryLog[] = localLogs ? JSON.parse(localLogs) : [];
        logList.unshift(log);
        await AsyncStorage.setItem('eim_logs', JSON.stringify(logList));

        await queueOperation('insert_product', newProduct);
        await queueOperation('insert_log', log);
      }

      await loadData();
      return newProduct;
    } catch (err: any) {
      setError(err.message || "Failed to add product");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (
    productData: Product,
    logType: 'addition' | 'reduction' | 'update' = 'update',
    quantityDiff: number = 0,
    notes?: string
  ) => {
    setLoading(true);
    try {
      const supabase = await getSupabaseClient();
      let updatedProduct: Product;

      if (supabase) {
        updatedProduct = await updateProductInDB(productData);
        if (quantityDiff !== 0 || notes) {
          await addInventoryLog(
            updatedProduct.id,
            updatedProduct.name,
            logType,
            quantityDiff,
            notes || 'Product updated'
          );
        }
      } else {
        updatedProduct = { ...productData, updated_at: new Date().toISOString() };
        const local = await AsyncStorage.getItem('eim_products');
        const list: Product[] = local ? JSON.parse(local) : [];
        const idx = list.findIndex(p => p.id === updatedProduct.id);
        if (idx !== -1) list[idx] = updatedProduct;
        else list.unshift(updatedProduct);
        await AsyncStorage.setItem('eim_products', JSON.stringify(list));

        await queueOperation('update_product', updatedProduct);

        if (quantityDiff !== 0) {
          const log: InventoryLog = {
            id: `log-${Date.now()}`,
            productId: updatedProduct.id,
            productName: updatedProduct.name,
            type: logType,
            quantityChange: quantityDiff,
            timestamp: new Date().toISOString(),
            notes: notes || 'Product updated',
          };
          const localLogs = await AsyncStorage.getItem('eim_logs');
          const logList: InventoryLog[] = localLogs ? JSON.parse(localLogs) : [];
          logList.unshift(log);
          await AsyncStorage.setItem('eim_logs', JSON.stringify(logList));
          await queueOperation('insert_log', log);
        }
      }

      await loadData();
      return updatedProduct;
    } catch (err: any) {
      setError(err.message || "Failed to update product");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    setLoading(true);
    try {
      const prodToRemove = products.find(p => p.id === id);
      if (!prodToRemove) return;

      const supabase = await getSupabaseClient();

      if (supabase) {
        const success = await deleteProductFromDB(id);
        if (success) {
          await addInventoryLog(id, prodToRemove.name, 'deletion', -prodToRemove.quantity, 'Deleted from inventory');
        }
      } else {
        const local = await AsyncStorage.getItem('eim_products');
        if (local) {
          const list: Product[] = JSON.parse(local);
          await AsyncStorage.setItem('eim_products', JSON.stringify(list.filter(p => p.id !== id)));
        }

        const log: InventoryLog = {
          id: `log-${Date.now()}`,
          productId: id,
          productName: prodToRemove.name,
          type: 'deletion',
          quantityChange: -prodToRemove.quantity,
          timestamp: new Date().toISOString(),
          notes: 'Deleted from inventory',
        };
        const localLogs = await AsyncStorage.getItem('eim_logs');
        const logList: InventoryLog[] = localLogs ? JSON.parse(localLogs) : [];
        logList.unshift(log);
        await AsyncStorage.setItem('eim_logs', JSON.stringify(logList));

        await queueOperation('delete_product', { id });
        await queueOperation('insert_log', log);
      }

      await loadData();
      return true;
    } catch (err: any) {
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
