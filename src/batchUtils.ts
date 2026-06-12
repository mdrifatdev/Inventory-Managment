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
      price: product.price,
      quantity: product.quantity,
      originalQuantity: product.quantity,
      addedAt: product.updated_at || new Date().toISOString()
    }
  ];
}

/**
 * Adds a new stock replenishment batch with its own custom price.
 */
export function addProductToBatches(product: Product, quantityToAdd: number, price: number): Product {
  const currentBatches = getProductBatches(product);
  const updatedBatches = currentBatches.map(b => ({ ...b }));

  updatedBatches.push({
    id: `batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    price: price,
    quantity: quantityToAdd,
    originalQuantity: quantityToAdd,
    addedAt: new Date().toISOString()
  });

  const totalQty = updatedBatches.reduce((sum, b) => sum + b.quantity, 0);

  return {
    ...product,
    quantity: totalQty,
    // Set active price to the latest batch price
    price: price,
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
  priceDetails: { quantity: number; price: number }[];
  notes: string;
} {
  const currentBatches = getProductBatches(product);
  let remainingToSell = quantityToSell;
  const soldFrom: { quantity: number; price: number }[] = [];
  const updatedBatches = currentBatches.map(b => ({ ...b }));

  // FIFO sell-down
  for (const batch of updatedBatches) {
    if (remainingToSell <= 0) break;
    if (batch.quantity <= 0) continue;

    const sellCount = Math.min(batch.quantity, remainingToSell);
    batch.quantity -= sellCount;
    remainingToSell -= sellCount;
    soldFrom.push({ quantity: sellCount, price: batch.price });
  }

  // If we sell beyond total in-stock (oversell/audit adjustment)
  if (remainingToSell > 0) {
    const defaultPrice = product.price;
    if (updatedBatches.length > 0) {
      // Deplete from newest/last batch or init batch
      const lastBatch = updatedBatches[updatedBatches.length - 1];
      lastBatch.quantity -= remainingToSell;
    }
    soldFrom.push({ quantity: remainingToSell, price: defaultPrice });
    remainingToSell = 0;
  }

  const totalQty = updatedBatches.reduce((sum, b) => sum + Math.max(0, b.quantity), 0);

  // Formatting transition details
  const noteDetails = soldFrom
    .map(s => `${s.quantity} units sold at $${s.price.toFixed(2)} each`)
    .join(", ");
  
  const autoNotes = `Stock depleted FIFO: ${noteDetails}.`;
  const finalNotes = customNotes ? `${customNotes.trim()} [FIFO: ${noteDetails}]` : autoNotes;

  // Set the current listed price to the oldest active batch that still has stock,
  // or default to the last added batch if all are empty
  const activeBatch = updatedBatches.find(b => b.quantity > 0) || updatedBatches[updatedBatches.length - 1];
  const activePrice = activeBatch ? activeBatch.price : product.price;

  return {
    updatedProduct: {
      ...product,
      quantity: totalQty,
      price: activePrice,
      batches: updatedBatches,
      updated_at: new Date().toISOString()
    },
    priceDetails: soldFrom,
    notes: finalNotes
  };
}
