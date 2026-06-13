import Dexie, { type Table } from 'dexie';
import { Product, InventoryLog } from './types';
import { getSupabaseClient, INITIAL_PRODUCTS, INITIAL_LOGS } from './supabaseClient';

export interface PendingSync {
  id?: number;
  table: 'products' | 'inventory_logs';
  action: 'insert' | 'update' | 'delete';
  targetId: string;
  payload: any;
  timestamp: string;
}

class OfflineInventoryDB extends Dexie {
  products!: Table<Product & { synced?: boolean }, string>;
  inventoryLogs!: Table<InventoryLog & { synced?: boolean }, string>;
  pendingSyncs!: Table<PendingSync, number>;

  constructor() {
    super('OfflineInventoryDB');
    this.version(2).stores({
      products: 'id, name, sku, category, updated_at, synced',
      inventoryLogs: 'id, productId, timestamp, synced',
      pendingSyncs: '++id, table, action, targetId, timestamp'
    });
  }
}

export const db = new OfflineInventoryDB();

// Track active sync sessions so we don't run multiple synchronizations at the same time
let isSyncingActive = false;

/**
 * Initialize Dexie database state from either Supabase or fallback seeds.
 */
export async function initializeOfflineDatabase() {
  const productsCount = await db.products.count();
  const logsCount = await db.inventoryLogs.count();

  const supabase = getSupabaseClient();

  if (productsCount === 0) {
    let initialProductsList: Product[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true });
        if (!error && data) {
          initialProductsList = data as Product[];
        }
      } catch (e) {
        console.warn('Could not contact Supabase for seeding, using static backup.', e);
      }
    }

    if (initialProductsList.length === 0) {
      initialProductsList = INITIAL_PRODUCTS;
    }

    await db.products.bulkPut(
      initialProductsList.map((p) => ({ ...p, synced: !!supabase }))
    );
  }

  if (logsCount === 0) {
    let initialLogsList: InventoryLog[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('inventory_logs')
          .select('*')
          .order('timestamp', { ascending: false });
        if (!error && data) {
          initialLogsList = data as InventoryLog[];
        }
      } catch (e) {
        console.warn('Could not contact Supabase logs for seeding, using static backup.', e);
      }
    }

    if (initialLogsList.length === 0) {
      initialLogsList = INITIAL_LOGS;
    }

    await db.inventoryLogs.bulkPut(
      initialLogsList.map((l) => ({ ...l, synced: !!supabase }))
    );
  }
}

/**
 * Perform manual or automatic background synchronization of pending queues to Supabase
 */
export async function syncOfflineData(setProgressCallback?: (current: number, total: number) => void): Promise<{ success: boolean; syncedCount: number; errorMsg?: string }> {
  // Prevent parallel sync triggers
  if (isSyncingActive) {
    return { success: false, syncedCount: 0, errorMsg: 'Sync is already running' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, syncedCount: 0, errorMsg: 'Supabase URL/Key is not configured in settings.' };
  }

  isSyncingActive = true;
  let syncedCount = 0;

  try {
    const pendingItems = await db.pendingSyncs.orderBy('id').toArray();
    const total = pendingItems.length;

    if (total === 0) {
      isSyncingActive = false;
      return { success: true, syncedCount: 0 };
    }

    for (let i = 0; i < total; i++) {
      if (setProgressCallback) {
        setProgressCallback(i, total);
      }

      const item = pendingItems[i];
      let networkSuccess = false;

      try {
        if (item.table === 'products') {
          if (item.action === 'insert') {
            const { error } = await supabase
              .from('products')
              .insert([item.payload]);
            if (!error) {
              await db.products.update(item.targetId, { synced: true });
              networkSuccess = true;
            } else {
              console.error('Insert sync failed for product', item.targetId, error);
              // If product already exists in DB, treat as success or ignore
              if (error.code === '23505') {
                await db.products.update(item.targetId, { synced: true });
                networkSuccess = true;
              }
            }
          } else if (item.action === 'update') {
            const { error } = await supabase
              .from('products')
              .update(item.payload)
              .eq('id', item.targetId);
            if (!error) {
              await db.products.update(item.targetId, { synced: true });
              networkSuccess = true;
            } else {
              console.error('Update sync failed for product', item.targetId, error);
            }
          } else if (item.action === 'delete') {
            const { error } = await supabase
              .from('products')
              .delete()
              .eq('id', item.targetId);
            if (!error) {
              networkSuccess = true;
            } else {
              console.error('Delete sync failed for product', item.targetId, error);
            }
          }
        } else if (item.table === 'inventory_logs') {
          if (item.action === 'insert') {
            const { error } = await supabase
              .from('inventory_logs')
              .insert([item.payload]);
            if (!error) {
              await db.inventoryLogs.update(item.targetId, { synced: true });
              networkSuccess = true;
            } else {
              console.error('Insert sync failed for log', item.targetId, error);
              if (error.code === '23505') {
                await db.inventoryLogs.update(item.targetId, { synced: true });
                networkSuccess = true;
              }
            }
          }
        }

        if (networkSuccess) {
          await db.pendingSyncs.delete(item.id!);
          syncedCount++;
        } else {
          // Pause execution on first real network or DB error to preserve retry order
          break;
        }
      } catch (err) {
        console.error('Exception during syncing sync-item', item, err);
        break; // Stop syncing loop to avoid flood of exceptions
      }
    }

    if (setProgressCallback) {
      setProgressCallback(syncedCount, total);
    }

    isSyncingActive = false;
    return { success: true, syncedCount };
  } catch (globalErr: any) {
    isSyncingActive = false;
    console.error('Global failure in offline sync process', globalErr);
    return { success: false, syncedCount, errorMsg: globalErr?.message || 'Unknown network error' };
  }
}

