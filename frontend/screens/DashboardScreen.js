// frontend/screens/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  Avatar,
  Chip,
  ActivityIndicator
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { isConnected, listenToEvent } = useSocket();
  const [channels, setChannels] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    const unsubscribe = listenToEvent('new-message', (message) => {
      setRecentMessages(prev => [message, ...prev.slice(0, 4)]);
    });

    return unsubscribe;
  }, []);

  const loadDashboardData = async () => {
    try {
      const mockChannels = [
        { _id: 'c1', name: 'General', description: 'Main chat', members: [{id: 1}, {id: 2}], isPrivate: false },
        { _id: 'c2', name: 'Project Alpha', description: 'Feature planning', members: [{id: 1}], isPrivate: true },
      ];

      const mockMessages = [
        { 
          _id: 'm1', 
          content: 'Team, please check the Alpha Project status update by 3 PM today.', 
          sender: { name: 'Jane Doe' }, 
          priority: 'urgent', 
          aiSummary: 'Action required: Review Alpha status by 3 PM.' 
        },
        { 
          _id: 'm2', 
          content: 'Did anyone see the latest documentation updates?', 
          sender: { name: 'John Smith' }, 
          priority: 'medium', 
          aiSummary: null 
        },
      ];

      const mockMeetings = [
        { 
          _id: 'meet1', 
          title: 'Weekly Standup', 
          startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() 
        },
      ];

      setChannels(mockChannels);
      setRecentMessages(mockMessages);
      setUpcomingMeetings(mockMeetings);
    } catch (error) {
      console.error('Dashboard data loading failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#FEF2F2',
      high: '#FFFBEB',
      medium: '#F0F9FF',
      low: '#F0FDF4'
    };
    return colors[priority] || '#F0F9FF';
  };

  const renderChannelItem = ({ item }) => (
    <Card 
      style={styles.channelCard}
      onPress={() => navigation.navigate('Channels', { 
        screen: 'ChannelChat', 
        params: { channelId: item._id, channelName: item.name }
      })}
    >
      <Card.Content>
        <View style={styles.channelHeader}>
          <Avatar.Text 
            size={40} 
            label={item.name.substring(0, 2).toUpperCase()} 
          />
          <View style={styles.channelInfo}>
            <Title style={styles.channelName}>{item.name}</Title>
            <Text style={styles.channelMembers}>
              {item.members.length} members
            </Text>
          </View>
          {item.isPrivate && (
            <Chip icon="lock" style={styles.privateChip}>Private</Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderMessageItem = ({ item }) => (
    <Card style={styles.messageCard}>
      <Card.Content>
        <View style={styles.messageHeader}>
          <Avatar.Text 
            size={32} 
            label={item.sender.name.substring(0, 2).toUpperCase()} 
          />
          <View style={styles.messageInfo}>
            <Text style={styles.senderName}>{item.sender.name}</Text>
            <Text style={styles.messageContent} numberOfLines={2}>
              {item.content}
            </Text>
          </View>
          <Chip 
            mode="outlined" 
            size="small"
            style={[styles.priorityChip, { backgroundColor: getPriorityColor(item.priority) }]}
          >
            {item.priority}
          </Chip>
        </View>
        {item.aiSummary && (
          <Text style={styles.aiSummary}>🤖 {item.aiSummary}</Text>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <View style={styles.welcomeHeader}>
            <View>
              <Title style={styles.welcomeTitle}>
                Hello, {user?.name}! 👋
              </Title>
              <Text style={styles.welcomeSubtitle}>
                Here's what's happening today
              </Text>
            </View>
            <Avatar.Text 
              size={50} 
              label={user?.name?.substring(0, 2).toUpperCase() || 'UU'} 
            />
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{channels.length}</Text>
              <Text style={styles.statLabel}>Channels</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{recentMessages.length}</Text>
              <Text style={styles.statLabel}>New Messages</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{upcomingMeetings.length}</Text>
              <Text style={styles.statLabel}>Meetings</Text>
            </View>
          </View>
          {!isConnected && (
            <Text style={styles.connectionWarning}>
              ⚠️ Limited functionality - No network connection
            </Text>
          )}
        </Card.Content>
      </Card>

      <View style={styles.quickActions}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => navigation.navigate('CreateChannel')}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          New Channel
        </Button>
        <Button
          mode="outlined"
          icon="video"
          onPress={() => navigation.navigate('Conferencing')}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          Start Meeting
        </Button>
      </View>

      <Title style={styles.sectionTitle}>Recent Messages</Title>
      <FlatList
        data={recentMessages}
        renderItem={renderMessageItem}
        keyExtractor={item => item._id}
        scrollEnabled={false}
      />

      <Title style={styles.sectionTitle}>Your Channels</Title>
      <FlatList
        data={channels.slice(0, 5)}
        renderItem={renderChannelItem}
        keyExtractor={item => item._id}
        scrollEnabled={false}
      />

      {upcomingMeetings.length > 0 && (
        <>
          <Title style={styles.sectionTitle}>Upcoming Meetings</Title>
          {upcomingMeetings.map(meeting => (
            <Card key={meeting._id} style={styles.meetingCard}>
              <Card.Content>
                <Text style={styles.meetingTitle}>{meeting.title}</Text>
                <Text style={styles.meetingTime}>
                  {new Date(meeting.startTime).toLocaleString()}
                </Text>
                <Button
                  mode="contained"
                  compact
                  onPress={() => navigation.navigate('Conferencing', { meetingId: meeting._id })}
                  disabled={!isConnected}
                >
                  Join Meeting
                </Button>
              </Card.Content>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  welcomeCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  connectionWarning: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  actionButtonContent: {
    paddingVertical: 6,
  },
  sectionTitle: {
    marginVertical: 16,
    color: '#374151',
  },
  channelCard: {
    marginBottom: 8,
    elevation: 1,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelInfo: {
    flex: 1,
    marginLeft: 12,
  },
  channelName: {
    fontSize: 16,
    marginBottom: 0,
  },
  channelMembers: {
    fontSize: 12,
    color: '#6B7280',
  },
  privateChip: {
    marginLeft: 'auto',
  },
  messageCard: {
    marginBottom: 8,
    elevation: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageInfo: {
    flex: 1,
    marginLeft: 12,
  },
  senderName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  messageContent: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  priorityChip: {
    marginLeft: 'auto',
  },
  aiSummary: {
    fontSize: 11,
    color: '#059669',
    fontStyle: 'italic',
    marginTop: 8,
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 4,
  },
  meetingCard: {
    marginBottom: 8,
    elevation: 1,
  },
  meetingTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  meetingTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
});

export default DashboardScreen;