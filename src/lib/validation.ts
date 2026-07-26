/**
 * Validation utilities | Product and form validation
 */

export interface ValidationError {
  field: string;
  message: string;
}

export function validateProduct(data: {
  name?: string;
  sku?: string;
  quantity?: number;
  minThreshold?: number;
  category?: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name || !data.name.trim()) {
    errors.push({ field: 'name', message: 'Product name is required' });
  }

  if (!data.sku || !data.sku.trim()) {
    errors.push({ field: 'sku', message: 'SKU is required' });
  }

  if (data.quantity === undefined || data.quantity === null) {
    errors.push({ field: 'quantity', message: 'Quantity is required' });
  } else if (data.quantity < 0) {
    errors.push({ field: 'quantity', message: 'Quantity cannot be negative' });
  }

  if (data.minThreshold === undefined || data.minThreshold === null) {
    errors.push({ field: 'minThreshold', message: 'Minimum threshold is required' });
  } else if (data.minThreshold < 0) {
    errors.push({ field: 'minThreshold', message: 'Threshold cannot be negative' });
  }

  if (data.quantity !== undefined && data.minThreshold !== undefined) {
    if (data.minThreshold > data.quantity) {
      errors.push({
        field: 'minThreshold',
        message: `Threshold (${data.minThreshold}) cannot exceed quantity (${data.quantity})`,
      });
    }
  }

  if (!data.category || !data.category.trim()) {
    errors.push({ field: 'category', message: 'Category is required' });
  }

  return errors;
}

export function validateSKU(sku: string): boolean {
  // SKU should be alphanumeric with hyphens
  return /^[A-Z0-9\-]+$/.test(sku.toUpperCase());
}

export function validateNotEmpty(value: string, fieldName: string): ValidationError[] {
  if (!value || !value.trim()) {
    return [{ field: fieldName, message: `${fieldName} is required` }];
  }
  return [];
}
