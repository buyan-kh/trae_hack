import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSession } from '@/lib/session';
import { CreditCard, LogOut, Settings, Share2, ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../global.css';

export default function ProfileScreen() {
  const { user, signOut } = useSession();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5">
        <View className="mt-8 mb-6 flex-row justify-between items-start">
           <View>
              <Text className="text-text-primary text-3xl font-bold">Profile</Text>
           </View>
           <Button variant="ghost" icon={<Settings size={24} color="#A1A1AA" />} title="" className="p-2" />
        </View>

        {/* User Info */}
        <View className="items-center mb-8">
            <View className="w-24 h-24 bg-card rounded-full items-center justify-center mb-4 border border-primary/20">
               <Text className="text-primary text-3xl font-bold">
                 {user?.username?.charAt(0).toUpperCase() || 'U'}
               </Text>
            </View>
            <Text className="text-text-primary text-xl font-bold">
              {user?.full_name || user?.username || 'User'}
            </Text>
            <Text className="text-text-secondary">
              @{user?.username || 'username'}
            </Text>
        </View>

        {/* Stats */}
        <View className="flex-row gap-4 mb-8">
            <Card className="flex-1 items-center p-4">
                <Text className="text-text-secondary text-xs font-medium mb-1">TRUST SCORE</Text>
                <Text className="text-primary text-2xl font-bold">724</Text>
            </Card>
            <Card className="flex-1 items-center p-4">
                <Text className="text-text-secondary text-xs font-medium mb-1">LOANS</Text>
                <Text className="text-text-primary text-2xl font-bold">12</Text>
            </Card>
            <Card className="flex-1 items-center p-4">
                <Text className="text-text-secondary text-xs font-medium mb-1">ON TIME</Text>
                <Text className="text-success text-2xl font-bold">98%</Text>
            </Card>
        </View>

        {/* Menu */}
        <View className="gap-3">
            <Button 
                variant="secondary" 
                title="Export Reputation Report" 
                icon={<Share2 size={20} color="#FFFFFF" />}
                className="w-full"
            />
            
            <Card className="flex-row items-center p-4" variant="outlined">
                <CreditCard size={24} color="#E8B017" />
                <Text className="text-text-primary font-medium ml-4 flex-1">Payment Methods</Text>
            </Card>

            <Card className="flex-row items-center p-4" variant="outlined">
                <ShieldCheck size={24} color="#E8B017" />
                <Text className="text-text-primary font-medium ml-4 flex-1">Security & Privacy</Text>
            </Card>

            <Button 
                variant="ghost" 
                title="Sign Out" 
                className="mt-4"
                onPress={signOut}
                icon={<LogOut size={20} color="#EF4444" />}
            />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
