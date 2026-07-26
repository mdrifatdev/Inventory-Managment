import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, Sparkles, AlertTriangle, CheckCircle2, X } from 'lucide-react-native';
import { Product, Category, ALL_CATEGORIES, FALLBACK_IMAGE } from '../types';
import NativeInput from './native/NativeInput';
import NativeButton from './native/NativeButton';
import AppImagePicker from './ImagePicker';

interface ProductFormProps {
  productToEdit?: Product | null;
  onSave: (product: Omit<Product, 'id' | 'updated_at'> & { id?: string }) => void;
  onCancel: () => void;
}

export default function ProductFormNative({ productToEdit, onSave, onCancel }: ProductFormProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<Category>('Cables & Wiring');
  const [isUsed, setIsUsed] = useState<boolean>(false);
  const [quantity, setQuantity] = useState('0');
  const [minThreshold, setMinThreshold] = useState('5');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setCategory(productToEdit.category as Category);
      setQuantity(productToEdit.quantity.toString());
      setMinThreshold(productToEdit.minThreshold.toString());
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

  const handleSave = () => {
    if (!name.trim() || !sku.trim()) {
      Alert.alert('Missing Info', 'Please provide at least a product name and SKU.');
      return;
    }

    setLoading(true);
    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category,
      isUsed,
      addedAt: productToEdit?.addedAt || new Date().toISOString(),
      usedAt: isUsed ? new Date().toISOString() : undefined,
      quantity: Math.max(0, Math.floor(Number(quantity) || 0)),
      minThreshold: Math.max(0, Math.floor(Number(minThreshold) || 0)),
      brand: "Generic",
      description: description.trim() || '',
      image_url: imageUrl || FALLBACK_IMAGE,
      ...(productToEdit ? { id: productToEdit.id } : {})
    };

    onSave(payload);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-pagebg"
    >
      <ScrollView className="flex-1 px-5 pt-6 pb-12">
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity
            onPress={onCancel}
            className="h-10 w-10 bg-white border border-gray-100 rounded-xl items-center justify-center shadow-sm"
          >
            <ArrowLeft size={18} color="#64748b" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-gray-900 tracking-tight">
              {productToEdit ? 'Edit Product' : 'Add Item'}
            </Text>
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              {productToEdit ? `Updating ${productToEdit.sku}` : 'New Inventory Record'}
            </Text>
          </View>
        </View>

        {/* Image Section */}
        <View className="mb-6">
          <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">Product Photo</Text>
          <AppImagePicker
            currentImage={imageUrl}
            onImageSelected={setImageUrl}
          />
        </View>

        {/* Main Info */}
        <View className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-5 mb-6">
          <NativeInput
            label="Product Name"
            placeholder="e.g. Copper Cable 2.5mm"
            value={name}
            onChangeText={setName}
          />

          <View className="relative">
            <NativeInput
              label="SKU Code"
              placeholder="EL-CAB-1234"
              value={sku}
              onChangeText={setSku}
              autoCapitalize="characters"
              className="font-mono text-xs"
            />
            <TouchableOpacity
              onPress={generateSmartSku}
              className="absolute right-0 top-0 flex-row items-center gap-1"
            >
              <Sparkles size={10} color="#3b82f6" />
              <Text className="text-[10px] font-bold text-brand uppercase">Regenerate</Text>
            </TouchableOpacity>
          </View>

          <View>
            <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {ALL_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`mr-2 px-4 py-2 rounded-xl border ${
                    category === cat ? 'bg-brand/10 border-brand' : 'bg-gray-50 border-gray-50'
                  }`}
                >
                  <Text className={`text-[10px] font-bold ${
                    category === cat ? 'text-brand' : 'text-gray-400'
                  }`}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Quantities & Condition */}
        <View className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-5 mb-6">
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Condition</Text>
              <View className="flex-row bg-gray-50 p-1 rounded-xl">
                <TouchableOpacity
                  onPress={() => setIsUsed(false)}
                  className={`flex-1 py-2.5 rounded-lg items-center ${!isUsed ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={`text-xs font-bold ${!isUsed ? 'text-gray-900' : 'text-gray-400'}`}>New</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsUsed(true)}
                  className={`flex-1 py-2.5 rounded-lg items-center ${isUsed ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={`text-xs font-bold ${isUsed ? 'text-gray-900' : 'text-gray-400'}`}>Used</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-1">
              <NativeInput
                label="Quantity"
                placeholder="0"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
                className="font-mono text-center"
              />
            </View>
          </View>

          <View className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-[10px] font-black text-orange-600 uppercase tracking-tight">Stock Alert Threshold</Text>
              <Text className="text-[9px] text-orange-400 font-medium">Warn when stock falls below this</Text>
            </View>
            <TextInput
              keyboardType="numeric"
              value={minThreshold}
              onChangeText={setMinThreshold}
              className="w-16 h-10 bg-white border border-orange-200 rounded-xl text-center font-black text-orange-600"
            />
          </View>
        </View>

        {/* Description */}
        <NativeInput
          label="Notes / Description"
          placeholder="Add details about brand, location, or usage..."
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
          containerClassName="mb-8"
          className="h-24 text-left align-top pt-3"
        />

        <NativeButton
          title={productToEdit ? "Update Inventory" : "Save to Inventory"}
          onPress={handleSave}
          loading={loading}
          className="mb-20 shadow-lg shadow-brand/20"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
