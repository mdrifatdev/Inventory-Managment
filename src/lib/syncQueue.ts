/**
 * অফলাইন সিঙ্ক কিউ | Offline operation queue
 * অফলাইনে করা সব পরিবর্তন কিউতে জমা রাখে, অনলাইন হলে Supabase এ পাঠায়
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, InventoryLog } from '../types';
import { getSupabaseClient } from './supabaseClient';
import { logger } from './logger';
import { generateOperationId } from './idGenerator';

export interface PendingOperation {
  id: string;
  type: 'insert_product' | 'update_product' | 'delete_product' | 'insert_log';
  payload: any;
  createdAt: string;
}

const PENDING_OPS_KEY = 'eim_pending_ops';

export async function getPendingOps(): Promise<PendingOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_OPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    logger.error('Failed to get pending operations', e);
    return [];
  }
}

async function savePendingOps(ops: PendingOperation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_OPS_KEY, JSON.stringify(ops));
  } catch (e) {
    logger.error('Failed to save pending operations', e);
  }
}

export async function queueOperation(type: PendingOperation['type'], payload: any): Promise<void> {
  try {
    const ops = await getPendingOps();
    ops.push({
      id: generateOperationId(),
      type,
      payload,
      createdAt: new Date().toISOString(),
    });
    await savePendingOps(ops);
    logger.info(`Operation queued: ${type}`);
  } catch (e) {
    logger.error('Failed to queue operation', e);
  }
}

export async function getPendingCount(): Promise<number> {
  try {
    const ops = await getPendingOps();
    return ops.length;
  } catch (e) {
    logger.error('Failed to get pending count', e);
    return 0;
  }
}

export async function syncPendingOps(): Promise<{ synced: number; failed: number }> {
  const supabase = await getSupabaseClient();
  if (!supabase) {
    logger.warn('Supabase not available, skipping sync');
    return { synced: 0, failed: 0 };
  }

  try {
    const ops = await getPendingOps();
    if (ops.length === 0) {
      logger.info('No pending operations to sync');
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;
    const remaining: PendingOperation[] = [];

    for (const op of ops) {
      try {
        let success = false;

        switch (op.type) {
          case 'insert_product': {
            const { error } = await supabase.from('products').upsert([op.payload]);
            success = !error;
            if (error) {
              logger.error(`Failed to insert product ${op.payload.id}`, error);
            }
            break;
          }
          case 'update_product': {
            const { error } = await supabase
              .from('products')
              .update(op.payload)
              .eq('id', op.payload.id);
            success = !error;
            if (error) {
              logger.error(`Failed to update product ${op.payload.id}`, error);
            }
            break;
          }
          case 'delete_product': {
            const { error } = await supabase
              .from('products')
              .delete()
              .eq('id', op.payload.id);
            success = !error;
            if (error) {
              logger.error(`Failed to delete product ${op.payload.id}`, error);
            }
            break;
          }
          case 'insert_log': {
            const { error } = await supabase.from('inventory_logs').upsert([op.payload]);
            success = !error;
            if (error) {
              logger.error(`Failed to insert log ${op.payload.id}`, error);
            }
            break;
          }
        }

        if (success) {
          synced++;
          logger.info(`Synced operation: ${op.type}`);
        } else {
          remaining.push(op);
          failed++;
        }
      } catch (e) {
        remaining.push(op);
        failed++;
        logger.error(`Exception syncing operation ${op.id}`, e);
      }
    }

    await savePendingOps(remaining);
    logger.info(`Sync complete: ${synced} synced, ${failed} failed, ${remaining.length} remaining`);
    return { synced, failed };
  } catch (e) {
    logger.error('Sync failed', e);
    return { synced: 0, failed: 0 };
  }
}
