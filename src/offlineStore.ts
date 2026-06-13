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
    let fetchedFromCloud = false;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true });
        if (!error && data && data.length > 0) {
          initialProductsList = data as Product[];
          fetchedFromCloud = true;
        }
      } catch (e) {
        console.warn('Could not contact Supabase for seeding, using static backup.', e);
      }
    }

    if (initialProductsList.length === 0) {
      initialProductsList = INITIAL_PRODUCTS;
    }

    await db.products.bulkPut(
      initialProductsList.map((p) => ({ ...p, synced: fetchedFromCloud }))
    );
  }

  if (logsCount === 0) {
    let initialLogsList: InventoryLog[] = [];
    let fetchedFromCloud = false;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('inventory_logs')
          .select('*')
          .order('timestamp', { ascending: false });
        if (!error && data && data.length > 0) {
          initialLogsList = data as InventoryLog[];
          fetchedFromCloud = true;
        }
      } catch (e) {
        console.warn('Could not contact Supabase logs for seeding, using static backup.', e);
      }
    }

    if (initialLogsList.length === 0) {
      initialLogsList = INITIAL_LOGS;
    }

    await db.inventoryLogs.bulkPut(
      initialLogsList.map((l) => ({ ...l, synced: fetchedFromCloud }))
    );
  }
}

/**
 * Scans local Dexie database for any products or logs marked synced=false that are NOT already in the pendingSyncs queue,
 * and adds them to pendingSyncs so they get synchronized to the cloud.
 */
export async function queueUnsyncedLocalData() {
  try {
    const unsyncedProducts = await db.products.filter(p => !p.synced).toArray();
    for (const product of unsyncedProducts) {
      const existing = await db.pendingSyncs
        .where('targetId')
        .equals(product.id)
        .first();
      if (!existing) {
        await db.pendingSyncs.add({
          table: 'products',
          action: 'insert',
          targetId: product.id,
          payload: product,
          timestamp: new Date().toISOString()
        });
      }
    }

    const unsyncedLogs = await db.inventoryLogs.filter(l => !l.synced).toArray();
    for (const log of unsyncedLogs) {
      const existing = await db.pendingSyncs
        .where('targetId')
        .equals(log.id)
        .first();
      if (!existing) {
        await db.pendingSyncs.add({
          table: 'inventory_logs',
          action: 'insert',
          targetId: log.id,
          payload: log,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (e) {
    console.error("Failed to queue unsynced local data", e);
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
  let lastErrorMsg: string | undefined = undefined;

  try {
    // One-time migration: If we are connecting to a new database that is empty,
    // and we have local products that are marked synced: true but aren't in Supabase,
    // let's mark them as synced: false so they get queued and uploaded!
    if (localStorage.getItem('initial_seed_pushed') !== 'true') {
      try {
        const { data, error } = await supabase.from('products').select('id').limit(1);
        if (!error && (!data || data.length === 0)) {
          // Remote DB is empty! Let's force all local products and logs to synced: false
          // so they get picked up and synced.
          await db.products.toCollection().modify({ synced: false });
          await db.inventoryLogs.toCollection().modify({ synced: false });
          localStorage.setItem('initial_seed_pushed', 'true');
        } else if (!error) {
          // Remote DB is not empty, so it's already set up or has data. Just mark as pushed.
          localStorage.setItem('initial_seed_pushed', 'true');
        }
      } catch (migrationErr) {
        console.warn("One-time database migration check failed", migrationErr);
      }
    }

    // Queue any local unsynced data first
    await queueUnsyncedLocalData();

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
      lastErrorMsg = undefined;

      try {
        const { synced, ...cleanPayload } = item.payload || {};

        if (item.table === 'products') {
          if (item.action === 'insert') {
            const { error } = await supabase
              .from('products')
              .insert([cleanPayload]);
            if (!error) {
              await db.products.update(item.targetId, { synced: true });
              networkSuccess = true;
            } else {
              console.error('Insert sync failed for product', item.targetId, error);
              lastErrorMsg = `${error.message} (${error.code})`;
              // If product already exists in DB, treat as success or ignore
              if (error.code === '23505') {
                await db.products.update(item.targetId, { synced: true });
                networkSuccess = true;
                lastErrorMsg = undefined;
              }
            }
          } else if (item.action === 'update') {
            const { error } = await supabase
              .from('products')
              .upsert([cleanPayload]);
            if (!error) {
              await db.products.update(item.targetId, { synced: true });
              networkSuccess = true;
            } else {
              console.error('Update sync failed for product', item.targetId, error);
              lastErrorMsg = `${error.message} (${error.code})`;
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
              lastErrorMsg = `${error.message} (${error.code})`;
            }
          }
        } else if (item.table === 'inventory_logs') {
          if (item.action === 'insert') {
            const { error } = await supabase
              .from('inventory_logs')
              .insert([cleanPayload]);
            if (!error) {
              await db.inventoryLogs.update(item.targetId, { synced: true });
              networkSuccess = true;
            } else {
              console.error('Insert sync failed for log', item.targetId, error);
              lastErrorMsg = `${error.message} (${error.code})`;
              if (error.code === '23505') {
                await db.inventoryLogs.update(item.targetId, { synced: true });
                networkSuccess = true;
                lastErrorMsg = undefined;
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
      } catch (err: any) {
        console.error('Exception during syncing sync-item', item, err);
        lastErrorMsg = err?.message || 'Unexpected sync connection exception';
        break; // Stop syncing loop to avoid flood of exceptions
      }
    }

    if (setProgressCallback) {
      setProgressCallback(syncedCount, total);
    }

    isSyncingActive = false;
    if (syncedCount < total) {
      return { 
        success: false, 
        syncedCount, 
        errorMsg: lastErrorMsg || 'Sync paused due to database or network error' 
      };
    }
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
    .where('targetId')
    .equals(id)
    .filter(item => item.table === 'products' && item.action === 'insert')
    .first();

  if (existingInsertSync) {
    // Local-only product was deleted before syncing! Clean syncs entirely
    await db.pendingSyncs.where('targetId').equals(id).delete();
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
