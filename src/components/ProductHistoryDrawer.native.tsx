import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Image, FlatList } from 'react-native';
import { X, ArrowUpRight, ArrowDownRight, History as HistoryIcon } from 'lucide-react-native';
import { Product, InventoryLog, FALLBACK_IMAGE } from '../types';

interface ProductHistoryDrawerProps {
  product: Product | null;
  logs: InventoryLog[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductHistoryDrawerNative({ product, logs, isOpen, onClose }: ProductHistoryDrawerProps) {
  if (!product) return null;

  const productLogs = logs
    .filter(log => log.productId === product.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-pagebg">
        {/* Header */}
        <View className="px-5 pt-8 pb-4 border-b border-gray-100 bg-white">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-2">
              <HistoryIcon size={20} color="#3b82f6" />
              <Text className="text-lg font-bold text-gray-900">Product History</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="h-9 w-9 bg-gray-50 rounded-full items-center justify-center">
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-4">
            <Image
              source={{ uri: product.image_url || FALLBACK_IMAGE }}
              className="w-14 h-14 rounded-2xl bg-gray-100"
            />
            <View className="flex-1">
              <Text className="font-bold text-gray-900" numberOfLines={1}>{product.name}</Text>
              <Text className="text-[10px] font-mono text-gray-400 mt-0.5 tracking-widest uppercase">{product.sku}</Text>
            </View>
          </View>
        </View>

        {/* List */}
        <FlatList
          data={productLogs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => {
            const isIn = item.type === 'addition';
            const isDelete = item.type === 'deletion';

            return (
              <View className="bg-white border-b border-gray-50 px-5 py-4 flex-row items-start gap-4">
                <View className={`h-8 w-8 rounded-xl items-center justify-center ${
                  isIn ? 'bg-green-100' : isDelete ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {isIn ? <ArrowUpRight size={14} color="#059669" /> :
                   isDelete ? <ArrowDownRight size={14} color="#ef4444" /> :
                   <HistoryIcon size={14} color="#3b82f6" />}
                </View>

                <View className="flex-1">
                  <View className="flex-row justify-between items-start">
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {isIn ? 'Stock Added' : isDelete ? 'Deleted' : 'Stock Used'}
                    </Text>
                    <Text className={`font-mono font-black text-sm ${
                      isIn ? 'text-green-600' : isDelete ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {isIn ? '+' : ''}{item.quantityChange}
                    </Text>
                  </View>

                  {item.notes && (
                    <Text className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {item.notes}
                    </Text>
                  )}

                  <Text className="text-[9px] text-gray-400 mt-2 font-bold uppercase">
                    {new Date(item.timestamp).toLocaleString([], {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Text className="text-gray-400 text-sm font-medium">No movement recorded for this item.</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}
