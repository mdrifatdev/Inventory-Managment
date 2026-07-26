import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import { User, Mail, Lock, LogOut, LogIn, UserPlus, ShieldAlert, Zap, Sun, Moon, Wifi, WifiOff, Eye, EyeOff } from 'lucide-react-native';
import { getSupabaseClient } from '../lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NativeInput from './native/NativeInput';
import NativeButton from './native/NativeButton';

interface AuthPanelProps {
  sessionUser: SupabaseUser | null;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function AuthPanelNative({
  sessionUser,
  isDarkMode,
  onToggleDarkMode,
}: AuthPanelProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForceOffline, setIsForceOffline] = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem('force_offline').then(val => setIsForceOffline(val === 'true'));
  }, []);

  const handleSubmit = async () => {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      Alert.alert('Configuration Error', 'Supabase is not configured properly.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        if (data.user && data.session === null) {
          Alert.alert('Account Created', 'Please check your email for verification.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
      }
    } catch (err: any) {
      Alert.alert('Auth Failed', err.message || 'Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  const toggleOffline = async () => {
    const newVal = !isForceOffline;
    await AsyncStorage.setItem('force_offline', newVal.toString());
    setIsForceOffline(newVal);
    // In a real app, we'd trigger a global reload or state update
  };

  return (
    <ScrollView className="flex-1 bg-pagebg px-5 pt-10 pb-20">
      <View className="mb-8">
        <Text className="text-2xl font-black text-gray-900 tracking-tight">
          {isForceOffline ? 'Offline Mode' : sessionUser ? 'Your Account' : 'Welcome Back'}
        </Text>
        <Text className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
          Electric Inventory Manager
        </Text>
      </View>

      {isForceOffline ? (
        <View className="bg-orange-50 border border-orange-100 rounded-3xl p-6 items-center">
          <View className="h-16 w-16 bg-white rounded-full items-center justify-center shadow-sm mb-4">
            <WifiOff size={32} color="#f97316" />
          </View>
          <Text className="text-lg font-bold text-orange-700">Running Locally</Text>
          <Text className="text-xs text-orange-600/80 text-center mt-2 leading-relaxed">
            Cloud synchronization is disabled. Your data is being stored only on this device.
          </Text>
          <NativeButton
            title="Enable Cloud Sync"
            onPress={toggleOffline}
            className="mt-6 w-full bg-orange-500"
          />
        </View>
      ) : sessionUser ? (
        <View className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
          <View className="bg-brand/5 p-8 items-center border-b border-gray-50">
            <View className="h-20 w-20 bg-white rounded-full items-center justify-center shadow-md">
              <User size={40} color="#3b82f6" />
            </View>
            <Text className="text-sm font-bold text-gray-900 mt-4">{sessionUser.email}</Text>
            <View className="bg-green-100 px-3 py-1 rounded-full mt-2 flex-row items-center gap-1">
              <View className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <Text className="text-[10px] font-black text-green-600 uppercase">Authenticated</Text>
            </View>
          </View>

          <View className="p-6 space-y-4">
            <View className="flex-row justify-between items-center py-2 border-b border-gray-50">
              <Text className="text-xs text-gray-400 font-bold uppercase">Status</Text>
              <View className="flex-row items-center gap-1.5">
                <Wifi size={14} color="#10b981" />
                <Text className="text-xs font-bold text-green-600">Online</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onToggleDarkMode}
              className="flex-row justify-between items-center py-2 border-b border-gray-50"
            >
              <Text className="text-xs text-gray-400 font-bold uppercase">Appearance</Text>
              <View className="flex-row items-center gap-1.5">
                {isDarkMode ? <Moon size={14} color="#3b82f6" /> : <Sun size={14} color="#f59e0b" />}
                <Text className="text-xs font-bold text-gray-700">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</Text>
              </View>
            </TouchableOpacity>

            <NativeButton
              title="Sign Out"
              variant="danger"
              onPress={handleSignOut}
              loading={loading}
              className="mt-4"
            />
          </View>
        </View>
      ) : (
        <View className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <View className="flex-row bg-gray-50 p-1 rounded-xl mb-8">
            <TouchableOpacity
              onPress={() => setIsSignUp(false)}
              className={`flex-1 py-3 rounded-lg items-center ${!isSignUp ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-xs font-bold ${!isSignUp ? 'text-gray-900' : 'text-gray-400'}`}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsSignUp(true)}
              className={`flex-1 py-3 rounded-lg items-center ${isSignUp ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-xs font-bold ${isSignUp ? 'text-gray-900' : 'text-gray-400'}`}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            <NativeInput
              label="Email Address"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              icon={<Mail size={14} color="#94a3b8" />}
            />

            <View>
              <NativeInput
                label="Password"
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                icon={<Lock size={14} color="#94a3b8" />}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[34px]"
              >
                {showPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
              </TouchableOpacity>
            </View>

            <NativeButton
              title={isSignUp ? "Create Account" : "Sign In"}
              onPress={handleSubmit}
              loading={loading}
              className="mt-4"
            />

            <View className="flex-row items-center py-4">
              <View className="flex-1 h-[1px] bg-gray-100" />
              <Text className="mx-4 text-[10px] font-black text-gray-300 uppercase">Or</Text>
              <View className="flex-1 h-[1px] bg-gray-100" />
            </View>

            <NativeButton
              title="Continue Offline"
              variant="outline"
              onPress={toggleOffline}
              textClassName="text-gray-500"
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}
