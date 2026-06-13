import { Product, ProductBatch } from './types';

/**
 * Returns the current active batches for a product.
 * If no batches exist yet, initializes with a single batch matching the product's current quantity and price.
 */
export function getProductBatches(product: Product): ProductBatch[] {
  if (product.batches && product.batches.length > 0) {
    return product.batches;
  }
  return [
    {
      id: `batch-${product.id}-init`,
      isUsed: product.isUsed ?? false,
      quantity: product.quantity,
      originalQuantity: product.quantity,
      addedAt: product.addedAt || product.updated_at || new Date().toISOString(),
      usedAt: product.usedAt
    }
  ];
}

/**
 * Adds a new stock replenishment batch with its own condition (New or Used).
 */
export function addProductToBatches(
  product: Product, 
  quantityToAdd: number, 
  isUsed: boolean, 
  usedAt?: string
): Product {
  const currentBatches = getProductBatches(product);
  const updatedBatches = currentBatches.map(b => ({ ...b }));

  updatedBatches.push({
    id: `batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    isUsed: isUsed,
    quantity: quantityToAdd,
    originalQuantity: quantityToAdd,
    addedAt: new Date().toISOString(),
    usedAt: isUsed ? (usedAt || new Date().toISOString()) : undefined
  });

  const totalQty = updatedBatches.reduce((sum, b) => sum + b.quantity, 0);

  return {
    ...product,
    quantity: totalQty,
    isUsed: isUsed,
    batches: updatedBatches,
    updated_at: new Date().toISOString()
  };
}

/**
 * Sells / reduces units from a product using First In, First Out (FIFO) across its batches.
 */
export function sellProductFromBatches(
  product: Product, 
  quantityToSell: number,
  customNotes?: string
): {
  updatedProduct: Product;
  usageDetails: { quantity: number; isUsed: boolean; date: string }[];
  notes: string;
} {
  const currentBatches = getProductBatches(product);
  let remainingToSell = quantityToSell;
  const usedFrom: { quantity: number; isUsed: boolean; date: string }[] = [];
  const updatedBatches = currentBatches.map(b => ({ ...b }));

  // FIFO sell-down
  for (const batch of updatedBatches) {
    if (remainingToSell <= 0) break;
    if (batch.quantity <= 0) continue;

    const sellCount = Math.min(batch.quantity, remainingToSell);
    batch.quantity -= sellCount;
    remainingToSell -= sellCount;
    usedFrom.push({ quantity: sellCount, isUsed: batch.isUsed, date: batch.addedAt });
  }

  // If we sell beyond total in-stock (oversell/audit adjustment)
  if (remainingToSell > 0) {
    const defaultIsUsed = product.isUsed;
    if (updatedBatches.length > 0) {
      // Deplete from newest/last batch or init batch
      const lastBatch = updatedBatches[updatedBatches.length - 1];
      lastBatch.quantity -= remainingToSell;
    }
    usedFrom.push({ quantity: remainingToSell, isUsed: defaultIsUsed, date: new Date().toISOString() });
    remainingToSell = 0;
  }

  const totalQty = updatedBatches.reduce((sum, b) => sum + Math.max(0, b.quantity), 0);

  // Formatting transition details
  const noteDetails = usedFrom
    .map(s => `${s.quantity} units (${s.isUsed ? 'Used' : 'New'}, added ${new Date(s.date).toLocaleDateString()}) dispatched`)
    .join(", ");
  
  const autoNotes = `Stock depleted FIFO: ${noteDetails}.`;
  const finalNotes = customNotes ? `${customNotes.trim()} [FIFO: ${noteDetails}]` : autoNotes;

  // Set the current listed status to the oldest active batch that still has stock
  const activeBatch = updatedBatches.find(b => b.quantity > 0) || updatedBatches[updatedBatches.length - 1];
  const activeIsUsed = activeBatch ? activeBatch.isUsed : product.isUsed;

  return {
    updatedProduct: {
      ...product,
      quantity: totalQty,
      isUsed: activeIsUsed,
      batches: updatedBatches,
      updated_at: new Date().toISOString()
    },
    usageDetails: usedFrom,
    notes: finalNotes
  };
}
