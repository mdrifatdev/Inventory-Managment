import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { X, ArrowUpRight, ArrowDownRight, History as HistoryIcon } from 'lucide-react-native';
import { InventoryLog } from '../types';

interface TodayStockDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: InventoryLog[];
  type: 'addition' | 'reduction';
}

export default function TodayStockDrawerNative({ isOpen, onClose, logs, type }: TodayStockDrawerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysLogs = logs
    .filter((log) => {
      const logDate = new Date(log.timestamp);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime() && log.type === type;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const isIn = type === 'addition';
  const title = isIn ? 'Stock In Today' : 'Stock Used Today';

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-pagebg">
        {/* Header */}
        <View className="px-5 pt-8 pb-4 border-b border-gray-100 bg-white">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <HistoryIcon size={20} color="#3b82f6" />
              <Text className="text-lg font-bold text-gray-900">{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="h-9 w-9 bg-gray-50 rounded-full items-center justify-center">
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
          <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1">Today's Transactions</Text>
        </View>

        {/* List */}
        <FlatList
          data={todaysLogs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View className="bg-white border-b border-gray-50 px-5 py-4 flex-row items-start gap-4">
              <View className={`h-8 w-8 rounded-xl items-center justify-center ${
                isIn ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                {isIn ? <ArrowUpRight size={14} color="#059669" /> : <ArrowDownRight size={14} color="#d97706" />}
              </View>

              <View className="flex-1">
                <View className="flex-row justify-between items-start">
                  <Text className="text-sm font-bold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text className={`font-mono font-black text-sm ${
                    isIn ? 'text-green-600' : 'text-orange-600'
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
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Text className="text-gray-400 text-sm font-medium">No logs recorded for today.</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}
