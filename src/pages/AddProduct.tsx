import React from 'react';
import ProductFormNative from '../components/ProductForm.native';
import { Product } from '../types';

interface AddProductProps {
  onSave: (product: Omit<Product, 'id' | 'updated_at'> & { id?: string }) => void;
  onCancel: () => void;
}

export default function AddProduct({ onSave, onCancel }: AddProductProps) {
  return (
    <ProductFormNative
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}
