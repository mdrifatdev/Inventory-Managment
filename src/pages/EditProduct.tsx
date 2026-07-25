/** প্রোডাক্ট এডিট পেজ | Edit existing product page */
import ProductForm from '../components/ProductForm';
import { Product } from '../types';

interface EditProductProps {
  product: Product;
  onSave: (product: Omit<Product, 'id' | 'updated_at'> & { id?: string }) => void;
  onCancel: () => void;
}

export default function EditProduct({ product, onSave, onCancel }: EditProductProps) {
  return (
    <ProductForm
      productToEdit={product}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}
