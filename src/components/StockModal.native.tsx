import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, Minus, X, AlertTriangle } from 'lucide-react-native';
import { Product } from '../types';
import NativeButton from './native/NativeButton';

interface StockModalProps {
  product: Product;
  mode: 'in' | 'out';
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, notes?: string) => void;
}

export default function StockModalNative({ product, mode, isOpen, onClose, onConfirm }: StockModalProps) {
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const quickAmounts = [1, 5, 10, 20, 50];

  const handleQuickAdd = (amount: number) => {
    const current = parseInt(quantity, 10) || 0;
    setQuantity((current + amount).toString());
  };

  const handleConfirm = () => {
    const qty = parseInt(quantity, 10) || 0;

    if (qty <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (mode === 'out' && qty > product.quantity) {
      setError("Not enough stock.");
      return;
    }

    onConfirm(qty, notes.trim());
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40 justify-center p-6">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View className="bg-white rounded-3xl overflow-hidden">
            {/* Header */}
            <View className={`px-5 py-4 border-b border-gray-100 flex-row items-center justify-between ${mode === 'in' ? 'bg-green-50/50' : 'bg-orange-50/50'}`}>
              <View className="flex-row items-center gap-3">
                <View className={`h-8 w-8 rounded-xl items-center justify-center ${mode === 'in' ? 'bg-green-100' : 'bg-orange-100'}`}>
                  {mode === 'in' ? <Plus size={16} color="#10b981" /> : <Minus size={16} color="#f97316" />}
                </View>
                <View>
                  <Text className="font-bold text-gray-900">{mode === 'in' ? 'Stock In' : 'Stock Used'}</Text>
                  <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-tight" numberOfLines={1}>
                    {product.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} className="p-1">
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View className="p-6 space-y-6">
              {/* Current Stock */}
              <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-2xl">
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Stock</Text>
                <Text className="font-mono font-black text-xl text-gray-900">{product.quantity}</Text>
              </View>

              {/* Input */}
              <View>
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1 text-center">Amount to {mode === 'in' ? 'Add' : 'Remove'}</Text>
                <TextInput
                  keyboardType="numeric"
                  autoFocus
                  value={quantity}
                  onChangeText={(val) => {
                    setError(null);
                    setQuantity(val);
                  }}
                  placeholder="0"
                  className={`text-center text-4xl font-black py-4 rounded-2xl border ${error ? 'border-red-400 bg-red-50' : 'bg-gray-50 border-gray-100'} text-gray-900`}
                />
                {error && (
                  <View className="flex-row items-center gap-1.5 mt-2 justify-center">
                    <AlertTriangle size={12} color="#ef4444" />
                    <Text className="text-xs text-red-500 font-bold">{error}</Text>
                  </View>
                )}
              </View>

              {/* Quick Amounts */}
              <View className="flex-row gap-2 flex-wrap">
                {quickAmounts.map(amount => (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => handleQuickAdd(amount)}
                    className={`flex-1 min-w-[50px] py-2.5 rounded-xl items-center justify-center border ${
                      mode === 'in' ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'
                    }`}
                  >
                    <Text className={`font-mono font-bold text-sm ${mode === 'in' ? 'text-green-600' : 'text-orange-600'}`}>+{amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes */}
              <View>
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Notes (Optional)</Text>
                <TextInput
                  multiline
                  numberOfLines={2}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={mode === 'in' ? 'e.g. Restocked' : 'e.g. For office'}
                  className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 min-h-[60px] text-left align-top"
                />
              </View>

              {/* Actions */}
              <View className="flex-row gap-3 mt-2">
                <TouchableOpacity
                  onPress={onClose}
                  className="flex-1 py-4 items-center"
                >
                  <Text className="text-gray-400 font-bold text-sm">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirm}
                  className={`flex-[2] py-4 rounded-2xl items-center justify-center ${mode === 'in' ? 'bg-green-500' : 'bg-orange-500'} shadow-lg shadow-gray-200`}
                >
                  <Text className="text-white font-black text-sm uppercase">Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
