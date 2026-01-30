import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import '../../global.css';

// Using a public Yahoo Finance compatible API or logic
// Note: Direct Yahoo Finance API calls can be tricky due to CORS/Rate-limiting in some environments,
// but for a simple React Native app it often works or we can use a wrapper.
// Here we will try to fetch standard JSON data.

type Asset = {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    type: 'crypto' | 'stock';
};

const DEFAULT_SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'AAPL', 'TSLA', 'SPY', 'NVDA', 'MSFT'];

export default function WatchlistScreen() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAssetData = async (symbol: string) => {
        try {
            // Using query1.finance.yahoo.com
            const response = await fetch(
                `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
            );
            const data = await response.json();
            const result = data.chart.result[0];
            const meta = result.meta;

            const regularMarketPrice = meta.regularMarketPrice;
            const previousClose = meta.chartPreviousClose;
            const change = regularMarketPrice - previousClose;
            const changePercent = (change / previousClose) * 100;

            return {
                symbol: meta.symbol,
                name: meta.shortName || meta.symbol,
                price: regularMarketPrice,
                change: change,
                changePercent: changePercent,
                type: meta.instrumentType === 'CRYPTOCURRENCY' ? 'crypto' : 'stock',
            } as Asset;
        } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            return null;
        }
    };

    const loadData = async () => {
        try {
            const results = await Promise.all(DEFAULT_SYMBOLS.map(sym => fetchAssetData(sym)));
            setAssets(results.filter((a): a is Asset => a !== null));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const renderItem = ({ item }: { item: Asset }) => (
        <ThemedView style={styles.card}>
            <View style={styles.row}>
                <View>
                    <ThemedText type="subtitle">{item.symbol}</ThemedText>
                    <ThemedText style={styles.name}>{item.name}</ThemedText>
                </View>
                <View style={styles.rightAlign}>
                    <ThemedText type="subtitle">
                        ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </ThemedText>
                    <ThemedText
                        style={{
                            color: item.change >= 0 ? '#4ade80' : '#f87171',
                            fontWeight: '600'
                        }}
                    >
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
                    </ThemedText>
                </View>
            </View>
        </ThemedView>
    );

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View style={styles.header}>
                <ThemedText type="title">Watchlist</ThemedText>
            </View>

            {loading && assets.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#E8B017" />
                </View>
            ) : (
                <FlatList
                    data={assets}
                    renderItem={renderItem}
                    keyExtractor={item => item.symbol}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8B017" />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingTop: 20, // Adjusted since SafeAreaView handles status bar
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: 'transparent',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100, // Space for tab bar
        gap: 12,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#1E1E1E', // Slightly lighter than background
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rightAlign: {
        alignItems: 'flex-end',
    },
    name: {
        fontSize: 12,
        opacity: 0.7,
        marginTop: 2,
    }
});
