import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LayoutDashboard, Package, History, User, Plus } from 'lucide-react-native';
import { getSupabaseClient } from './src/lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useProducts } from './src/hooks/useProducts';

// Native Pages
import DashboardNative from './src/pages/Dashboard.native';
import ProductsNative from './src/pages/Products.native';
import HistoryNative from './src/pages/History.native';
import AuthPanelNative from './src/components/AuthPanel.native';
import AddProduct from './src/pages/AddProduct';
import EditProduct from './src/pages/EditProduct';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator({ navigation, sessionUser, products, logs, updateProduct, deleteProduct }: any) {
  return (
    <View className="flex-1">
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#64748b',
          tabBarStyle: {
            height: 70,
            paddingBottom: 15,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            backgroundColor: '#ffffff',
            elevation: 0,
            shadowOpacity: 0
          },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Dashboard"
          options={{
            tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={22} />,
          }}
        >
          {() => (
            <DashboardNative
              products={products}
              logs={logs}
              onViewChange={(view) => navigation.navigate(view)}
              onFilterLowStock={() => navigation.navigate('Products')}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="Products"
          options={{
            tabBarIcon: ({ color }) => <Package color={color} size={22} />,
          }}
        >
          {() => (
            <ProductsNative
              products={products}
              onEdit={(p) => navigation.navigate('EditProduct', { product: p })}
              onDelete={(id) => {
                Alert.alert('Delete Item', 'Are you sure you want to remove this product?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteProduct(id) }
                ]);
              }}
              onUpdateQuantity={updateProduct}
              onShowHistory={(p) => navigation.navigate('History')}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="History"
          options={{
            tabBarIcon: ({ color }) => <History color={color} size={22} />,
          }}
        >
          {() => <HistoryNative logs={logs} />}
        </Tab.Screen>
        <Tab.Screen
          name="Account"
          options={{
            tabBarIcon: ({ color }) => <User color={color} size={22} />,
          }}
        >
          {() => (
            <AuthPanelNative
              sessionUser={sessionUser}
              isDarkMode={false}
              onToggleDarkMode={() => {}}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('AddProduct')}
        activeOpacity={0.9}
        className="absolute bottom-24 right-6 h-14 w-14 rounded-full bg-brand items-center justify-center shadow-lg shadow-brand/40"
      >
        <Plus color="white" size={24} />
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  const [sessionUser, setSessionUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const { products, logs, loading: productsLoading, addProduct, updateProduct, deleteProduct } = useProducts();

  useEffect(() => {
    const initAuth = async () => {
      const supabase = await getSupabaseClient();
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        setSessionUser(session?.user ?? null);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSessionUser(session?.user ?? null);
        });
        setAuthLoading(false);
        return () => subscription.unsubscribe();
      }
      setAuthLoading(false);
    };
    initAuth();
  }, []);

  if (authLoading || (productsLoading && products.length === 0)) {
    return (
      <View className="flex-1 items-center justify-center bg-pagebg">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-text-secondary font-bold text-xs uppercase tracking-widest">Electric Inventory</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs">
          {(props) => (
            <TabNavigator
              {...props}
              sessionUser={sessionUser}
              products={products}
              logs={logs}
              updateProduct={updateProduct}
              deleteProduct={deleteProduct}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="AddProduct">
          {(props) => (
            <AddProduct
              onSave={async (p) => {
                await addProduct(p);
                props.navigation.goBack();
              }}
              onCancel={() => props.navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="EditProduct">
          {(props: any) => (
            <EditProduct
              product={props.route.params.product}
              onSave={async (p) => {
                // Here we'd need to calculate diff etc. like in old App.tsx
                // For now, simple update
                await updateProduct(p as any);
                props.navigation.goBack();
              }}
              onCancel={() => props.navigation.goBack()}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
