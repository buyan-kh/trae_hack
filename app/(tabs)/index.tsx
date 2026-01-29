import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TrendingUp, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react-native';
import '../../global.css';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate fetch
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-5"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8B017" />}
      >
        {/* Header */}
        <View className="mt-6 mb-8 flex-row justify-between items-center">
          <View>
            <Text className="text-text-secondary text-sm font-medium">Total Balance</Text>
            <Text className="text-text-primary text-4xl font-bold mt-1">$1,420.50</Text>
          </View>
          <View className="bg-card p-2 rounded-full border border-text-muted/20">
             <Wallet size={24} color="#E8B017" />
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-4 mb-8">
          <Button
            title="Lend"
            className="flex-1"
            icon={<ArrowUpRight size={20} color="#1A1A1A" />}
          />
          <Button
            title="Borrow"
            variant="secondary"
            className="flex-1"
            icon={<ArrowDownLeft size={20} color="#FFFFFF" />}
          />
        </View>

        {/* Trust Score Card */}
        <Card className="mb-8 bg-gradient-to-r from-card to-surface border border-text-muted/10">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-text-secondary font-medium">Social Trust Score</Text>
            <TrendingUp size={20} color="#22C55E" />
          </View>
          <Text className="text-text-primary text-3xl font-bold">724</Text>
          <Text className="text-success text-sm mt-1">+12 pts this month</Text>
        </Card>

        {/* Recent Activity */}
        <View>
          <Text className="text-text-primary text-lg font-bold mb-4">Recent Activity</Text>
          
          {/* Activity Item 1 */}
          <Card className="mb-3 flex-row items-center justify-between p-4" variant="outlined">
            <View className="flex-row items-center gap-3">
              <View className="bg-primary/20 p-2.5 rounded-full">
                <ArrowDownLeft size={20} color="#E8B017" />
              </View>
              <View>
                <Text className="text-text-primary font-bold">From: Sarah M.</Text>
                <Text className="text-text-secondary text-xs">Due in 5 days</Text>
              </View>
            </View>
            <Text className="text-success font-bold">+$50.00</Text>
          </Card>

           {/* Activity Item 2 */}
           <Card className="mb-3 flex-row items-center justify-between p-4" variant="outlined">
            <View className="flex-row items-center gap-3">
              <View className="bg-secondary/20 p-2.5 rounded-full">
                <ArrowUpRight size={20} color="#9B7EB5" />
              </View>
              <View>
                <Text className="text-text-primary font-bold">To: James K.</Text>
                <Text className="text-text-secondary text-xs">Pending acceptance</Text>
              </View>
            </View>
            <Text className="text-text-primary font-bold">-$120.00</Text>
          </Card>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
