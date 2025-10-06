// frontend/screens/ProfileScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import {
  Card,
  Title,
  Button,
  Avatar,
  List,
  Divider
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text 
            size={80} 
            label={user?.name?.substring(0, 2).toUpperCase() || 'UU'} 
            style={styles.avatar}
          />
          <Title style={styles.userName}>{user?.name}</Title>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userDepartment}>{user?.department}</Text>
          {user?.title && (
            <Text style={styles.userTitle}>{user?.title}</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Account Settings</Title>
          <List.Item
            title="Edit Profile"
            description="Update your personal information"
            left={props => <List.Icon {...props} icon={() => <Ionicons name="person" size={24} color="#6366F1" />} />}
            onPress={() => Alert.alert('Edit Profile', 'Profile editing functionality')}
          />
          <Divider />
          <List.Item
            title="Notification Settings"
            description="Manage your notification preferences"
            left={props => <List.Icon {...props} icon={() => <Ionicons name="notifications" size={24} color="#6366F1" />} />}
            onPress={() => Alert.alert('Notifications', 'Notification settings functionality')}
          />
          <Divider />
          <List.Item
            title="Security"
            description="Two-factor authentication and security settings"
            left={props => <List.Icon {...props} icon={() => <Ionicons name="shield" size={24} color="#6366F1" />} />}
            onPress={() => Alert.alert('Security', 'Security settings functionality')}
          />
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>App Settings</Title>
          <List.Item
            title="Theme"
            description="Dark mode and appearance settings"
            left={props => <List.Icon {...props} icon={() => <Ionicons name="color-palette" size={24} color="#6366F1" />} />}
            onPress={() => Alert.alert('Theme', 'Theme settings functionality')}
          />
          <Divider />
          <List.Item
            title="Language"
            description="App language preferences"
            left={props => <List.Icon {...props} icon={() => <Ionicons name="language" size={24} color="#6366F1" />} />}
            onPress={() => Alert.alert('Language', 'Language settings functionality')}
          />
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Support</Title>
          <List.Item
            title="Help & Support"
            description="Get help and contact support"
            left={props => <List.Icon {...props} icon={() => <Ionicons name="help-circle" size={24} color="#6366F1" />} />}
            onPress={() => Alert.alert('Help', 'Help and support functionality')}
          />
          <Divider />
          <List.Item
            title="About Connecta"
            description="App version and information"
            left={props => <List.Icon {...props} icon={() => <Ionicons name="information" size={24} color="#6366F1" />} />}
            onPress={() => Alert.alert('About', `Connecta v1.0.0\nOrganization Communication Platform`)}
          />
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        textColor="#DC2626"
      >
        Logout
      </Button>

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    elevation: 2,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    backgroundColor: '#6366F1',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 2,
  },
  userDepartment: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
    marginBottom: 2,
  },
  userTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  logoutButton: {
    borderColor: '#DC2626',
    marginTop: 8,
  },
  footer: {
    height: 20,
  },
});

export default ProfileScreen;