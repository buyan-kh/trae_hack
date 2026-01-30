import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { ThemedText } from './themed-text';
import { Card } from './ui/Card';

export interface LoanReceiptProps {
  amount: number;
  date: string;
  lender: string;
  borrower: string;
  description: string;
  totalRepayment: number;
  type: 'lend' | 'borrow';
}

export const LoanReceipt = forwardRef<View, LoanReceiptProps>(({
  amount,
  date,
  lender,
  borrower,
  description,
  totalRepayment,
  type
}, ref) => {
  return (
    <View ref={ref} className="bg-background p-6" collapsable={false}>
      <Card className="items-center bg-card shadow-sm border border-border">
        <View className="items-center mb-6">
          <ThemedText type="title" className="text-center mb-2" lightColor="#FFFFFF" darkColor="#FFFFFF">
            {type === 'lend' ? 'Payment Sent' : 'Payment Requested'}
          </ThemedText>
          <ThemedText className="text-text-secondary text-sm" lightColor="#A1A1AA" darkColor="#A1A1AA">{date}</ThemedText>
        </View>

        <View className="items-center mb-8">
          <ThemedText type="title" style={{ fontSize: 48, lineHeight: 56 }} lightColor="#FFFFFF" darkColor="#FFFFFF">
            ${amount.toFixed(2)}
          </ThemedText>
        </View>

        <View className="w-full gap-4">
          <View className="flex-row justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
            <ThemedText className="text-text-secondary" lightColor="#A1A1AA" darkColor="#A1A1AA">From</ThemedText>
            <ThemedText type="defaultSemiBold" lightColor="#FFFFFF" darkColor="#FFFFFF">{lender}</ThemedText>
          </View>

          <View className="flex-row justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
            <ThemedText className="text-text-secondary" lightColor="#A1A1AA" darkColor="#A1A1AA">To</ThemedText>
            <ThemedText type="defaultSemiBold" lightColor="#FFFFFF" darkColor="#FFFFFF">{borrower}</ThemedText>
          </View>

          <View className="flex-row justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
            <ThemedText className="text-text-secondary" lightColor="#A1A1AA" darkColor="#A1A1AA">For</ThemedText>
            <ThemedText type="defaultSemiBold" lightColor="#FFFFFF" darkColor="#FFFFFF">{description || 'Unspecified'}</ThemedText>
          </View>

          <View className="flex-row justify-between pt-2">
            <ThemedText className="text-text-secondary" lightColor="#A1A1AA" darkColor="#A1A1AA">Total Repayment</ThemedText>
            <ThemedText type="defaultSemiBold" className="text-green-600" lightColor="#16a34a" darkColor="#16a34a">
              ${totalRepayment.toFixed(2)}
            </ThemedText>
          </View>
        </View>

        <View className="mt-8">
          <ThemedText className="text-gray-400 text-xs text-center" lightColor="#9ca3af" darkColor="#9ca3af">
            Processed via Peerly
          </ThemedText>
        </View>
      </Card>
    </View>
  );
});

LoanReceipt.displayName = 'LoanReceipt';
