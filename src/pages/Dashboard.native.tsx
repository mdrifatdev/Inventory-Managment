import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Package, Boxes, ArrowUpRight, ArrowDownRight, RotateCcw, ArrowRight } from 'lucide-react-native';
import { Product, InventoryLog } from '../types';
import NativeCard from '../components/native/NativeCard';
import TodayStockDrawerNative from '../components/TodayStockDrawer.native';

interface DashboardProps {
  products: Product[];
  logs: InventoryLog[];
  onViewChange: (view: string) => void;
  onFilterLowStock: () => void;
}

export default function DashboardNative({
  products,
  logs,
  onViewChange,
  onFilterLowStock,
}: DashboardProps) {
  const [activeTodayDrawerType, setActiveTodayDrawerType] = useState<'addition' | 'reduction' | null>(null);
  const totalProducts = products.length;
  const totalStock = products.reduce((acc, p) => acc + p.quantity, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysLogs = logs.filter((log) => {
    const logDate = new Date(log.timestamp);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime();
  });

  const stockInToday = todaysLogs
    .filter((l) => l.type === 'addition')
    .reduce((acc, l) => acc + Math.abs(l.quantityChange), 0);

  const stockUsedToday = todaysLogs
    .filter((l) => l.type === 'reduction')
    .reduce((acc, l) => acc + Math.abs(l.quantityChange), 0);

  const lowStockProducts = products.filter(p => p.quantity <= p.minThreshold && p.quantity > 0);

  return (
    <View className="flex-1 bg-pagebg">
      <ScrollView className="flex-1 px-5 py-6">
        {/* ── Stats Grid ── */}
        <View className="flex-row flex-wrap -mx-2 mb-6">
          <View className="w-1/2 px-2 mb-4">
            <NativeCard onPress={() => onViewChange('Products')} className="h-[120px] justify-between">
              <View className="flex-row justify-between">
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Products</Text>
                <Package size={16} color="#3b82f6" />
              </View>
              <Text className="text-2xl font-bold text-gray-900">{totalProducts}</Text>
            </NativeCard>
          </View>

          <View className="w-1/2 px-2 mb-4">
            <NativeCard onPress={() => onViewChange('Products')} className="h-[120px] justify-between">
              <View className="flex-row justify-between">
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Stock</Text>
                <Boxes size={16} color="#3b82f6" />
              </View>
              <Text className="text-2xl font-bold text-gray-900">{totalStock.toLocaleString()}</Text>
            </NativeCard>
          </View>

          <View className="w-1/2 px-2">
            <NativeCard
              onPress={() => setActiveTodayDrawerType('addition')}
              className="h-[120px] justify-between border-green-100 bg-green-50/20"
            >
              <View className="flex-row justify-between">
                <Text className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Stock In</Text>
                <ArrowUpRight size={16} color="#10b981" />
              </View>
              <Text className="text-2xl font-bold text-green-600">+{stockInToday}</Text>
            </NativeCard>
          </View>

          <View className="w-1/2 px-2">
            <NativeCard
              onPress={() => setActiveTodayDrawerType('reduction')}
              className="h-[120px] justify-between border-orange-100 bg-orange-50/20"
            >
              <View className="flex-row justify-between">
                <Text className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Stock Used</Text>
                <ArrowDownRight size={16} color="#f97316" />
              </View>
              <Text className="text-2xl font-bold text-orange-600">-{stockUsedToday}</Text>
            </NativeCard>
          </View>
        </View>

        {/* ── Low Stock Alert ── */}
        {lowStockProducts.length > 0 && (
          <TouchableOpacity
            onPress={onFilterLowStock}
            activeOpacity={0.8}
            className="bg-orange-100/50 border border-orange-200 rounded-2xl p-4 flex-row items-center justify-between mb-6"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-2 w-2 rounded-full bg-orange-500" />
              <View>
                <Text className="text-xs font-bold text-orange-700">Low Stock Warning</Text>
                <Text className="text-[10px] text-orange-600/80 mt-0.5">
                  {lowStockProducts.length} items below threshold
                </Text>
              </View>
            </View>
            <ArrowRight size={16} color="#f97316" />
          </TouchableOpacity>
        )}

        {/* ── Recent Activity ── */}
        <View className="bg-white border border-gray-100 rounded-3xl overflow-hidden mb-12">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-50">
            <View className="flex-row items-center gap-2">
              <RotateCcw size={16} color="#3b82f6" />
              <Text className="font-bold text-sm text-gray-900">Recent Activity</Text>
            </View>
            <TouchableOpacity onPress={() => onViewChange('History')}>
              <Text className="text-[10px] font-bold text-brand uppercase tracking-widest">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="divide-y divide-gray-50">
            {logs.length === 0 ? (
              <View className="py-12 items-center">
                <Text className="text-xs text-gray-400">No activity yet</Text>
              </View>
            ) : (
              logs.slice(0, 5).map((log) => {
                const isIn = log.type === 'addition';
                return (
                  <View key={log.id} className="flex-row items-center gap-4 px-5 py-4">
                    <View className={`h-8 w-8 rounded-xl items-center justify-center ${
                      isIn ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      {isIn ? <ArrowUpRight size={14} color="#059669" /> : <ArrowDownRight size={14} color="#d97706" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-gray-900" numberOfLines={1}>{log.productName}</Text>
                      <Text className="text-[9px] text-gray-400 mt-0.5">
                        {new Date(log.timestamp).toLocaleDateString()} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text className={`font-mono font-bold text-xs ${isIn ? 'text-green-600' : 'text-orange-600'}`}>
                      {isIn ? '+' : ''}{log.quantityChange}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* Today Drawer */}
      <TodayStockDrawerNative
        isOpen={activeTodayDrawerType !== null}
        onClose={() => setActiveTodayDrawerType(null)}
        logs={logs}
        type={activeTodayDrawerType || 'addition'}
      />
    </View>
  );
}
