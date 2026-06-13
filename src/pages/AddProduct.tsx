import React from 'react';
import ProductForm from '../components/ProductForm';
import { Product } from '../types';

interface AddProductProps {
  productToEdit?: Product | null; // Keeping this for compatibility if passed
  onSave: (product: Omit<Product, 'id' | 'updated_at'> & { id?: string }) => void;
  onCancel: () => void;
}

export default function AddProduct({ onSave, onCancel, productToEdit }: AddProductProps) {
  return (
    <ProductForm
      productToEdit={productToEdit}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}
