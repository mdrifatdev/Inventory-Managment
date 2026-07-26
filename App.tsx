import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LayoutDashboard, Package, History, User, Plus } from 'lucide-react-native';
import { getSupabaseClient } from './src/lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useProducts } from './src/hooks/useProducts';
import { Colors, Spacing } from './src/constants/theme';
import { logger } from './src/lib/logger';

// Native Pages
import DashboardNative from './src/pages/Dashboard.native';
import ProductsNative from './src/pages/Products.native';
import HistoryNative from './src/pages/History.native';
import AuthPanelNative from './src/components/AuthPanel.native';
import AddProduct from './src/pages/AddProduct';
import EditProduct from './src/pages/EditProduct';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

interface TabNavigatorProps {
  navigation: any;
  sessionUser: SupabaseUser | null;
  products: any[];
  logs: any[];
  updateProduct: any;
  deleteProduct: any;
}

function TabNavigator({
  navigation,
  sessionUser,
  products,
  logs,
  updateProduct,
  deleteProduct,
}: TabNavigatorProps) {
  return (
    <View style={styles.flex}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textTertiary,
          tabBarStyle: {
            height: 70,
            paddingBottom: Spacing.md,
            paddingTop: Spacing.sm,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            backgroundColor: Colors.surface,
            elevation: 0,
            shadowOpacity: 0,
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
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      deleteProduct(id)
                        .then(() => logger.info('Product deleted'))
                        .catch((err) => logger.error('Delete failed', err));
                    },
                  },
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
        style={styles.fab}
      >
        <Plus color={Colors.textInverse} size={24} />
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  const [sessionUser, setSessionUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { products, logs, loading: productsLoading, addProduct, updateProduct, deleteProduct, error } = useProducts();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      try {
        const supabase = await getSupabaseClient();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          setSessionUser(session?.user ?? null);

          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSessionUser(session?.user ?? null);
          });
          unsubscribe = () => subscription.unsubscribe();
        }
      } catch (err) {
        logger.error('Auth initialization failed', err);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (authLoading || (productsLoading && products.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Electric Inventory</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
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
                try {
                  await addProduct(p);
                  props.navigation.goBack();
                } catch (err) {
                  logger.error('Failed to add product', err);
                  Alert.alert('Error', 'Failed to add product. Please try again.');
                }
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
                try {
                  await updateProduct(p as any);
                  props.navigation.goBack();
                } catch (err) {
                  logger.error('Failed to update product', err);
                  Alert.alert('Error', 'Failed to update product. Please try again.');
                }
              }}
              onCancel={() => props.navigation.goBack()}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.pageBg,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 2,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorLight,
    paddingHorizontal: Spacing.lg,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
