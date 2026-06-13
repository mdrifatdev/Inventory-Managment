import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowLeft, 
  Upload, 
  Sparkles, 
  Calendar, 
  Layers, 
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  FileImage,
  ImageIcon
} from 'lucide-react';
import { Product, Category, Settings } from '../types';
import { loadSettings } from '../supabaseClient';

interface AddProductFormProps {
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

const PRESET_IMAGES = [
  { name: 'Copper Reel', url: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=600&auto=format&fit=crop&q=80' },
  { name: 'Smart Dimmer', url: 'https://images.unsplash.com/photo-1595183864453-e5d7df9d9df3?w=600&auto=format&fit=crop&q=80' },
  { name: 'LED Pack', url: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=600&auto=format&fit=crop&q=80' },
  { name: 'Breaker Panel', url: 'https://images.unsplash.com/photo-1621259182978-f09e5e2ab09a?w=600&auto=format&fit=crop&q=80' },
  { name: 'Ventilation Fan', url: 'https://images.unsplash.com/photo-1618944847828-82e943c3dba7?w=600&auto=format&fit=crop&q=80' },
];

export default function AddProductForm({ productToEdit, onSave, onCancel }: AddProductFormProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<Category>('Cables & Wiring');
  const [isUsed, setIsUsed] = useState<boolean>(false);
  const [addedAt, setAddedAt] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [usedAt, setUsedAt] = useState<string>('');
  const [quantity, setQuantity] = useState(0);
  const [minThreshold, setMinThreshold] = useState(10);
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Auto-fill values if we are editing an existing item
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setCategory(productToEdit.category as Category);
      setQuantity(productToEdit.quantity);
      setMinThreshold(productToEdit.minThreshold);
      setBrand(productToEdit.brand);
      setDescription(productToEdit.description);
      setImageUrl(productToEdit.image_url);
      setIsUsed(productToEdit.isUsed ?? false);
      if (productToEdit.addedAt) {
        setAddedAt(productToEdit.addedAt.split('T')[0]);
      } else {
        setAddedAt(new Date().toISOString().split('T')[0]);
      }
      if (productToEdit.usedAt) {
        setUsedAt(productToEdit.usedAt.split('T')[0]);
      } else {
        setUsedAt('');
      }
    } else {
      // Auto-generate starting SKU
      generateSmartSku();
    }
  }, [productToEdit]);

