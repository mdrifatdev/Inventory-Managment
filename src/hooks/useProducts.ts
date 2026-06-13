import { useState, useEffect, useCallback } from 'react';
import { Product, InventoryLog } from '../types';
import { 
  fetchProducts, 
  insertProduct, 
  updateProductInDB, 
  deleteProductFromDB,
  fetchLogs,
  addInventoryLog
} from '../lib/supabaseClient';
import { useOnlineStatus } from './useOnlineStatus';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isOnline = useOnlineStatus();

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
    } catch (err: any) {
      console.error("Failed loading data", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, isOnline]); // Reload when connection status changes

  const addProduct = async (productData: Omit<Product, 'id' | 'updated_at'>) => {
    setLoading(true);
    try {
      const newProduct = await insertProduct(productData);
      
      // Add a log for initial stock
      await addInventoryLog(
        newProduct.id,
        newProduct.name,
        'addition',
        newProduct.quantity,
        `Added new product with initial quantity of ${newProduct.quantity} units.`
      );
      
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

  const updateProduct = async (productData: Product, logType?: 'addition' | 'reduction' | 'update', quantityDiff?: number, notes?: string) => {
    setLoading(true);
    try {
      const updatedProduct = await updateProductInDB(productData);
      
      if (logType) {
        await addInventoryLog(
          updatedProduct.id,
          updatedProduct.name,
          logType,
          quantityDiff || 0,
          notes || `Product updated`
        );
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
      const success = await deleteProductFromDB(id);
      if (success) {
        await addInventoryLog(
          id,
          name,
          'deletion',
          -quantity,
          `Deleted product from inventory`
        );
        await loadData();
      }
      return success;
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
    refresh: loadData,
    addProduct,
    updateProduct,
    deleteProduct
  };
}
