import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { Card } from './ui/Card';
import { ThemedText } from './themed-text';

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
           <ThemedText type="title" className="text-center mb-2">
             {type === 'lend' ? 'Payment Sent' : 'Payment Requested'}
           </ThemedText>
           <ThemedText className="text-text-secondary text-sm">{date}</ThemedText>
        </View>

        <View className="items-center mb-8">
           <ThemedText type="title" style={{ fontSize: 48, lineHeight: 56 }}>
             ${amount.toFixed(2)}
           </ThemedText>
        </View>

        <View className="w-full gap-4">
           <View className="flex-row justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
             <ThemedText className="text-text-secondary">From</ThemedText>
             <ThemedText type="defaultSemiBold">{lender}</ThemedText>
           </View>
           
           <View className="flex-row justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
             <ThemedText className="text-text-secondary">To</ThemedText>
             <ThemedText type="defaultSemiBold">{borrower}</ThemedText>
           </View>

           <View className="flex-row justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
             <ThemedText className="text-text-secondary">For</ThemedText>
             <ThemedText type="defaultSemiBold">{description || 'Unspecified'}</ThemedText>
           </View>

           <View className="flex-row justify-between pt-2">
             <ThemedText className="text-text-secondary">Total Repayment</ThemedText>
             <ThemedText type="defaultSemiBold" className="text-green-600">
                ${totalRepayment.toFixed(2)}
             </ThemedText>
           </View>
        </View>

        <View className="mt-8">
           <ThemedText className="text-gray-400 text-xs text-center">
             Processed via Peerly
           </ThemedText>
        </View>
      </Card>
    </View>
  );
});
