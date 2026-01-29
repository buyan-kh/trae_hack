import React from 'react';
import { View, ViewProps } from 'react-native';
import { clsx } from 'clsx';

interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined';
}

export function Card({ style, className, variant = 'default', ...props }: CardProps) {
  return (
    <View
      className={clsx(
        'bg-card rounded-2xl p-5',
        variant === 'outlined' && 'border border-text-muted bg-transparent',
        className
      )}
      {...props}
    />
  );
}
