import React from 'react';
import { View, TouchableOpacity, ViewProps } from 'react-native';

interface NativeCardProps extends ViewProps {
  onPress?: () => void;
  className?: string;
}

export default function NativeCard({ children, onPress, className, ...props }: NativeCardProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      {...props}
      onPress={onPress}
      activeOpacity={0.7}
      className={`bg-card border border-gray-100 rounded-2xl p-5 shadow-sm ${className}`}
    >
      {children}
    </Container>
  );
}
