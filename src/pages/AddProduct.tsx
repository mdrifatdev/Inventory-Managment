/** প্রোডাক্ট যোগ পেজ | Add new product page */
import ProductForm from '../components/ProductForm';
import { Product } from '../types';

interface AddProductProps {
  onSave: (product: Omit<Product, 'id' | 'updated_at'> & { id?: string }) => void;
  onCancel: () => void;
}

export default function AddProduct({ onSave, onCancel }: AddProductProps) {
  return (
    <ProductForm
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}
