import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../global.css';

export default function LoanAcceptanceScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [loan, setLoan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetchLoanDetails();
    }, [id]);

    async function fetchLoanDetails() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (!id) return;

            const { data, error } = await supabase
                .from('loans')
                .select(`
          *,
          lender:profiles!lender_id(username, full_name)
        `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setLoan(data);
        } catch (err: any) {
            Alert.alert('Error', 'Could not fetch loan details.');
            router.replace('/');
        } finally {
            setLoading(false);
        }
    }

    async function handleAccept() {
        if (!user) {
            Alert.alert('Auth Required', 'Please sign in to accept this loan.');
            return;
        }

        if (loan.lender_id === user.id) {
            Alert.alert('Error', 'You cannot accept your own loan.');
            return;
        }

        try {
            setAccepting(true);
            const { error } = await supabase
                .from('loans')
                .update({
                    status: 'active',
                    borrower_id: user.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            Alert.alert('Success', 'Loan accepted! The contract is now active.');
            router.replace('/');
        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setAccepting(false);
        }
    }

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <ActivityIndicator size="large" color="#E8B017" />
            </View>
        );
    }

    if (!loan) return null;

    return (
        <SafeAreaView className="flex-1 bg-background px-5 justify-center">
            <Card className="p-6">
                <Text className="text-text-secondary text-center mb-2">Loan Request from</Text>
                <Text className="text-primary text-xl font-bold text-center mb-6">
                    @{loan.lender?.username || 'Unknown'}
                </Text>

                <View className="items-center mb-8">
                    <Text className="text-text-primary text-5xl font-bold">${loan.amount}</Text>
                    <Text className="text-text-secondary mt-2">
                        + {loan.interest_rate}% Interest
                    </Text>
                </View>

                <View className="bg-surface p-4 rounded-lg mb-6">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-text-secondary">Repayment Amount:</Text>
                        <Text className="text-text-primary font-bold">
                            ${(loan.amount + (loan.amount * (loan.interest_rate / 100))).toFixed(2)}
                        </Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-text-secondary">Status:</Text>
                        <Text className="text-text-primary uppercase font-bold">{loan.status === 'pending_acceptance' ? 'Pending' : loan.status}</Text>
                    </View>
                </View>

                {loan.status === 'pending_acceptance' ? (
                    <Button
                        title="Accept Loan"
                        onPress={handleAccept}
                        loading={accepting}
                    />
                ) : (
                    <Button
                        title="View Dashboard"
                        variant="outline"
                        onPress={() => router.replace('/')}
                    />
                )}
            </Card>
        </SafeAreaView>
    );
}
