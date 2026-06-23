import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { bookingAPI } from '../api/booking.api';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Vibration } from 'react-native';
import { useSelector } from 'react-redux';
import { showMessage } from 'react-native-flash-message';
import { COLORS, FONT_SIZES } from '../theme/typography';

// Auth screens
import SplashScreen   from '../screens/auth/SplashScreen';
import LoginScreen    from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Customer screens
import HomeScreen          from '../screens/customer/HomeScreen';
import ProviderDetailScreen from '../screens/customer/ProviderDetailScreen';
import BookingDetailScreen from '../screens/customer/BookingDetailScreen';
import BookingTrackScreen  from '../screens/customer/BookingTrackScreen';
import ReviewScreen        from '../screens/customer/ReviewScreen';
import CreateBookingScreen from '../screens/customer/CreateBookingScreen';
import MyBookingsScreen    from '../screens/customer/MyBookingsScreen';
import ProfileScreen       from '../screens/customer/ProfileScreen';
import NotificationsScreen from '../screens/customer/NotificationsScreen';
import PaymentScreen       from '../screens/customer/PaymentScreen';
import SavedAddressesScreen from '../screens/customer/SavedAddressesScreen';
import EditProfileScreen    from '../screens/customer/EditProfileScreen';
import ServiceOptionsScreen from '../screens/customer/ServiceOptionsScreen';
import BookingSummaryScreen from '../screens/customer/BookingSummaryScreen';

import { socketService } from '../services/socket.service';
import { notificationService } from '../services/notification.service';
import ChatScreen from '../screens/customer/ChatScreen';
import AllProvidersScreen from '../screens/customer/AllProvidersScreen';
import NotificationScreen from '../screens/common/NotificationScreen';

// Provider screens
import DashboardScreen       from '../screens/provider/DashboardScreen';
import ProviderProfileScreen from '../screens/provider/ProviderProfileScreen';
import RequestScreen         from '../screens/provider/RequestsScreen';
import EarningsScreen        from '../screens/provider/EarningsScreen';
import ProviderBookingDetailScreen from '../screens/provider/ProviderBookingDetailScreen';
import ProviderBookingsHistoryScreen from '../screens/provider/ProviderBookingsHistoryScreen';
import EditProviderProfileScreen from '../screens/provider/EditProviderProfileScreen';

// Placeholder for unbuilt screens
const PlaceholderScreen = ({ route }) => (
  <View style={styles.placeholder}>
    <Text style={styles.phIcon}>🚧</Text>
    <Text style={styles.phTitle}>{route.name}</Text>
    <Text style={styles.phSub}>Coming soon...</Text>
  </View>
);

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Customer Bottom Tabs ──────────────────────────────────────────────────
const CustomerTabs = () => {
  useEffect(() => {
    const handleNewMessage = (msg) => {
      showMessage({
        message: "New Message",
        description: `You received a message: ${msg?.message || 'New chat message'}`,
        type: "success",
        icon: "success",
        duration: 3000,
      });
      Vibration.vibrate(200);
    };

    const handleNewNotification = (notif) => {
      showMessage({
        message: notif?.title || "New Alert",
        description: notif?.message || "You have a new notification",
        type: "info",
        icon: "info",
        duration: 4000,
      });
      Vibration.vibrate([0, 500, 200, 500]);
    };

    socketService.on('newMessage', handleNewMessage);
    socketService.on('notification:new', handleNewNotification);
    return () => {
      socketService.off('newMessage', handleNewMessage);
      socketService.off('notification:new', handleNewNotification);
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
      tabBarActiveTintColor:   COLORS.primary,
      tabBarInactiveTintColor: COLORS.textTertiary,
      tabBarLabelStyle: styles.tabLabel,
      tabBarIcon: ({ focused }) => {
        const icons = {
          Home:          focused ? '🏠' : '🏡',
          MyBookings:    focused ? '📋' : '📄',
          Notifications: focused ? '🔔' : '🔕',
          Profile:       focused ? '👤' : '👥',
        };
        return <Text style={{ fontSize: 22 }}>{icons[route.name] || '📱'}</Text>;
      },
    })}
  >
    <Tab.Screen name="Home"          component={HomeScreen}          options={{ tabBarLabel: 'Home' }} />
    <Tab.Screen name="MyBookings"    component={MyBookingsScreen}    options={{ tabBarLabel: 'Bookings' }} />
    <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: 'Alerts' }} />
    <Tab.Screen name="Profile"       component={ProfileScreen}       options={{ tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
  );
};

