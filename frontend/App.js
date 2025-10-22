import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// ⚠️ React DOM checks for multiple React copies
require('react-dom');
window.React2 = require('react');
console.log("Are React copies the same?", window.React1 === window.React2);

// Import contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Import screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ChannelScreen from './screens/ChannelScreen';
import ProfileScreen from './screens/ProfileScreen';
import ConferencingScreen from './screens/ConferencingScreen';
import VideoCallScreen from './screens/VideoCallScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Channels') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Conferencing') iconName = focused ? 'videocam' : 'videocam-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Channels" component={ChannelScreen} />
      <Tab.Screen name="Conferencing" component={ConferencingScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <ActivityIndicator size="large" color="#FFFFFF" />
      <Text style={styles.splashText}>Loading Connecta...</Text>
    </View>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="VideoCall" component={VideoCallScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F1',
  },
  splashText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
});
