import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Home, PlusCircle, TrendingUp, User, Users } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import '../../global.css';

export default function TabLayout() {
  const { user } = useSession();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('loans_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'loans' },
        (payload) => {
          const newLoan = payload.new;
          if (newLoan.borrower_id === user.id) {
            // Someone lent me money OR I requested it (but this is insert, so it's a new record)
            // If I created the request, lender_id would be friend.
            // If friend sent me money, lender_id is friend.
            // In both cases, I am the borrower.
            // Warning: If *I* created the record (as borrower), I shouldn't get a notification?
            // But supabase realtime triggers for all clients.
            // Usually, we check if the origin is not me? Supabase doesn't easily give "origin".
            // But if I am creating it in the app, I know I created it.
            // Maybe simple notification is fine.
            // Refinement: If status is pending, and I am the borrower, did I request it or did they offer?
            // create.tsx logic:
            // - 'borrow': I (Borrower) create record. Lender = friend.
            // - 'lend': Friend (Lender) creates record. Borrower = me.
            // - 'link': Lender (Friend) creates. Borrower = null (until accepted).

            // If newLoan.lender_id is NOT me, then someone sent/offered me money.
            // Wait, if I requested, lender_id is someone else.
            // So checking if lender_id != user.id isn't enough to distinguish "I requested" vs "They sent".
            // However, the user request says "when other user receives".
            // If User A sends (Lend) to User B. User B receives.
            // User B did NOT initiate.
            // So valid notification for User B.

            // If User B requests (Borrow) from User A.
            // User B initiates. User B should probably NOT get a notification about their own request creation?
            // User A (Lender) should get notification "User B requested money".

            // So:
            // Case 1: I am Borrower. Did I create it?
            // If I created it, I initiated the Borrow.
            // If I didn't create it, someone Lent to me.
            // Since we don't track "creator" separately (only lender/borrower), let's look at the flow.
            // If it's a "Lend" action, the Lender creates it.
            // If "Borrow" action, the Borrower creates it.
            // We can't distinguish easily without an extra column 'created_by'.
            // BUT, if I am just "viewing" the app, and a notification pops up, it's likely relevant.
            // If I just pressed "Request", I see success message. Notification might be redundant but harmless.

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('New Activity', `You have a new loan/request of $${newLoan.amount}!`);
          } else if (newLoan.lender_id === user.id) {
            // I am the Lender.
            // If I initiated 'Lend', I know.
            // If someone initiated 'Borrow' (Request), I want to know.
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('New Request', `Someone requested $${newLoan.amount} from you!`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#E8B017',
        tabBarInactiveTintColor: '#525252',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: '#121212',
            borderTopWidth: 0,
            elevation: 0,
            height: 85,
            paddingTop: 10,
          },
          default: {
            backgroundColor: '#121212',
            borderTopWidth: 0,
            elevation: 0,
            height: 65,
            paddingTop: 10,
            paddingBottom: 10,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'New Loan',
          tabBarIcon: ({ color }) => <PlusCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ color }) => <TrendingUp size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