// ── Provider Bottom Tabs ──────────────────────────────────────────────────
const ProviderTabs = () => {
  const [pendingCount, setPendingCount] = useState(0);

  const fetchCount = async () => {
    try {
      const res = await bookingAPI.getProviderBookings({ status: 'pending', page: 1, limit: 1 });
      setPendingCount(res.data.data?.pagination?.total || 0);
    } catch (e) {}
  };

  useFocusEffect(
    useCallback(() => {
      fetchCount();
      const interval = setInterval(fetchCount, 15000);
      return () => clearInterval(interval);
    }, [])
  );

  useEffect(() => {
    const handleNewBooking = () => {
      fetchCount();
      showMessage({
        message: "New Service Request!",
        description: "You have a new request waiting for you.",
        type: "info",
        icon: "info",
        duration: 4000,
      });
      Vibration.vibrate([0, 500, 200, 500]);
    };

    const handleNewMessage = (msg) => {
      showMessage({
        message: "New Message",
        description: `You received a message: ${msg?.message || 'New chat message'}`,
        type: "success",
        icon: "success",
        duration: 3000,
      });
      Vibration.vibrate(200);
    };
    
    socketService.on('booking:new', handleNewBooking);
    socketService.on('booking:status_update', fetchCount);
    socketService.on('newMessage', handleNewMessage);

    return () => {
      socketService.off('booking:new', handleNewBooking);
      socketService.off('booking:status_update', fetchCount);
      socketService.off('newMessage', handleNewMessage);
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          const icons = {
            Dashboard:       focused ? '📊' : '📈',
            Bookings:        focused ? '📋' : '📄',
            Requests:        focused ? '📥' : '📤',
            Earnings:        focused ? '💰' : '💵',
            ProviderProfile: focused ? '👤' : '👥',
          };
          return <Text style={{ fontSize: 22 }}>{icons[route.name] || '📱'}</Text>;
        },
      })}
    >
      <Tab.Screen name="Dashboard"       component={DashboardScreen}       options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Bookings"        component={ProviderBookingsHistoryScreen} options={{ tabBarLabel: 'Jobs' }} />
      <Tab.Screen 
        name="Requests"        
        component={RequestScreen}         
        options={{ 
          tabBarLabel: 'Requests',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined 
        }} 
      />
      <Tab.Screen name="Earnings"        component={EarningsScreen}        options={{ tabBarLabel: 'Earnings' }} />
      <Tab.Screen name="ProviderProfile" component={ProviderProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

// ── Root Navigator — watches Redux state automatically ────────────────────
const AppNavigator = () => {
  const { isLoggedIn, user, isInitialized, accessToken } = useSelector(s => s.auth);

  useEffect(() => {
    if (isLoggedIn && accessToken) {
      socketService.connect(accessToken);
      
      // Initialize Firebase notifications
      notificationService.requestUserPermission().then(granted => {
        if (granted) notificationService.setupListeners();
      });
    } else {
      socketService.disconnect();
      notificationService.removeListeners();
    }
    return () => {
      socketService.disconnect();
      notificationService.removeListeners();
    };
  }, [isLoggedIn, accessToken]);

  // ── Step 1: Show splash while checking AsyncStorage ──────────────────
  // isInitialized becomes true after loadStoredAuth completes in SplashScreen
  if (!isInitialized) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  // ── Step 2: Not logged in → show only Auth screens ────────────────────
  // KEY FIX: When logout sets isLoggedIn=false, this block renders immediately
  // The entire CustomerTabs/ProviderTabs are REMOVED from the stack
  // So there is NO old cached screen to show — Login appears instantly
  if (!isLoggedIn) {
    return (
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Login"    component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  // ── Step 3: Logged in as PROVIDER ─────────────────────────────────────
  if (user?.role === 'provider') {
    return (
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="ProviderTabs"  component={ProviderTabs} />
        <Stack.Screen name="BookingDetail" component={ProviderBookingDetailScreen} />
        <Stack.Screen name="EditProviderProfile" component={EditProviderProfileScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
      </Stack.Navigator>
    );
  }

  // ── Step 4: Logged in as CUSTOMER (default) ───────────────────────────
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="CustomerTabs"   component={CustomerTabs} />
      <Stack.Screen name="AllProviders"   component={AllProvidersScreen} />
      <Stack.Screen name="ProviderDetail" component={ProviderDetailScreen} />
      <Stack.Screen name="BookingDetail"  component={BookingDetailScreen} />
      <Stack.Screen name="BookingTrack"   component={BookingTrackScreen} />
      <Stack.Screen name="Review"         component={ReviewScreen} />
      <Stack.Screen name="CreateBooking"  component={CreateBookingScreen} />
      <Stack.Screen name="Payment"        component={PaymentScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="EditProfile"    component={EditProfileScreen} />
      <Stack.Screen name="ServiceOptions" component={ServiceOptionsScreen} />
      <Stack.Screen name="BookingSummary" component={BookingSummaryScreen} />
      <Stack.Screen name="Chat"           component={ChatScreen} />
      <Stack.Screen name="Notifications"  component={NotificationScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth:  1,
    borderTopColor:  COLORS.border,
    height:          62,
    paddingBottom:   8,
    paddingTop:      6,
  },
  tabLabel:    { fontSize: FONT_SIZES.xs, fontWeight: '500' },
  placeholder: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  phIcon:  { fontSize: 64, marginBottom: 16 },
  phTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.textPrimary },
  phSub:   { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: 8 },
});

export default AppNavigator;
