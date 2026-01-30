import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { Clock, UserCheck, UserPlus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../global.css';

import { useSession } from '@/lib/session';

type Friend = {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  friendship_id: string;
  status: 'pending' | 'accepted';
  is_sender: boolean;
};

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const { user: currentUser } = useSession();

  useEffect(() => {
    fetchUserAndFriends();
  }, [currentUser]);

  async function fetchUserAndFriends() {
    try {
      setLoading(true);
      if (!currentUser) return;

      // Fetch friends where I am user_id OR friend_id
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          user_id,
          friend_id,
          inviter:user_id(id, username, full_name, avatar_url),
          invitee:friend_id(id, username, full_name, avatar_url)
        `)
        .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`);

      if (error) {
        console.error('Error fetching friends:', error);
        throw error;
      }

      if (!data) {
        setFriends([]);
        return;
      }

      const formattedFriends: Friend[] = data.map((item: any) => {
        // Safe check for missing relations if DB is inconsistent
        if (!item.inviter || !item.invitee) {
          console.warn('Inconsistent friend data:', item);
          return null;
        }
        const isSender = item.user_id === currentUser.id;
        const profile = isSender ? item.invitee : item.inviter;
        return {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          friendship_id: item.id,
          status: item.status,
          is_sender: isSender
        };
      }).filter(Boolean) as Friend[]; // Filter out nulls

      setFriends(formattedFriends);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendFriendRequest() {
    if (!searchUsername) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }
    try {
      setLoading(true);
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in');
        return;
      }

      // 1. Find user by username
      const { data: users, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', searchUsername)
        .limit(1);

      if (searchError || !users || users.length === 0) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const friendId = users[0].id;
      if (friendId === currentUser.id) {
        Alert.alert('Error', 'You cannot add yourself');
        return;
      }

      // 2. Check if request already exists (handled by unique constraint but good to check UI side or catch error)
      const { error: insertError } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUser.id,
          friend_id: friendId,
          status: 'pending'
        });

      if (insertError) {
        if (insertError.message.includes('duplicate key')) {
          Alert.alert('Info', 'Friend request already sent or exists');
        } else {
          throw insertError;
        }
      } else {
        Alert.alert('Success', 'Friend request sent!');
        setSearchUsername('');
        fetchUserAndFriends();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResponse(friendshipId: string, accept: boolean) {
    try {
      if (accept) {
        const { error } = await supabase
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('id', friendshipId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('friendships')
          .delete()
          .eq('id', friendshipId);
        if (error) throw error;
      }
      fetchUserAndFriends();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  const pendingRequests = friends.filter(f => f.status === 'pending' && !f.is_sender);
  const sentRequests = friends.filter(f => f.status === 'pending' && f.is_sender);
  const acceptedFriends = friends.filter(f => f.status === 'accepted');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5">
        <View className="mt-8 mb-6">
          <Text className="text-text-primary text-2xl font-bold">Friends</Text>
          <Text className="text-text-secondary mt-1">Manage your connections</Text>
        </View>

        {/* Add Friend */}
        <Card className="mb-6 p-4">
          <Text className="text-text-primary font-medium mb-3">Add Friend</Text>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                placeholder="Username"
                value={searchUsername}
                onChangeText={setSearchUsername}
                autoCapitalize="none"
              />
            </View>
            <Button
              title="Add"
              onPress={sendFriendRequest}
              loading={loading}
              icon={<UserPlus size={18} color="white" />}
            />
          </View>
        </Card>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <View className="mb-6">
            <Text className="text-text-secondary text-sm font-medium mb-3 uppercase">Requests</Text>
            {pendingRequests.map(friend => (
              <Card key={friend.friendship_id} className="mb-3 p-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-text-primary font-bold">{friend.full_name || friend.username}</Text>
                  <Text className="text-text-secondary text-xs">@{friend.username}</Text>
                </View>
                <View className="flex-row gap-2">
                  <Button
                    title="Accept"
                    size="sm"
                    onPress={() => handleResponse(friend.friendship_id, true)}
                  />
                  <Button
                    title="Decline"
                    variant="ghost"
                    size="sm"
                    onPress={() => handleResponse(friend.friendship_id, false)}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Sent Requests (Optional, nice to have) */}
        {sentRequests.length > 0 && (
          <View className="mb-6">
            <Text className="text-text-secondary text-sm font-medium mb-3 uppercase">Sent</Text>
            {sentRequests.map(friend => (
              <Card key={friend.friendship_id} className="mb-3 p-4 flex-row items-center justify-between opacity-70">
                <View>
                  <Text className="text-text-primary font-medium">{friend.full_name || friend.username}</Text>
                  <Text className="text-text-secondary text-xs">@{friend.username}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Clock size={16} color="#A1A1AA" />
                  <Text className="text-text-secondary text-xs">Pending</Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Friends List */}
        <View>
          <Text className="text-text-secondary text-sm font-medium mb-3 uppercase">My Friends ({acceptedFriends.length})</Text>
          {acceptedFriends.length === 0 ? (
            <Text className="text-text-secondary italic">No friends yet. Add someone!</Text>
          ) : (
            acceptedFriends.map(friend => (
              <Card key={friend.friendship_id} className="mb-3 p-4 flex-row items-center">
                <View className="w-10 h-10 bg-surface rounded-full items-center justify-center mr-3 border border-border">
                  <Text className="text-text-primary font-bold">{friend.username.charAt(0).toUpperCase()}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary font-bold">{friend.full_name || friend.username}</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-text-secondary text-xs">@{friend.username}</Text>
                    <View className="bg-surface px-2 py-0.5 rounded flex-row items-center">
                      <Text className="text-yellow-500 text-[10px] mr-1">★</Text>
                      <Text className="text-text-primary text-[10px] font-bold">724</Text>
                      {/* TODO: Fetch real trust score */}
                    </View>
                  </View>
                </View>
                <UserCheck size={20} color="#22C55E" />
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
