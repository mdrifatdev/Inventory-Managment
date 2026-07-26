/**
 * ID Generator utility | Generate unique IDs
 */

export function generateProductId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `prod-${timestamp}-${random}`;
}

export function generateLogId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `log-${timestamp}-${random}`;
}

export function generateOperationId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `op-${timestamp}-${random}`;
}