  const generateSmartSku = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const catCode = category.slice(0, 3).toUpperCase().replace(/\s/g, '');
    setSku(`EL-${catCode}-${randomNum}`);
  };

  // Drag and drop event handlers
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

  // Real Cloudinary image uploader with local FileReader fallback
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

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${settings.cloudinaryCloudName}/image/upload`,
          { method: 'POST', body: formData }
        );

        if (response.ok) {
          const data = await response.json();
          setImageUrl(data.secure_url || data.url);
          setFeedback({ type: 'success', text: 'Image successfully uploaded to your Cloudinary storage!' });
        } else {
          console.error("Cloudinary request returned status:", response.status);
          throw new Error("Cloudinary upload failed");
        }
      } catch (err) {
        console.error("Cloudinary upload error", err);
        // Fall back to local FileReader Base64
        convertToBase64(file);
      }
    } else {
      // Offline local Base64 Fallback
      convertToBase64(file);
    }
  };

  const convertToBase64 = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
      setUploading(false);
      setFeedback({ 
        type: 'success', 
        text: 'Compressed image cached in offline database.' 
      });
    };
    reader.onerror = () => {
      setUploading(false);
      setFeedback({ type: 'error', text: 'Failed to compress or read local image' });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setFeedback({ type: 'error', text: 'Product name is required' });
      return;
    }
    if (!sku.trim()) {
      setFeedback({ type: 'error', text: 'sku is required' });
      return;
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category,
      isUsed,
      addedAt: addedAt ? new Date(addedAt).toISOString() : new Date().toISOString(),
      usedAt: isUsed && usedAt ? new Date(usedAt).toISOString() : undefined,
      quantity: Math.max(0, Math.floor(Number(quantity))),
      minThreshold: Math.max(0, Math.floor(Number(minThreshold))),
      brand: brand.trim() || "Generic",
      description: description.trim() || `Professional standard ${category} fittings.`,
      image_url: imageUrl || 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600&auto=format&fit=crop&q=80',
      ...(productToEdit ? { id: productToEdit.id } : {})
    };

    onSave(payload);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* Header Back banner */}
      <div className="flex items-center gap-3">
        <button 
          id="back-add-btn"
          onClick={onCancel}
          className="p-2 text-text-secondary bg-white border border-border-subtle hover:bg-sidebarbg rounded-full shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="font-sans font-bold text-text-primary text-2xl tracking-tight">
            {productToEdit ? 'Configure Product Details' : 'Reorder / Allocate Stock'}
          </h2>
          <p className="text-xs text-text-secondary font-sans mt-0.5">
            {productToEdit ? `Modifying properties of SKU: ${productToEdit.sku}` : 'Deploy a new device unit into the catalogue'}
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl flex items-start gap-2.5 border ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-warning-light text-warning-primary border-warning-light/30'
        }`}>
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-xs font-sans font-medium">{feedback.text}</p>
          <button 
            id="dismiss-fb"
            onClick={() => setFeedback(null)} 
            className="ml-auto hover:bg-black/5 p-0.5 rounded-full cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-border-subtle rounded-3xl overflow-hidden shadow-xs p-6 md:p-8 space-y-6">
        
        {/* Row 1: Name and Brand */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">
              Product Name *
            </label>
            <input 
              id="field-name"
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Copper wiring 3-core 1.5mm"
              className="w-full bg-sidebarbg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-white focus:outline-none transition-all rounded-xl px-4 py-2.5 font-sans text-sm text-text-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">
              BRAND / MANUFACTURER
            </label>
            <input 
              id="field-brand"
              type="text" 
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Havells / Schneider / Generic"
              className="w-full bg-sidebarbg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-white focus:outline-none transition-all rounded-xl px-4 py-2.5 font-sans text-sm text-text-primary"
            />
          </div>
        </div>

        {/* Categories Chips Selection */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold block">
            Product Classification (Category)
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            {CATEGORIES.map((cat) => {
              const matches = category === cat;
              return (
                <button
                  id={`chip-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-sans font-medium transition-all border cursor-pointer ${
                    matches 
                      ? 'bg-brand-dark border-brand-dark text-white shadow-xs' 
                      : 'bg-sidebarbg border-border-subtle text-text-secondary hover:bg-brand-light hover:text-brand-dark'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: SKU and Pricing / Condition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold flex justify-between items-center">
              <span>SKU CODE</span>
              <button 
                id="generate-sku-btn"
                type="button" 
                onClick={generateSmartSku}
                className="text-[10px] text-brand hover:underline flex items-center gap-0.5 font-bold font-sans cursor-pointer"
              >
                <Sparkles className="h-3 w-3" /> Regenerate
              </button>
            </label>
            <input 
              id="field-sku"
              type="text" 
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. CAB-SF-2.5"
              className="w-full bg-sidebarbg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-white focus:outline-none transition-all rounded-xl px-4 py-2.5 font-mono text-xs uppercase text-text-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold block">
              ITEM CONDITION
            </label>
            <div className="grid grid-cols-2 gap-1 bg-sidebarbg p-1 border border-border-subtle rounded-xl text-xs h-[42px] items-center">
              <button
                type="button"
                onClick={() => setIsUsed(false)}
                className={`py-1.5 px-1.5 rounded-lg text-center font-sans font-bold transition-all cursor-pointer text-[10.5px] ${
                  !isUsed 
                    ? 'bg-brand text-white shadow-xxs' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/40'
                }`}
              >
                New Item
              </button>
              <button
                type="button"
                onClick={() => setIsUsed(true)}
                className={`py-1.5 px-1.5 rounded-lg text-center font-sans font-bold transition-all cursor-pointer text-[10.5px] ${
                  isUsed 
                    ? 'bg-warning-primary text-white shadow-xxs' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/40'
                }`}
              >
                Used Item
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold flex items-center gap-1">
              <Calendar className="h-3 w-3 text-brand" />
              <span>{isUsed ? "USED / ACQU. DATE" : "ADDED DATE"}</span>
            </label>
            <input 
              id="field-date"
              type="date"
              required
              value={isUsed ? (usedAt || addedAt) : addedAt}
              onChange={(e) => {
                if (isUsed) {
                  setUsedAt(e.target.value);
                } else {
                  setAddedAt(e.target.value);
                }
              }}
              className="w-full bg-sidebarbg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-white focus:outline-none transition-all rounded-xl px-4 py-2.5 font-mono text-xs text-text-primary h-[42px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">
              INITIAL STOCK LEVEL (QTY)
            </label>
            <input 
              id="field-qty"
              type="number" 
              min="0"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="100"
              className="w-full bg-sidebarbg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-white focus:outline-none transition-all rounded-xl px-4 py-2.5 font-mono text-sm text-text-primary h-[42px]"
            />
          </div>
        </div>

        {/* Critical safety threshold */}
        <div className="p-4 bg-warning-light/80 border border-warning-primary/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 text-warning-primary">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning-primary mt-0.5" />
            <div>
              <h4 className="font-bold text-xs text-warning-primary">Assign Safety Alert Limit</h4>
              <p className="text-[11px] text-warning-primary/90 font-sans mt-0.5">
                Triggers console alerts when the product stock counts fall below or equal to this limit.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 font-sans">
            <span className="text-xs text-text-secondary font-semibold">Warning Trigger:</span>
            <input
              id="field-threshold"
              type="number"
              min="0"
              value={minThreshold}
              onChange={(e) => setMinThreshold(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-20 bg-white border border-border-subtle focus:outline-none focus:border-brand rounded-lg px-2.5 py-1 text-center font-mono text-xs font-bold text-text-primary"
            />
            <span className="text-xs text-text-secondary font-mono">items</span>
          </div>
        </div>

        {/* Text Area Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">
            Technical Specification & Description
          </label>
          <textarea 
            id="field-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Technical details of the electric component (ampere rating, wiring insulation, voltage compatibility etc.)"
            className="w-full bg-sidebarbg border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand-light focus:bg-white focus:outline-none transition-all rounded-xl px-4 py-2.5 font-sans text-xs text-text-primary"
          />
        </div>

        {/* Image upload section (M3 Drag box & presets shortcuts) */}
        <div className="space-y-3">
          <label className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold block">
            Media Attachment (URL / Upload / Presets)
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Drag Area */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all ${
                dragActive 
                  ? 'border-brand bg-brand-light/20' 
                  : 'border-border-subtle bg-sidebarbg hover:bg-brand-light/10'
              }`}
            >
              <input
                id="file-image-picker"
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <label htmlFor="file-image-picker" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                <div className="bg-white p-2 w-10 h-10 rounded-full shadow-xxs flex items-center justify-center text-text-secondary border border-border-subtle">
                  <Upload className="h-5 w-5 stroke-[2] text-brand" />
                </div>
                <div>
                  <p className="text-xs font-sans text-text-primary font-bold">
                    {uploading ? 'Compressing item media...' : 'Drag item photo or Select File'}
                  </p>
                  <p className="text-[10px] text-text-secondary mt-1 font-sans">
                    Supports high-res PNG, JPG relative upload values
                  </p>
                </div>
              </label>
            </div>

            {/* Manual URL Input or Preset picker */}
            <div className="space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5 bg-sidebarbg p-4 border border-border-subtle rounded-2xl">
                <label className="text-[10px] font-mono tracking-wider font-bold text-text-secondary">
                  OR DEFINE RAW IMAGE LINK
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    id="field-image-url"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-white border border-border-subtle focus:outline-none focus:border-brand rounded-lg px-3 py-1.5 font-mono text-xs text-text-primary"
                  />
                  {imageUrl && (
                    <button
                      id="clear-image-btn"
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-2 text-warning-primary border border-border-subtle bg-white rounded-lg hover:bg-warning-light cursor-pointer"
                      title="Clear image link"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Presets Grid */}
              <div className="space-y-1.5 flex-1 flex flex-col justify-end">
                <span className="text-[10px] font-mono font-bold text-text-secondary block tracking-wider uppercase">
                  Click to Use Electric Stock Presets
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      id={`preset-${idx}`}
                      type="button"
                      key={preset.url}
                      onClick={() => setImageUrl(preset.url)}
                      className="text-[10px] font-sans font-medium px-2.5 py-1 rounded-full border border-border-subtle bg-white hover:bg-sidebarbg text-text-secondary transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Preview */}
          {imageUrl && (
            <div className="mt-3 flex items-center gap-3 p-3 border border-border-subtle rounded-2xl bg-sidebarbg animate-fade-in">
              <img 
                src={imageUrl} 
                alt="Selected preview" 
                className="h-14 w-14 object-cover rounded-xl border border-border-subtle"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600&auto=format&fit=crop&q=80';
                }}
              />
              <div className="text-xs">
                <p className="font-semibold text-text-primary flex items-center gap-1">
                  <ImageIcon className="h-4 w-4 text-brand" /> Image Attached
                </p>
                <p className="text-[10px] text-text-secondary font-mono truncate max-w-sm sm:max-w-md mt-0.5">
                  {imageUrl.startsWith('data:') ? 'Local Base64 Data Stream' : imageUrl}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Cancel / Submit Buttons */}
        <div className="pt-6 border-t border-border-subtle flex items-center justify-end gap-3.5">
          <button
            id="form-cancel-btn"
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full border border-border-subtle hover:bg-sidebarbg text-text-secondary font-sans font-medium text-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            id="form-submit-btn"
            type="submit"
            className="px-7 py-2.5 rounded-full bg-brand hover:brightness-110 text-white font-sans font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>{productToEdit ? 'Accept Modification' : 'Publish Product'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
