import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Settings, InventoryLog } from './types';

// Default initial products as high-quality seed data
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Super-Flex 2.5mm Copper Cable",
    sku: "CAB-SF-25-CU",
    category: "Cables & Wiring",
    quantity: 120,
    minThreshold: 30,
    image_url: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=600&auto=format&fit=crop&q=80",
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
    minThreshold: 20, // Should trigger warning
    image_url: "https://images.unsplash.com/photo-1595183864453-e5d7df9d9df3?w=600&auto=format&fit=crop&q=80",
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
    image_url: "https://images.unsplash.com/photo-1550985616-10810253b84d?w=600&auto=format&fit=crop&q=80",
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
    minThreshold: 10, // Should trigger warning
    image_url: "https://images.unsplash.com/photo-1621259182978-f09e5e2ab09a?w=600&auto=format&fit=crop&q=80",
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
    image_url: "https://images.unsplash.com/photo-1618944847828-82e943c3dba7?w=600&auto=format&fit=crop&q=80",
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

// LocalStorage Keys
const SETTINGS_KEY = "eim_settings";
const PRODUCTS_KEY = "eim_products";
const LOGS_KEY = "eim_logs";

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
    supabaseUrl: savedSettings.supabaseUrl || ((import.meta as any).env.VITE_SUPABASE_URL || "").trim(),
    supabaseAnonKey: savedSettings.supabaseAnonKey || ((import.meta as any).env.VITE_SUPABASE_ANON_KEY || "").trim(),
    cloudinaryCloudName: savedSettings.cloudinaryCloudName || ((import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || "").trim(),
    cloudinaryUploadPreset: savedSettings.cloudinaryUploadPreset || ((import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || "").trim(),
  };
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Check if credentials are valid
export function getSupabaseClient(): SupabaseClient | null {
  if (localStorage.getItem('force_offline') === 'true') {
    return null;
  }
  const { supabaseUrl, supabaseAnonKey } = loadSettings();
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.trim() !== "" && supabaseAnonKey.trim() !== "") {
    try {
      return createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      console.error("Error creating Supabase client", e);
      return null;
    }
  }
  return null;
}

// --- Dynamic inventory handling functions (Supabase first with local fallback) ---

export async function fetchProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      
      if (!error && data) {
        // Cache in localStorage too
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(data));
        return data as Product[];
      }
      console.error("Supabase fetch failed, trying local storage", error);
    } catch (e) {
      console.error("Supabase client exception", e);
    }
  }

  // Fallback to localStorage
  const local = localStorage.getItem(PRODUCTS_KEY);
  if (local) {
    return JSON.parse(local);
  }
  
  // Seed initial data
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
        await syncLocalProducts(data as Product);
        return data as Product;
      }
      console.error("Supabase insert failed, adding locally", error);
    } catch (e) {
      console.error("Supabase exception during insert", e);
    }
  }

  // Fallback: Local operation
  await syncLocalProducts(newProduct);
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
        await updateLocalProduct(data as Product);
        return data as Product;
      }
      console.error("Supabase update failed, updating locally", error);
    } catch (e) {
      console.error("Supabase exception during update", e);
    }
  }

  // Fallback: Local operation
  await updateLocalProduct(updatedProduct);
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

  // Always keep localStorage in sync
  const local = localStorage.getItem(PRODUCTS_KEY);
  if (local) {
    const products: Product[] = JSON.parse(local);
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
    if (!supabase) success = true;
  }
  return success;
}

// Log actions
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
        await saveLocalLog(data as InventoryLog);
        return data as InventoryLog;
      }
    } catch (e) {
      console.error("Supabase log exception", e);
    }
  }

  await saveLocalLog(newLog);
  return newLog;
}

// Internal Local Storage Synchronizers
async function syncLocalProducts(p: Product) {
  const local = localStorage.getItem(PRODUCTS_KEY) || JSON.stringify(INITIAL_PRODUCTS);
  const products: Product[] = JSON.parse(local);
  products.unshift(p);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

async function updateLocalProduct(p: Product) {
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

async function saveLocalLog(log: InventoryLog) {
  const local = localStorage.getItem(LOGS_KEY) || JSON.stringify(INITIAL_LOGS);
  const logs: InventoryLog[] = JSON.parse(local);
  logs.unshift(log);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}
