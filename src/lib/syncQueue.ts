/**
 * অফলাইন সিঙ্ক কিউ | Offline operation queue
 * অফলাইনে করা সব পরিবর্তন কিউতে জমা রাখে, অনলাইন হলে Supabase এ পাঠায়
 */

import { Product, InventoryLog } from '../types';
import { getSupabaseClient } from './supabaseClient';

export interface PendingOperation {
  id: string;
  type: 'insert_product' | 'update_product' | 'delete_product' | 'insert_log';
  payload: any;
  createdAt: string;
}

const PENDING_OPS_KEY = 'eim_pending_ops';

export function getPendingOps(): PendingOperation[] {
  const raw = localStorage.getItem(PENDING_OPS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function savePendingOps(ops: PendingOperation[]): void {
  localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(ops));
}

export function queueOperation(type: PendingOperation['type'], payload: any): void {
  const ops = getPendingOps();
  ops.push({
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
  });
  savePendingOps(ops);
}

export function getPendingCount(): number {
  return getPendingOps().length;
}

export async function syncPendingOps(): Promise<{ synced: number; failed: number }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { synced: 0, failed: 0 };

  const ops = getPendingOps();
  if (ops.length === 0) return { synced: 0, failed: 0 };

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
          break;
        }
        case 'update_product': {
          const { error } = await supabase
            .from('products')
            .update(op.payload)
            .eq('id', op.payload.id);
          success = !error;
          break;
        }
        case 'delete_product': {
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', op.payload.id);
          success = !error;
          break;
        }
        case 'insert_log': {
          const { error } = await supabase.from('inventory_logs').upsert([op.payload]);
          success = !error;
          break;
        }
      }

      if (success) {
        synced++;
      } else {
        remaining.push(op);
        failed++;
      }
    } catch {
      remaining.push(op);
      failed++;
    }
  }

  savePendingOps(remaining);
  return { synced, failed };
}