/**
 * Replaces fetchProducts from supabaseClient.ts.
 * Fetches from Dexie locally for absolute speed, triggers background seed/updates if online.
 */
export async function getLocalProducts(): Promise<Product[]> {
  await initializeOfflineDatabase();
  return db.products.toArray();
}

/**
 * Replaces fetchLogs from supabaseClient.ts.
 * Fetches from Dexie locally.
 */
export async function getLocalLogs(): Promise<InventoryLog[]> {
  await initializeOfflineDatabase();
  return db.inventoryLogs.reverse().toArray();
}

/**
 * Replaces insertProduct. Inserts into local database, enqueues pending sync, and attempts inline online push.
 */
export async function insertOfflineProduct(product: Omit<Product, 'id' | 'updated_at'>): Promise<Product> {
  const newProduct: Product & { synced: boolean } = {
    ...product,
    id: `prod-${Date.now()}`,
    updated_at: new Date().toISOString(),
    synced: false
  };

  // Add locally first
  await db.products.add(newProduct);

  // Queue background sync
  await db.pendingSyncs.add({
    table: 'products',
    action: 'insert',
    targetId: newProduct.id,
    payload: newProduct,
    timestamp: new Date().toISOString()
  });

  // Attempt standard online sync immediately in non-blocking fashion
  setTimeout(() => syncOfflineData().catch(console.error), 200);

  return newProduct;
}

/**
 * Replaces updateProductInDB. Updates locally, enqueues update sync, and triggers online sync.
 */
export async function updateOfflineProductInDB(product: Product): Promise<Product> {
  const updatedProduct: Product & { synced: boolean } = {
    ...product,
    updated_at: new Date().toISOString(),
    synced: false
  };

  await db.products.put(updatedProduct);

  await db.pendingSyncs.add({
    table: 'products',
    action: 'update',
    targetId: updatedProduct.id,
    payload: updatedProduct,
    timestamp: new Date().toISOString()
  });

  setTimeout(() => syncOfflineData().catch(console.error), 200);

  return updatedProduct;
}

/**
 * Replaces deleteProductFromDB. Deletes locally, enqueues delete sync, and triggers online sync.
 */
export async function deleteOfflineProductFromDB(id: string): Promise<boolean> {
  await db.products.delete(id);

  // Check if there is an unsynced insert pending sync for this product first
  const existingInsertSync = await db.pendingSyncs
    .where({ table: 'products', action: 'insert', targetId: id })
    .first();

  if (existingInsertSync) {
    // Local-only product was deleted before syncing! Clean syncs entirely
    await db.pendingSyncs.where({ targetId: id }).delete();
  } else {
    // Log the deletion to sync
    await db.pendingSyncs.add({
      table: 'products',
      action: 'delete',
      targetId: id,
      payload: {},
      timestamp: new Date().toISOString()
    });
  }

  setTimeout(() => syncOfflineData().catch(console.error), 200);

  return true;
}

/**
 * Replaces addInventoryLog. Adds locally, enqueues log sync, and triggers online sync.
 */
export async function addOfflineInventoryLog(
  productId: string,
  productName: string,
  type: InventoryLog['type'],
  quantityChange: number,
  notes?: string
): Promise<InventoryLog> {
  const newLog: InventoryLog & { synced: boolean } = {
    id: `log-${Date.now()}`,
    productId,
    productName,
    type,
    quantityChange,
    timestamp: new Date().toISOString(),
    notes,
    synced: false
  };

  await db.inventoryLogs.add(newLog);

  await db.pendingSyncs.add({
    table: 'inventory_logs',
    action: 'insert',
    targetId: newLog.id,
    payload: newLog,
    timestamp: new Date().toISOString()
  });

  setTimeout(() => syncOfflineData().catch(console.error), 200);

  return newLog;
}
