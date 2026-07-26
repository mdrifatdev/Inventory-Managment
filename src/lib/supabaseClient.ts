/**
 * সুপাবেস ক্লায়েন্ট ও লোকাল স্টোরেজ | Supabase client + localStorage fallback layer
 * অনলাইন থাকলে Supabase ব্যবহার করে, অফলাইনে localStorage এ ফলব্যাক করে
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Settings, InventoryLog, FALLBACK_IMAGE } from '../types';

// ──── সিড ডেটা | Default seed data for first-time users ────

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Super-Flex 2.5mm Copper Cable",
    sku: "CAB-SF-25-CU",
    category: "Cables & Wiring",
    quantity: 120,
    minThreshold: 30,
    image_url: FALLBACK_IMAGE,
    brand: "SuperFlex Cables",
    description: "Flame-retardant 2.5sqmm copper cables suitable for domestic wiring applications.",
    updated_at: new Date().toISOString(),
    isUsed: false,
    addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prod-2",
    name: "M3 Smart Dimmer Switch",
    sku: "SW-M3-DIM-01",
    category: "Switches & Sockets",
    quantity: 15,
    minThreshold: 20,
    image_url: FALLBACK_IMAGE,
    brand: "LumenHome",
    description: "Modern touch-sensitive dimmer with smart home assistant integration.",
    updated_at: new Date().toISOString(),
    isUsed: false,
    addedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prod-3",
    name: "Ultra-Bright 12W LED Bulbs (Pack of 5)",
    sku: "LGT-LED-12W-5P",
    category: "Lighting & Bulbs",
    quantity: 85,
    minThreshold: 15,
    image_url: FALLBACK_IMAGE,
    brand: "AuraLight",
    description: "Energy efficient Cool White LED bulbs with 25,000 hour lifetime.",
    updated_at: new Date().toISOString(),
    isUsed: true,
    addedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    usedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prod-4",
    name: "32A Double Pole Miniature Circuit Breaker",
    sku: "CB-MCB-32A-DP",
    category: "Circuit Breakers & Fuses",
    quantity: 8,
    minThreshold: 10,
    image_url: FALLBACK_IMAGE,
    brand: "SafeVolt",
    description: "Heavy duty short-circuit and overload protector for modern switchboards.",
    updated_at: new Date().toISOString(),
    isUsed: false,
    addedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prod-5",
    name: "High-Velocity Exhaust Fan 8\"",
    sku: "FAN-EXH-08-HV",
    category: "Fans & Ventilation",
    quantity: 45,
    minThreshold: 12,
    image_url: FALLBACK_IMAGE,
    brand: "WindFlow",
    description: "Whisper-quiet powerful ventilation fan with rust-proof ABS shutters.",
    updated_at: new Date().toISOString(),
    isUsed: true,
    addedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    usedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_LOGS: InventoryLog[] = [
  {
    id: "log-1",
    productId: "prod-1",
    productName: "Super-Flex 2.5mm Copper Cable",
    type: "addition",
    quantityChange: 120,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Initial inventory setup with high-security wiring reels"
  },
  {
    id: "log-2",
    productId: "prod-2",
    productName: "M3 Smart Dimmer Switch",
    type: "reduction",
    quantityChange: -5,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Bulk counter sale for smart-home project"
  }
];

// ──── লোকালস্টোরেজ কী | Storage keys ────

const SETTINGS_KEY = "eim_settings";
const PRODUCTS_KEY = "eim_products";
const LOGS_KEY = "eim_logs";

// ──── সেটিংস ম্যানেজমেন্ট | Settings load/save ────

export function loadSettings(): Settings {
  let savedSettings: Partial<Settings> = {};
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      savedSettings = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load settings", e);
  }
  return {
    supabaseUrl: savedSettings.supabaseUrl || (import.meta.env.VITE_SUPABASE_URL || "").trim(),
    supabaseAnonKey: savedSettings.supabaseAnonKey || (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim(),
    cloudinaryCloudName: savedSettings.cloudinaryCloudName || (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "").trim(),
    cloudinaryUploadPreset: savedSettings.cloudinaryUploadPreset || (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "").trim(),
  };
}

// ──── সুপাবেস ক্লায়েন্ট | Supabase client singleton ────

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastAnonKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  if (localStorage.getItem('force_offline') === 'true') {
    cachedClient = null;
    return null;
  }
  const { supabaseUrl, supabaseAnonKey } = loadSettings();

  // Clean up URL and key
  const cleanUrl = (supabaseUrl || "").trim().replace(/\/$/, "");
  const cleanKey = (supabaseAnonKey || "").trim();

  // Validate that they are actual values and not placeholders
  const isValid = cleanUrl && cleanKey &&
                 !cleanUrl.includes("YOUR_") &&
                 !cleanKey.includes("YOUR_") &&
                 cleanUrl.startsWith("http");

  if (isValid) {
    if (cachedClient && lastUrl === cleanUrl && lastAnonKey === cleanKey) {
      return cachedClient;
    }
    try {
      cachedClient = createClient(cleanUrl, cleanKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage
        }
      });
      lastUrl = cleanUrl;
      lastAnonKey = cleanKey;
      return cachedClient;
    } catch (e) {
      console.error("Error creating Supabase client", e);
      return null;
    }
  }
  cachedClient = null;
  return null;
}

// ──── প্রোডাক্ট CRUD | Product operations (Supabase-first, localStorage fallback) ────

export async function fetchProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(data));
        return data as Product[];
      }
      console.error("Supabase fetch failed, trying local storage", error);
    } catch (e) {
      console.error("Supabase client exception", e);
    }
  }

  const local = localStorage.getItem(PRODUCTS_KEY);
  if (local) {
    return JSON.parse(local);
  }

  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
}

export async function insertProduct(product: Omit<Product, 'id' | 'updated_at'>): Promise<Product> {
  const newProduct: Product = {
    ...product,
    id: `prod-${Date.now()}`,
    updated_at: new Date().toISOString()
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .single();

      if (!error && data) {
        syncLocalProducts(data as Product);
        return data as Product;
      }
      console.error("Supabase insert failed, adding locally", error);
    } catch (e) {
      console.error("Supabase exception during insert", e);
    }
  }

  syncLocalProducts(newProduct);
  return newProduct;
}

export async function updateProductInDB(product: Product): Promise<Product> {
  const updatedProduct = {
    ...product,
    updated_at: new Date().toISOString()
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updatedProduct)
        .eq('id', product.id)
        .select()
        .single();

      if (!error && data) {
        updateLocalProduct(data as Product);
        return data as Product;
      }
      console.error("Supabase update failed, updating locally", error);
    } catch (e) {
      console.error("Supabase exception during update", e);
    }
  }

  updateLocalProduct(updatedProduct);
  return updatedProduct;
}

export async function deleteProductFromDB(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  let success = false;

  if (supabase) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (!error) {
        success = true;
      } else {
        console.error("Supabase delete failed", error);
      }
    } catch (e) {
      console.error("Supabase exception during delete", e);
    }
  }

  const local = localStorage.getItem(PRODUCTS_KEY);
  if (local) {
    const products: Product[] = JSON.parse(local);
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
    if (!supabase) success = true;
  }
  return success;
}

// ──── লগ অপারেশন | Inventory log operations ────

export async function fetchLogs(): Promise<InventoryLog[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('inventory_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (!error && data) {
        localStorage.setItem(LOGS_KEY, JSON.stringify(data));
        return data as InventoryLog[];
      }
    } catch (e) {
      console.error("Supabase logs fetch error", e);
    }
  }

  const local = localStorage.getItem(LOGS_KEY);
  if (local) {
    return JSON.parse(local);
  }
  localStorage.setItem(LOGS_KEY, JSON.stringify(INITIAL_LOGS));
  return INITIAL_LOGS;
}

export async function addInventoryLog(productId: string, productName: string, type: InventoryLog['type'], quantityChange: number, notes?: string): Promise<InventoryLog> {
  const newLog: InventoryLog = {
    id: `log-${Date.now()}`,
    productId,
    productName,
    type,
    quantityChange,
    timestamp: new Date().toISOString(),
    notes
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('inventory_logs')
        .insert([newLog])
        .select()
        .single();

      if (!error && data) {
        saveLocalLog(data as InventoryLog);
        return data as InventoryLog;
      }
    } catch (e) {
      console.error("Supabase log exception", e);
    }
  }

  saveLocalLog(newLog);
  return newLog;
}

// ──── লোকাল সিঙ্ক হেল্পার | localStorage sync helpers (synchronous) ────

function syncLocalProducts(p: Product) {
  const local = localStorage.getItem(PRODUCTS_KEY) || JSON.stringify(INITIAL_PRODUCTS);
  const products: Product[] = JSON.parse(local);
  products.unshift(p);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function updateLocalProduct(p: Product) {
  const local = localStorage.getItem(PRODUCTS_KEY) || JSON.stringify(INITIAL_PRODUCTS);
  const products: Product[] = JSON.parse(local);
  const index = products.findIndex(item => item.id === p.id);
  if (index !== -1) {
    products[index] = p;
  } else {
    products.unshift(p);
  }
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function saveLocalLog(log: InventoryLog) {
  const local = localStorage.getItem(LOGS_KEY) || JSON.stringify(INITIAL_LOGS);
  const logs: InventoryLog[] = JSON.parse(local);
  logs.unshift(log);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}
