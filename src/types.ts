/**
 * টাইপ ও কনস্ট্যান্ট | Shared types, interfaces, and constants
 * সমস্ত কম্পোনেন্ট এবং হুক এই ফাইল থেকে টাইপ ব্যবহার করে
 */

// ──── প্রোডাক্ট ইন্টারফেস | Product data shape ────
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minThreshold: number;
  image_url: string;
  brand: string;
  description: string;
  updated_at: string;
  isUsed: boolean;
  addedAt: string;
  usedAt?: string;
}

// ──── ক্যাটাগরি | Product categories ────
export type Category =
  | "Cables & Wiring"
  | "Switches & Sockets"
  | "Lighting & Bulbs"
  | "Circuit Breakers & Fuses"
  | "Fans & Ventilation"
  | "Power Tools"
  | "Testing Equipment"
  | "Other Accessories";

export const ALL_CATEGORIES: Category[] = [
  "Cables & Wiring",
  "Switches & Sockets",
  "Lighting & Bulbs",
  "Circuit Breakers & Fuses",
  "Fans & Ventilation",
  "Power Tools",
  "Testing Equipment",
  "Other Accessories",
];

// ──── সেটিংস | App configuration ────
export interface Settings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
}

// ──── ইনভেন্টরি লগ | Stock movement log entry ────
export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  type: "addition" | "reduction" | "update" | "deletion";
  quantityChange: number;
  timestamp: string;
  notes?: string;
}

// ──── অফলাইন ফলব্যাক ইমেজ | Offline-safe placeholder image ────
export const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23E3E6EF' width='400' height='300' rx='8'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='14' fill='%239299A8'%3ENo Image%3C/text%3E%3C/svg%3E";
