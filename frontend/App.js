import React, { useState, useEffect } from 'react';

// --- MOCKING CORE REACT NATIVE COMPONENTS ---
// Since 'react-native' cannot be resolved in this environment,
// we define the basic components (View, Text, StyleSheet) as mocks.
const View = ({ style, children }) => <div style={style}>{children}</div>;
const Text = ({ style, children }) => <span style={style}>{children}</span>;

// Simple StyleSheet mock to handle component styles
const StyleSheet = {
    create: (styles) => {
        const platformStyles = {};
        for (const key in styles) {
            // Converts numeric values (like flex: 1) to strings for CSS compatibility
            platformStyles[key] = Object.fromEntries(
                Object.entries(styles[key]).map(([k, v]) => [k, typeof v === 'number' ? `${v}` : v])
            );
        }
        return platformStyles;
    },
};

// --- MOCK/PLACEHOLDER IMPORTS (In a real project, these would be external) ---

// Mocking Contexts
const AuthContext = React.createContext(null);
const SocketContext = React.createContext(null);

// Mocking Secure Storage (e.g., @expo/secure-store)
const SecureStore = {
  getItemAsync: async (key) => { 
    // Simulate retrieving a token if the app is run after a successful login
    return null; 
  },
  setItemAsync: async (key, value) => { console.log(`[SecureStore] Stored token for ${key}`); },
  deleteItemAsync: async (key) => { console.log(`[SecureStore] Deleted token for ${key}`); }
};

// Mocking HTTP Client (e.g., axios)
const axios = {
  get: async (url, config) => {
    // Simulate successful token validation and user data retrieval
    console.log(`[HTTP] Validating token at ${url}`);
    return { data: { id: 'user123', name: 'Test User', email: 'test@app.com', profilePicture: 'url' } };
  }
};

// Mocking Socket.IO Client (e.g., socket.io-client)
const io = (url, options) => {
  console.log(`[Socket] Initializing connection to ${url}`);
  return {
    on: (event, handler) => console.log(`[Socket] Listener set for: ${event}`),
    emit: (event, data) => console.log(`[Socket] Emitting: ${event}`),
    disconnect: () => console.log('[Socket] Disconnected'),
    connected: true
  };
};

// Mocking UI components and screens
const LoginScreen = () => <View style={styles.screenContainer}><Text>Login Screen</Text></View>;
const DashboardScreen = () => <View style={styles.screenContainer}><Text>Dashboard (Feeds/DMs)</Text></View>;
const ChannelScreen = () => <View style={styles.screenContainer}><Text>Channels List / Chat View</Text></View>;
const ProfileScreen = () => <View style={styles.screenContainer}><Text>Profile Settings</Text></View>;
const ConferencingScreen = () => <View style={styles.screenContainer}><Text>Video Conferencing</Text></View>;
const SplashScreen = () => (
    <View style={styles.splashContainer}>
        <Text style={styles.splashText}>Loading App...</Text>
    </View>
);
// Mocking the icon component (Ionicons)
const Ionicons = ({ name, size, color }) => <Text style={{ fontSize: size, color }}>[ {name} ]</Text>;
// Mocking react-native-paper Provider
const PaperProvider = ({ children }) => <View style={{ flex: 1 }}>{children}</View>;


// --- MOCK NAVIGATION IMPLEMENTATION ---

// Mock NavigationContainer
const NavigationContainer = ({ children }) => <View style={{ flex: 1 }}>{children}</View>;

// Mock createStackNavigator
const createStackNavigator = () => {
  return { 
    Navigator: ({ children, initialRouteName, screenOptions }) => <View style={{ flex: 1 }}>{children}</View>,
    Screen: ({ name, component, options }) => {
      const Comp = component;
      // In a mock, we only render a placeholder for the current screen, 
      // but we use the component prop to ensure it exists.
      return <View style={{ height: 0, width: 0 }}><Comp /></View>;
    }
  };
};

// Mock createBottomTabNavigator
const createBottomTabNavigator = () => {
  return {
    Navigator: ({ children, screenOptions }) => <View style={styles.tabView}>{children}</View>,
    Screen: ({ name, component }) => {
      const Comp = component;
      // Mock tab item visual representation
      const iconName = name === 'Dashboard' ? 'home' : name === 'Channels' ? 'chatbubbles' : name === 'Conferencing' ? 'videocam' : 'person';
      
      return (
        <View style={styles.tabItem}>
          <Ionicons name={iconName} size={24} color="#6366F1" />
          <Text style={styles.tabText}>{name}</Text>
          <View style={{ height: 0, width: 0 }}><Comp /></View>
        </View>
      );
    }
  };
};

// --- NAVIGATION SETUP ---

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      // screenOptions is primarily for defining the icon and style of the tab bar items
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Channels') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Conferencing') {
            iconName = focused ? 'videocam' : 'videocam-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366F1', // Indigo-500 for active tab
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

export default function App() {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');

      if (token) {
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUser(response.data);
        initializeSocket(token);
      }
    } catch (error) {
      console.error('Auth check failed. Clearing token if present.', error.message);
      await SecureStore.deleteItemAsync('userToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = (token) => {
    const socketUrl = 'http://localhost:5000'; 
    const newSocket = io(socketUrl, {
      auth: { token }
    });
    
    setSocket(newSocket);
  };

  const authContext = {
    user,
    login: (userData, token) => {
      setUser(userData);
      SecureStore.setItemAsync('userToken', token);
      initializeSocket(token);
    },
    logout: async () => {
      setUser(null);
      
      if (socket && socket.connected) {
          socket.disconnect();
      }
      setSocket(null);
      
      await SecureStore.deleteItemAsync('userToken');
    }
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <PaperProvider>
      <AuthContext.Provider value={authContext}>
        <SocketContext.Provider value={socket}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {user ? (
                // Authenticated User Flow
                <>
                    <Stack.Screen 
                    name="Main" 
                    component={TabNavigator} 
                    />
                    <Stack.Screen name="ChannelChat" component={ChannelScreen} />
                </>
              ) : (
                // Unauthenticated User Flow
                <Stack.Screen 
                  name="Login" 
                  component={LoginScreen}
                />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </SocketContext.Provider>
      </AuthContext.Provider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#f9f9f9' 
    },
    splashContainer: {
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#6366F1'
    },
    splashText: { 
        color: 'white', 
        fontSize: 24, 
        fontWeight: 'bold' 
    },
    tabView: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingBottom: 50, // Reserve space for where the actual tab bar would be
    },
    tabItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    tabText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333'
    }
});
