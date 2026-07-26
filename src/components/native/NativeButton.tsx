import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

interface NativeButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export default function NativeButton({
  onPress,
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  className = '',
  textClassName = '',
}: NativeButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary': return 'bg-brand shadow-sm';
      case 'secondary': return 'bg-blue-50 border border-brand/10';
      case 'danger': return 'bg-red-500 shadow-sm';
      case 'outline': return 'bg-transparent border border-gray-200';
      case 'ghost': return 'bg-transparent';
      default: return 'bg-brand';
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary': return 'text-white';
      case 'secondary': return 'text-brand';
      case 'danger': return 'text-white';
      case 'outline': return 'text-gray-600';
      case 'ghost': return 'text-brand';
      default: return 'text-white';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`flex-row items-center justify-center py-3.5 px-6 rounded-xl transition-all ${getVariantStyles()} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? 'white' : '#3b82f6'} size="small" />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`font-bold text-sm text-center ${getTextStyle()} ${textClassName}`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
