import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Avatar,
  ActivityIndicator
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { login, register } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    let result;

    if (isSignUp) {
      result = await register({ email, password });
    } else {
      result = await login(email, password);
    }

    setLoading(false);

    if (result.success) {
      navigation.replace('Main'); // Change this to your main tab/screen
    } else {
      Alert.alert('Authentication Failed', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.logoContainer}>
              <Avatar.Icon size={80} icon="chat" style={styles.logo} />
              <Title style={styles.title}>Connecta</Title>
              <Text style={styles.subtitle}>
                {isSignUp ? 'Create your account' : 'Welcome back!'}
              </Text>
            </View>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={loading}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
              disabled={loading}
            />

            {loading ? (
              <ActivityIndicator size="large" color="#6366F1" style={styles.loader} />
            ) : (
              <Button
                mode="contained"
                onPress={handleAuth}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            )}

            <Button
              mode="text"
              onPress={() => setIsSignUp(!isSignUp)}
              style={styles.switchButton}
              disabled={loading}
            >
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"
              }
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              mode="outlined"
              icon={() => <Ionicons name="logo-google" size={20} color="#6366F1" />}
              onPress={() => Alert.alert('Google OAuth', 'Google login would be implemented here')}
              style={styles.oauthButton}
              disabled={loading}
            >
              Continue with Google
            </Button>

            {Platform.OS === 'ios' && (
              <Button
                mode="outlined"
                icon={() => <Ionicons name="logo-apple" size={20} color="#6366F1" />}
                onPress={() => Alert.alert('Apple OAuth', 'Apple login would be implemented here')}
                style={styles.oauthButton}
                disabled={loading}
              >
                Continue with Apple
              </Button>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6366F1' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { elevation: 8, borderRadius: 16, backgroundColor: 'white' },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logo: { backgroundColor: '#6366F1', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#374151', textAlign: 'center' },
  subtitle: { color: '#6B7280', textAlign: 'center', marginTop: 8 },
  input: { marginBottom: 16, backgroundColor: 'white' },
  button: { marginTop: 8, borderRadius: 8, elevation: 2 },
  buttonContent: { paddingVertical: 8 },
  loader: { marginVertical: 16 },
  switchButton: { marginTop: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 16, color: '#6B7280', fontWeight: '500' },
  oauthButton: { marginBottom: 12, borderColor: '#E5E7EB' },
});

export default LoginScreen;
