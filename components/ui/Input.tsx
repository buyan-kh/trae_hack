import React from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';
import { clsx } from 'clsx';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  containerClassName,
  className,
  ...props
}: InputProps) {
  return (
    <View className={clsx('w-full', containerClassName)}>
      {label && (
        <Text className="text-text-secondary mb-2 text-sm font-medium ml-1">
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor="#525252"
        className={clsx(
          'w-full bg-card text-text-primary px-4 py-3.5 rounded-xl border border-transparent focus:border-primary',
          error && 'border-danger',
          className
        )}
        {...props}
      />
      {error && (
        <Text className="text-danger text-xs mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
}
