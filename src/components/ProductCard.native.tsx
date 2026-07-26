import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Edit2, Trash2, History, Plus, Minus, Info } from 'lucide-react-native';
import { Product, FALLBACK_IMAGE } from '../types';

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onHistory: () => void;
}

export function ProductCardNative({
  product,
  onEdit,
  onDelete,
  onIncrement,
  onDecrement,
  onHistory,
}: ProductCardProps) {
  const isLowStock = product.quantity <= product.minThreshold && product.quantity > 0;
  const isOutOfStock = product.quantity === 0;

  return (
    <View className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm mb-4">
      <View className="flex-row gap-4">
        {/* Image */}
        <View className="relative">
          <Image
            source={{ uri: product.image_url || FALLBACK_IMAGE }}
            className="w-20 h-20 rounded-2xl bg-gray-50"
            resizeMode="cover"
          />
          {isOutOfStock && (
            <View className="absolute inset-0 bg-white/60 items-center justify-center rounded-2xl">
              <Text className="text-[8px] font-black text-red-600 uppercase tracking-tighter bg-white px-1 py-0.5 rounded shadow-sm">Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1 justify-between">
          <View>
            <View className="flex-row justify-between items-start">
              <Text className="text-[9px] font-black text-brand uppercase tracking-widest">{product.category}</Text>
              <View className={`px-2 py-0.5 rounded-full ${product.isUsed ? 'bg-orange-50' : 'bg-green-50'}`}>
                <Text className={`text-[8px] font-bold ${product.isUsed ? 'text-orange-600' : 'text-green-600'}`}>
                  {product.isUsed ? 'Used' : 'New'}
                </Text>
              </View>
            </View>
            <Text className="text-sm font-bold text-gray-900 mt-1" numberOfLines={1}>{product.name}</Text>
            <Text className="text-[9px] font-mono text-gray-400 mt-0.5 tracking-tight">{product.sku}</Text>
          </View>

          <View className="flex-row items-end justify-between mt-2">
            <View>
              <Text className="text-[8px] font-bold text-gray-400 uppercase">Current Stock</Text>
              <Text className={`text-xl font-black ${isLowStock ? 'text-orange-500' : isOutOfStock ? 'text-red-500' : 'text-gray-900'}`}>
                {product.quantity}
              </Text>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity onPress={onDecrement} className="h-8 w-8 bg-gray-50 rounded-xl items-center justify-center">
                <Minus size={14} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onIncrement} className="h-8 w-8 bg-brand rounded-xl items-center justify-center shadow-sm">
                <Plus size={14} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Action Footer */}
      <View className="flex-row mt-4 pt-4 border-t border-gray-50 justify-between items-center">
        <View className="flex-row gap-3">
          <TouchableOpacity onPress={onHistory} className="flex-row items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
            <History size={12} color="#64748b" />
            <Text className="text-[10px] font-bold text-gray-500 uppercase">History</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onEdit} className="flex-row items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
            <Edit2 size={12} color="#3b82f6" />
            <Text className="text-[10px] font-bold text-brand uppercase">Edit</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onDelete} className="p-2 bg-red-50 rounded-xl">
          <Trash2 size={14} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
