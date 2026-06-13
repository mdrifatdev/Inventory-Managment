export interface ProductBatch {
  id: string;
  isUsed: boolean;
  quantity: number;
  originalQuantity: number;
  addedAt: string;
  usedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minThreshold: number; // Low stock warning limit
  image_url: string;
  brand: string;
  description: string;
  updated_at: string;
  isUsed: boolean;
  addedAt: string;
  usedAt?: string;
  batches?: ProductBatch[];
}

export type Category = 
  | "Cables & Wiring"
  | "Switches & Sockets"
  | "Lighting & Bulbs"
  | "Circuit Breakers & Fuses"
  | "Fans & Ventilation"
  | "Power Tools"
  | "Testing Equipment"
  | "Other Accessories";

export interface Settings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  type: "addition" | "reduction" | "update" | "deletion";
  quantityChange: number;
  timestamp: string;
  notes?: string;
}
