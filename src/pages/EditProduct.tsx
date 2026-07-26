import React from 'react';
import ProductFormNative from '../components/ProductForm.native';
import { Product } from '../types';

interface EditProductProps {
  product: Product;
  onSave: (product: Omit<Product, 'id' | 'updated_at'> & { id?: string }) => void;
  onCancel: () => void;
}

export default function EditProduct({ product, onSave, onCancel }: EditProductProps) {
  return (
    <ProductFormNative
      productToEdit={product}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}
