import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  ImageIcon
} from 'lucide-react';
import { Product, Category } from '../types';
import { loadSettings } from '../lib/supabaseClient';

interface ProductFormProps {
  productToEdit?: Product | null;
  onSave: (product: Omit<Product, 'id' | 'updated_at'> & { id?: string }) => void;
  onCancel: () => void;
}

const CATEGORIES: Category[] = [
  "Cables & Wiring",
  "Switches & Sockets",
  "Lighting & Bulbs",
  "Circuit Breakers & Fuses",
  "Fans & Ventilation",
  "Power Tools",
  "Testing Equipment",
  "Other Accessories"
];



export default function ProductForm({ productToEdit, onSave, onCancel }: ProductFormProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<Category>('Cables & Wiring');
  const [isUsed, setIsUsed] = useState<boolean>(false);
  const [quantity, setQuantity] = useState(0);
  const [minThreshold, setMinThreshold] = useState(5);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setCategory(productToEdit.category as Category);
      setQuantity(productToEdit.quantity);
      setMinThreshold(productToEdit.minThreshold);
      setDescription(productToEdit.description);
      setImageUrl(productToEdit.image_url);
      setIsUsed(productToEdit.isUsed ?? false);
    } else {
      generateSmartSku();
    }
  }, [productToEdit]);

  const generateSmartSku = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const catCode = category.slice(0, 3).toUpperCase().replace(/\s/g, '');
    setSku(`EL-${catCode}-${randomNum}`);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleImageUpload(e.target.files[0]);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setFeedback(null);
    const settings = loadSettings();
    const hasCloudinary = settings.cloudinaryCloudName && settings.cloudinaryUploadPreset;

    if (hasCloudinary) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', settings.cloudinaryUploadPreset);
        
        // Ensure image optimization (quality auto, format auto, max width 1200)
        // Usually done in upload_preset, but we can try forcing folder/transformations if needed.
        // Easiest is to append upload transformations if the API supports it, or rely on fetch URL later.
        // Actually Cloudinary handles transformations via URL like f_auto,q_auto,c_limit,w_1200
        // We'll upload normally but store the optimized URL.
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${settings.cloudinaryCloudName}/image/upload`,
          { method: 'POST', body: formData }
        );
        if (response.ok) {
          const data = await response.json();
          // Transform the URL to serve an optimized image
          let finalUrl = data.secure_url || data.url;
          if (finalUrl.includes('/upload/')) {
            finalUrl = finalUrl.replace('/upload/', '/upload/f_auto,q_auto,c_limit,w_1200/');
          }
          setImageUrl(finalUrl);
          setUploading(false);
          setFeedback({ type: 'success', text: 'Image uploaded successfully!' });
        } else {
          throw new Error("Upload failed");
        }
      } catch {
        convertToBase64(file);
      }
    } else {
      convertToBase64(file);
    }
  };

  const convertToBase64 = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
      setUploading(false);
      setFeedback({ type: 'success', text: 'Image saved locally.' });
    };
    reader.onerror = () => {
      setUploading(false);
      setFeedback({ type: 'error', text: 'Failed to read image file.' });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: 'error', text: 'Product name is required.' });
      return;
    }
    if (!sku.trim()) {
      setFeedback({ type: 'error', text: 'SKU is required.' });
      return;
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category,
      isUsed,
      addedAt: productToEdit?.addedAt || new Date().toISOString(),
      usedAt: isUsed ? new Date().toISOString() : undefined,
      quantity: Math.max(0, Math.floor(Number(quantity))),
      minThreshold: Math.max(0, Math.floor(Number(minThreshold))),
      brand: "Generic",
      description: description.trim() || '',
      image_url: imageUrl || 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600&auto=format&fit=crop&q=80',
      ...(productToEdit ? { id: productToEdit.id } : {})
    };

    onSave(payload);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 text-text-secondary bg-card border border-border-subtle hover:bg-sidebarbg rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="font-bold text-lg text-text-primary tracking-tight">
            {productToEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {productToEdit ? `Editing SKU: ${productToEdit.sku}` : 'Add a new item to inventory'}
          </p>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`p-3 rounded-lg flex items-center gap-2 border text-xs font-medium ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-warning-light text-warning-primary border-warning-primary/20'
        }`}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="flex-1">{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="hover:bg-black/5 p-0.5 rounded cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border border-border-subtle rounded-xl overflow-hidden p-5 md:p-6 space-y-5">

        {/* Row 1: Name + SKU */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Copper wiring 3-core 1.5mm"
              className="w-full bg-pagebg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-card focus:outline-none transition-all rounded-lg px-3.5 py-2.5 text-sm text-text-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide flex justify-between items-center">
              <span>SKU Code</span>
              <button
                type="button"
                onClick={generateSmartSku}
                className="text-[10px] text-brand hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
              >
                <Sparkles className="h-3 w-3" /> Regenerate
              </button>
            </label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="EL-CAB-1234"
              className="w-full bg-pagebg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-card focus:outline-none transition-all rounded-lg px-3.5 py-2.5 font-mono text-xs uppercase text-text-primary"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Category</label>
          <div className="flex overflow-x-auto gap-1.5 scrollbar-hidden pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer ${
                  category === cat
                    ? 'bg-brand text-white border-brand'
                    : 'bg-pagebg border-border-subtle text-text-secondary hover:bg-brand-light hover:text-brand'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Condition + Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Condition</label>
            <div className="grid grid-cols-2 gap-1 bg-pagebg p-1 border border-border-subtle rounded-lg h-[40px] items-center">
              <button
                type="button"
                onClick={() => setIsUsed(false)}
                className={`py-1.5 rounded-md text-center font-semibold transition-all cursor-pointer text-xs ${
                  !isUsed
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                New
              </button>
              <button
                type="button"
                onClick={() => setIsUsed(true)}
                className={`py-1.5 rounded-md text-center font-semibold transition-all cursor-pointer text-xs ${
                  isUsed
                    ? 'bg-warning-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Used
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
              Initial Quantity
            </label>
            <input
              type="number"
              min="0"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="0"
              className="w-full bg-pagebg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-card focus:outline-none transition-all rounded-lg px-3.5 py-2.5 font-mono text-sm text-text-primary h-[40px]"
            />
          </div>
        </div>

        {/* Low stock warning */}
        <div className="p-3.5 bg-warning-light/60 border border-warning-primary/15 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-2 items-start">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning-primary mt-0.5" />
            <div>
              <h4 className="font-bold text-xs text-warning-primary">Low stock warning</h4>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Alert when stock falls below this number.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-text-secondary font-medium">Alert when stock falls below</span>
            <input
              type="number"
              min="0"
              value={minThreshold}
              onChange={(e) => setMinThreshold(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-16 bg-card border border-border-subtle focus:outline-none focus:border-brand rounded-md px-2 py-1 text-center font-mono text-xs font-bold text-text-primary"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Notes</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes about this product..."
            className="w-full bg-pagebg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-card focus:outline-none transition-all rounded-lg px-3.5 py-2.5 text-sm text-text-primary"
          />
        </div>

        {/* Image upload */}
        <div className="space-y-3">
          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide block">Product Image</label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center transition-all ${
                dragActive
                  ? 'border-brand bg-brand-light/20'
                  : 'border-border-subtle bg-pagebg hover:bg-brand-light/10'
              }`}
            >
              <input id="file-image-picker" type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
              <label htmlFor="file-image-picker" className="cursor-pointer flex flex-col items-center space-y-1.5">
                <Upload className="h-5 w-5 text-brand" />
                <p className="text-xs font-medium text-text-primary">
                  {uploading ? 'Uploading...' : 'Drag or click to upload'}
                </p>
                <p className="text-[10px] text-text-muted">PNG, JPG supported</p>
              </label>
            </div>

            <div className="flex flex-col justify-center">
              <div className="bg-pagebg p-3 border border-border-subtle rounded-lg space-y-1.5">
                <label className="text-[10px] font-bold text-text-secondary tracking-wide uppercase">Or paste image URL</label>
                <div className="flex gap-1.5 mt-1">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-card border border-border-subtle focus:outline-none focus:border-brand rounded-md px-2.5 py-1.5 font-mono text-[11px] text-text-primary"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-1.5 text-text-muted hover:text-warning-primary rounded cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {imageUrl && (
            <div className="flex items-center gap-3 p-2.5 border border-border-subtle rounded-lg bg-pagebg animate-fade-in">
              <img
                src={imageUrl}
                alt="Preview"
                className="h-12 w-12 object-cover rounded-lg border border-border-subtle"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600&auto=format&fit=crop&q=80';
                }}
              />
              <div className="text-xs min-w-0">
                <p className="font-semibold text-text-primary flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5 text-brand" /> Image attached
                </p>
                <p className="text-[10px] text-text-muted font-mono truncate mt-0.5">
                  {imageUrl.startsWith('data:') ? 'Local file' : imageUrl}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border-subtle hover:bg-pagebg text-text-secondary font-medium text-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-brand hover:brightness-110 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            {productToEdit ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
