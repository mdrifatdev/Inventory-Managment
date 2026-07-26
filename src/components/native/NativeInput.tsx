import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface NativeInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export default function NativeInput({
  label,
  error,
  icon,
  containerClassName = '',
  className = '',
  ...props
}: NativeInputProps) {
  return (
    <View className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
          {label}
        </Text>
      )}

      <View className="relative">
        {icon && (
          <View className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            {icon}
          </View>
        )}

        <TextInput
          {...props}
          placeholderTextColor="#94a3b8"
          className={`bg-white border border-gray-100 rounded-xl px-4 py-3.5 text-sm text-gray-900 focus:border-brand transition-all ${icon ? 'pl-11' : ''} ${error ? 'border-red-500' : ''} ${className}`}
        />
      </View>

      {error && (
        <Text className="text-[10px] text-red-500 font-medium ml-1 mt-0.5">
          {error}
        </Text>
      )}
    </View>
  );
}
