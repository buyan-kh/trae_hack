import { clsx } from 'clsx';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface ButtonProps {
  onPress?: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  icon,
}: ButtonProps) {
  const baseStyles = 'flex-row items-center justify-center rounded-full active:opacity-80';
  
  const variants = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    outline: 'border border-primary bg-transparent',
    ghost: 'bg-transparent',
  };

  const sizes = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  };

  const textStyles = {
    primary: 'text-primary-foreground font-bold',
    secondary: 'text-secondary-foreground font-bold',
    outline: 'text-primary font-bold',
    ghost: 'text-primary font-bold',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        disabled && 'opacity-50',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#1A1A1A' : '#E8B017'} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={clsx(textStyles[variant], 'text-center text-base')}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
