import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Search, X, Filter, Download } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Product, Category, ALL_CATEGORIES } from '../types';
import { ProductCardNative } from '../components/ProductCard.native';
import StockModalNative from '../components/StockModal.native';
import ProductHistoryDrawerNative from '../components/ProductHistoryDrawer.native';

interface ProductsListProps {
  products: Product[];
  logs?: any[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onUpdateQuantity: (id: string, newQty: number, type: 'addition' | 'reduction', notes?: string) => void;
}

const CATEGORIES: (Category | 'All')[] = ['All', ...ALL_CATEGORIES];

export default function ProductsNative({
  products,
  logs = [],
  onEdit,
  onDelete,
  onUpdateQuantity,
}: ProductsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [stockFilter, setStockStatus] = useState<'all' | 'low' | 'out'>('all');

  // Modal States
  const [stockModal, setStockModal] = useState<{ product: Product | null, mode: 'in' | 'out' }>({ product: null, mode: 'in' });
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const exportToCSV = async () => {
    if (products.length === 0) return;

    const headers = ['Product Name', 'SKU', 'Category', 'Quantity', 'Min Threshold', 'Added Date'];
    const rows = products.map((p) => [
      `"${p.name}"`, `"${p.sku}"`, `"${p.category}"`, p.quantity, p.minThreshold, `"${new Date(p.addedAt).toLocaleDateString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const fileUri = FileSystem.documentDirectory + 'inventory_export.csv';

    try {
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri);
    } catch (e) {
      Alert.alert('Export Failed', 'Could not generate CSV file.');
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesStock = stockFilter === 'all' ||
                         (stockFilter === 'low' && p.quantity <= p.minThreshold && p.quantity > 0) ||
                         (stockFilter === 'out' && p.quantity === 0);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  return (
    <View className="flex-1 bg-pagebg">
      {/* Header */}
      <View className="px-5 pt-6 pb-4">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-xl font-bold text-gray-900 tracking-tight">Inventory</Text>
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              {products.length} Items Total
            </Text>
          </View>
          <TouchableOpacity
            onPress={exportToCSV}
            className="h-9 w-9 bg-brand rounded-xl items-center justify-center shadow-sm"
          >
            <Download size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="relative">
          <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <Search size={16} color="#94a3b8" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search items, SKU..."
            placeholderTextColor="#94a3b8"
            className="bg-white border border-gray-100 rounded-2xl pl-12 pr-12 py-3.5 text-sm text-gray-900"
          />
          {searchQuery !== '' && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          className="flex-row"
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              className={`mr-2 px-5 py-2 rounded-full border ${
                selectedCategory === cat ? 'bg-brand border-brand' : 'bg-white border-gray-100'
              }`}
            >
              <Text className={`text-[10px] font-black uppercase tracking-widest ${
                selectedCategory === cat ? 'text-white' : 'text-gray-400'
              }`}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="flex-row px-5 gap-2 mb-6">
        {[
          { id: 'all', label: 'All' },
          { id: 'low', label: 'Low Stock' },
          { id: 'out', label: 'Out of Stock' }
        ].map(f => (
          <TouchableOpacity
            key={f.id}
            onPress={() => setStockStatus(f.id as any)}
            className={`flex-1 py-2.5 rounded-xl border items-center ${
              stockFilter === f.id ? 'bg-brand/10 border-brand' : 'bg-white border-gray-50'
            }`}
          >
            <Text className={`text-[10px] font-bold ${
              stockFilter === f.id ? 'text-brand' : 'text-gray-400'
            }`}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <ProductCardNative
            product={item}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item.id)}
            onHistory={() => setHistoryProduct(item)}
            onIncrement={() => setStockModal({ product: item, mode: 'in' })}
            onDecrement={() => setStockModal({ product: item, mode: 'out' })}
          />
        )}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Text className="text-gray-400 text-sm italic font-medium">No items found matching your filters.</Text>
          </View>
        }
      />

      {/* Modal & Drawer */}
      {stockModal.product && (
        <StockModalNative
          isOpen={!!stockModal.product}
          product={stockModal.product}
          mode={stockModal.mode}
          onClose={() => setStockModal({ product: null, mode: 'in' })}
          onConfirm={(qty, notes) => {
            const newQty = stockModal.mode === 'in' ? stockModal.product!.quantity + qty : stockModal.product!.quantity - qty;
            onUpdateQuantity(stockModal.product!.id, newQty, stockModal.mode === 'in' ? 'addition' : 'reduction', notes);
          }}
        />
      )}

      {historyProduct && (
        <ProductHistoryDrawerNative
          isOpen={!!historyProduct}
          product={historyProduct}
          logs={logs}
          onClose={() => setHistoryProduct(null)}
        />
      )}
    </View>
  );
}
