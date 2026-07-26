import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { ArrowUpRight, ArrowDownRight, History as HistoryIcon, Clock } from 'lucide-react-native';
import { InventoryLog } from '../types';

interface HistoryProps {
  logs: InventoryLog[];
}

export default function HistoryNative({ logs }: HistoryProps) {
  return (
    <View className="flex-1 bg-pagebg">
      <View className="px-5 pt-6 pb-4 border-b border-gray-100 bg-white">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 bg-brand/10 rounded-2xl items-center justify-center">
            <HistoryIcon size={20} color="#3b82f6" />
          </View>
          <View>
            <Text className="text-xl font-bold text-gray-900 tracking-tight">Activity Log</Text>
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              History of Stock Movements
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
          const isIn = item.type === 'addition';
          const isUpdate = item.type === 'update';
          const isDelete = item.type === 'deletion';

          return (
            <View className="bg-white border-b border-gray-50 px-5 py-4 flex-row items-start gap-4">
              <View className={`h-9 w-9 rounded-2xl items-center justify-center ${
                isIn ? 'bg-green-100' : isDelete ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {isIn ? <ArrowUpRight size={16} color="#059669" /> :
                 isDelete ? <ArrowDownRight size={16} color="#ef4444" /> :
                 <Clock size={16} color="#3b82f6" />}
              </View>

              <View className="flex-1">
                <View className="flex-row justify-between items-start">
                  <Text className="text-sm font-bold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text className={`font-mono font-black text-sm ${
                    isIn ? 'text-green-600' : isDelete ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {isIn ? '+' : ''}{item.quantityChange}
                  </Text>
                </View>

                {item.notes && (
                  <Text className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {item.notes}
                  </Text>
                )}

                <Text className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-tighter">
                  {new Date(item.timestamp).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })} • {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <HistoryIcon size={48} color="#e2e8f0" />
            <Text className="text-gray-400 text-sm mt-4 font-medium">No activity recorded yet.</Text>
          </View>
        }
      />
    </View>
  );
}
