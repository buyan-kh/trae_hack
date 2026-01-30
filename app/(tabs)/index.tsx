import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TrendingUp, ArrowUpRight, ArrowDownLeft, Wallet, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/lib/session';
import '../../global.css';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

type Loan = {
  id: string;
  amount: number;
  status: 'pending' | 'active' | 'paid' | 'rejected';
  lender_id: string;
  borrower_id: string;
  created_at: string;
  lender?: { full_name: string };
  borrower?: { full_name: string };
};

export default function HomeScreen() {
  const { user } = useSession();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        lender:profiles!lender_id(full_name),
        borrower:profiles!borrower_id(full_name)
      `)
      .or(`lender_id.eq.${user.id},borrower_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching loans:', error);
    } else {
      setLoans(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLoans();
  }, [user]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchLoans().then(() => setRefreshing(false));
  }, [user]);

  // Categorize loans
  const activeLoans = loans.filter(l => l.status === 'active');
  const pendingLoans = loans.filter(l => l.status === 'pending');
  const inactiveLoans = loans.filter(l => l.status === 'paid' || l.status === 'rejected');

  const renderLoanItem = (loan: Loan) => {
    const isLender = loan.lender_id === user?.id;
    const otherName = isLender ? loan.borrower?.full_name : loan.lender?.full_name;
    const typeLabel = isLender ? 'Lending to' : 'Borrowing from';
    const color = isLender ? '#E8B017' : '#9B7EB5'; // Gold for lending, Purple for borrowing
    const Icon = isLender ? ArrowUpRight : ArrowDownLeft;

    return (
      <Card key={loan.id} className="mb-3 flex-row items-center justify-between p-4" variant="outlined">
        <View className="flex-row items-center gap-3">
          <View className={`p-2.5 rounded-full`} style={{ backgroundColor: `${color}20` }}>
            <Icon size={20} color={color} />
          </View>
          <View>
            <Text className="text-text-primary font-bold">{typeLabel}: {otherName}</Text>
            <Text className="text-text-secondary text-xs">
              {format(new Date(loan.created_at), 'MMM dd, yyyy')} • {loan.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <View className="items-end">
             <Text className={isLender ? 'text-success font-bold' : 'text-text-primary font-bold'}>
                {isLender ? '+' : '-'}${loan.amount.toFixed(2)}
             </Text>
        </View>
      </Card>
    );
  };

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
            <Text className="text-text-primary text-4xl font-bold mt-1">${user?.balance || '0.00'}</Text>
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
            onPress={() => router.push('/create')}
          />
          <Button
            title="Borrow"
            variant="secondary"
            className="flex-1"
            icon={<ArrowDownLeft size={20} color="#FFFFFF" />}
            onPress={() => router.push('/create')}
          />
        </View>

        {/* Trust Score Card */}
        <Card className="mb-8 bg-gradient-to-r from-card to-surface border border-text-muted/10">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-text-secondary font-medium">Social Trust Score</Text>
            <TrendingUp size={20} color="#22C55E" />
          </View>
          <Text className="text-text-primary text-3xl font-bold">{user?.trust_score || 650}</Text>
          <Text className="text-success text-sm mt-1">+12 pts this month</Text>
        </Card>

        {loading ? (
            <ActivityIndicator color="#E8B017" />
        ) : (
            <>
                {/* Pending Requests */}
                {pendingLoans.length > 0 && (
                    <View className="mb-6">
                        <View className="flex-row items-center gap-2 mb-3">
                            <Clock size={18} color="#E8B017" />
                            <Text className="text-text-primary text-lg font-bold">Pending Requests</Text>
                        </View>
                        {pendingLoans.map(renderLoanItem)}
                    </View>
                )}

                {/* Active Loans */}
                {activeLoans.length > 0 && (
                    <View className="mb-6">
                         <View className="flex-row items-center gap-2 mb-3">
                            <CheckCircle size={18} color="#22C55E" />
                            <Text className="text-text-primary text-lg font-bold">Active Loans</Text>
                        </View>
                        {activeLoans.map(renderLoanItem)}
                    </View>
                )}

                {/* Inactive / History */}
                {inactiveLoans.length > 0 && (
                    <View className="mb-6">
                        <View className="flex-row items-center gap-2 mb-3">
                            <XCircle size={18} color="#A1A1AA" />
                            <Text className="text-text-primary text-lg font-bold">History</Text>
                        </View>
                        {inactiveLoans.map(renderLoanItem)}
                    </View>
                )}
                
                {loans.length === 0 && (
                    <Text className="text-text-secondary text-center mt-4">No transaction history yet.</Text>
                )}
            </>
        )}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
