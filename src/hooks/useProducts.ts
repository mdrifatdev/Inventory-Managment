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
import { logger } from '../lib/logger';
import { validateProduct } from '../lib/validation';
import { generateProductId } from '../lib/idGenerator';

const PRODUCTS_STORAGE_KEY = 'eim_products';
const LOGS_STORAGE_KEY = 'eim_logs';

/**
 * Hook for managing products and inventory logs
 * Handles both online (Supabase) and offline (AsyncStorage) operations
 */
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
      logger.info('Data loaded successfully');
    } catch (err: any) {
      const errorMsg = err.message || "Failed to load data";
      logger.error("Failed loading data", err);
      setError(errorMsg);
      setProducts([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'updated_at'>) => {
    // Validate input
    const validationErrors = validateProduct(productData as any);
    if (validationErrors.length > 0) {
      const errorMsg = validationErrors.map(e => e.message).join(', ');
      logger.error('Validation failed', validationErrors);
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setLoading(true);
    const previousProducts = products;
    
    try {
      const supabase = await getSupabaseClient();
      let newProduct: Product;

      if (supabase) {
        newProduct = await insertProductDB(productData);
        
        // Create log for addition
        await addInventoryLog(
          newProduct.id,
          newProduct.name,
          'addition',
          newProduct.quantity,
          `Added new product with initial quantity of ${newProduct.quantity} units.`
        );
        
        logger.info(`Product added: ${newProduct.id}`);
      } else {
        // Offline mode
        newProduct = {
          ...productData,
          id: generateProductId(),
          updated_at: new Date().toISOString(),
        };

        // Update local storage
        const list: Product[] = previousProducts;
        list.unshift(newProduct);
        await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(list));
        setProducts(list);

        // Create log
        const log: InventoryLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productId: newProduct.id,
          productName: newProduct.name,
          type: 'addition',
          quantityChange: newProduct.quantity,
          timestamp: new Date().toISOString(),
          notes: `Added new product with initial quantity of ${newProduct.quantity} units.`,
        };
        const logList: InventoryLog[] = logs;
        logList.unshift(log);
        await AsyncStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logList));
        setLogs(logList);

        // Queue for sync
        await queueOperation('insert_product', newProduct);
        await queueOperation('insert_log', log);
        
        logger.info(`Product added offline: ${newProduct.id}`);
      }

      await loadData();
      setError(null);
      return newProduct;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to add product";
      logger.error('Add product error', err);
      setError(errorMsg);
      // Rollback on error
      setProducts(previousProducts);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [products, logs, loadData]);

  const updateProduct = useCallback(async (
    productData: Product,
    logType: 'addition' | 'reduction' | 'update' = 'update',
    quantityDiff: number = 0,
    notes?: string
  ) => {
    // Validate input
    const validationErrors = validateProduct(productData as any);
    if (validationErrors.length > 0) {
      const errorMsg = validationErrors.map(e => e.message).join(', ');
      logger.error('Validation failed', validationErrors);
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setLoading(true);
    const previousProducts = products;
    const previousLogs = logs;

    try {
      const supabase = await getSupabaseClient();
      let updatedProduct: Product;

      if (supabase) {
        updatedProduct = await updateProductInDB(productData);
        
        // Create log if there's a quantity change or notes
        if (quantityDiff !== 0 || notes) {
          await addInventoryLog(
            updatedProduct.id,
            updatedProduct.name,
            logType,
            quantityDiff,
            notes || 'Product updated'
          );
        }
        
        logger.info(`Product updated: ${productData.id}`);
      } else {
        // Offline mode
        updatedProduct = { ...productData, updated_at: new Date().toISOString() };
        
        const list: Product[] = previousProducts;
        const idx = list.findIndex(p => p.id === updatedProduct.id);
        if (idx !== -1) {
          list[idx] = updatedProduct;
        } else {
          list.unshift(updatedProduct);
        }
        await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(list));
        setProducts(list);

        // Queue update
        await queueOperation('update_product', updatedProduct);

        // Create log if needed
        if (quantityDiff !== 0 || notes) {
          const log: InventoryLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            productId: updatedProduct.id,
            productName: updatedProduct.name,
            type: logType,
            quantityChange: quantityDiff,
            timestamp: new Date().toISOString(),
            notes: notes || 'Product updated',
          };
          const logList: InventoryLog[] = previousLogs;
          logList.unshift(log);
          await AsyncStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logList));
          setLogs(logList);
          await queueOperation('insert_log', log);
        }
        
        logger.info(`Product updated offline: ${productData.id}`);
      }

      await loadData();
      setError(null);
      return updatedProduct;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to update product";
      logger.error('Update product error', err);
      setError(errorMsg);
      // Rollback on error
      setProducts(previousProducts);
      setLogs(previousLogs);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [products, logs, loadData]);

  const deleteProduct = useCallback(async (id: string) => {
    setLoading(true);
    const previousProducts = products;
    const previousLogs = logs;

    try {
      const prodToRemove = products.find(p => p.id === id);
      if (!prodToRemove) {
        throw new Error('Product not found');
      }

      const supabase = await getSupabaseClient();

      if (supabase) {
        const success = await deleteProductFromDB(id);
        if (success) {
          await addInventoryLog(
            id,
            prodToRemove.name,
            'deletion',
            -prodToRemove.quantity,
            'Deleted from inventory'
          );
          logger.info(`Product deleted: ${id}`);
        }
      } else {
        // Offline mode
        const local = await AsyncStorage.getItem(PRODUCTS_STORAGE_KEY);
        if (local) {
          const list: Product[] = JSON.parse(local);
          const filtered = list.filter(p => p.id !== id);
          await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(filtered));
          setProducts(filtered);
        }

        // Create deletion log
        const log: InventoryLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productId: id,
          productName: prodToRemove.name,
          type: 'deletion',
          quantityChange: -prodToRemove.quantity,
          timestamp: new Date().toISOString(),
          notes: 'Deleted from inventory',
        };
        const localLogs = await AsyncStorage.getItem(LOGS_STORAGE_KEY);
        const logList: InventoryLog[] = localLogs ? JSON.parse(localLogs) : [];
        logList.unshift(log);
        await AsyncStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logList));
        setLogs(logList);

        // Queue operations
        await queueOperation('delete_product', { id });
        await queueOperation('insert_log', log);
        
        logger.info(`Product deleted offline: ${id}`);
      }

      await loadData();
      setError(null);
      return true;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to delete product";
      logger.error('Delete product error', err);
      setError(errorMsg);
      // Rollback on error
      setProducts(previousProducts);
      setLogs(previousLogs);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [products, logs, loadData]);

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
