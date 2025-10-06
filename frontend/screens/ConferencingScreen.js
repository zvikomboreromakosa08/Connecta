// frontend/screens/ConferencingScreen.js
import React, { useState, useEffect } from 'react';
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
  IconButton,
  TextInput,
  Chip,
  ActivityIndicator
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const ConferencingScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [quickMeetingTitle, setQuickMeetingTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUpcomingMeetings();
  }, []);

  const loadUpcomingMeetings = async () => {
    setLoading(true);
    try {
      const mockMeetings = [
        {
          id: '1',
          title: 'Daily Standup',
          date: new Date(Date.now() + 3600000),
          participants: ['Alice', 'Bob', 'Charlie'],
          duration: 30,
          channel: 'general'
        },
        {
          id: '2', 
          title: 'Project Review',
          date: new Date(Date.now() + 86400000),
          participants: ['David', 'Eve'],
          duration: 60,
          channel: 'engineering'
        }
      ];
      setUpcomingMeetings(mockMeetings);
    } catch (error) {
      Alert.alert('Error', 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const startQuickMeeting = () => {
    if (!quickMeetingTitle.trim()) {
      Alert.alert('Error', 'Please enter a meeting title');
      return;
    }

    if (!isConnected) {
      Alert.alert('Connection Error', 'Please check your internet connection');
      return;
    }

    Alert.alert(
      'Start Meeting',
      `Start "${quickMeetingTitle}" meeting?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: () => {
            navigation.navigate('VideoCall', {
              meetingTitle: quickMeetingTitle,
              isInstant: true
            });
            setQuickMeetingTitle('');
          }
        }
      ]
    );
  };

  const scheduleMeeting = () => {
    navigation.navigate('ScheduleMeeting');
  };

  const joinMeeting = (meeting) => {
    if (!isConnected) {
      Alert.alert('Connection Error', 'Please check your internet connection');
      return;
    }

    navigation.navigate('VideoCall', {
      meetingId: meeting.id,
      meetingTitle: meeting.title
    });
  };

  const formatMeetingTime = (date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `in ${minutes}m`;
    } else {
      return 'now';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading meetings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.quickMeetingCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Start Instant Meeting</Title>
          <TextInput
            label="Meeting Title"
            value={quickMeetingTitle}
            onChangeText={setQuickMeetingTitle}
            mode="outlined"
            style={styles.input}
            placeholder="Enter meeting title..."
          />
          <View style={styles.quickMeetingActions}>
            <Button
              mode="contained"
              icon={() => <Ionicons name="videocam" size={20} color="#FFF" />}
              onPress={startQuickMeeting}
              style={styles.startButton}
              disabled={!quickMeetingTitle.trim() || !isConnected}
            >
              Start Meeting
            </Button>
            <Button
              mode="outlined"
              icon={() => <Ionicons name="calendar" size={20} color="#6366F1" />}
              onPress={scheduleMeeting}
              style={styles.scheduleButton}
            >
              Schedule
            </Button>
          </View>
          {!isConnected && (
            <Text style={styles.connectionWarning}>
              ⚠️ No network connection
            </Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.upcomingCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Upcoming Meetings</Title>
            <IconButton
              icon={() => <Ionicons name="refresh" size={20} color="#6366F1" />}
              size={20}
              onPress={loadUpcomingMeetings}
            />
          </View>

          {upcomingMeetings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No upcoming meetings</Text>
              <Text style={styles.emptyStateSubtext}>
                Schedule a meeting to get started
              </Text>
            </View>
          ) : (
            upcomingMeetings.map((meeting) => (
              <Card key={meeting.id} style={styles.meetingCard}>
                <Card.Content>
                  <View style={styles.meetingHeader}>
                    <View style={styles.meetingInfo}>
                      <Text style={styles.meetingTitle}>{meeting.title}</Text>
                      <Text style={styles.meetingTime}>
                        {meeting.date.toLocaleDateString()} •{' '}
                        {meeting.date.toLocaleTimeString([], {
                          hour: '2-digit', 
                          minute: '2-digit'
                        })}
                      </Text>
                      <Text style={styles.meetingDuration}>
                        {meeting.duration} minutes • {meeting.channel}
                      </Text>
                    </View>
                    <Chip mode="outlined" style={styles.timeChip}>
                      {formatMeetingTime(meeting.date)}
                    </Chip>
                  </View>

                  <View style={styles.participants}>
                    <Text style={styles.participantsLabel}>
                      Participants: {meeting.participants.join(', ')}
                    </Text>
                  </View>

                  <Button
                    mode="contained"
                    icon={() => <Ionicons name="videocam" size={20} color="#FFF" />}
                    onPress={() => joinMeeting(meeting)}
                    style={styles.joinButton}
                    disabled={!isConnected}
                  >
                    Join Meeting
                  </Button>
                </Card.Content>
              </Card>
            ))
          )}
        </Card.Content>
      </Card>

      <Card style={styles.recentCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Recent Meetings</Title>
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No recent meetings</Text>
          </View>
        </Card.Content>
      </Card>
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
  quickMeetingCard: {
    marginBottom: 16,
    elevation: 2,
  },
  upcomingCard: {
    marginBottom: 16,
    elevation: 2,
  },
  recentCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  input: {
    marginBottom: 16,
  },
  quickMeetingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  startButton: {
    flex: 1,
    marginRight: 8,
  },
  scheduleButton: {
    flex: 1,
    marginLeft: 8,
  },
  connectionWarning: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  meetingCard: {
    marginBottom: 12,
    elevation: 1,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  meetingInfo: {
    flex: 1,
    marginRight: 12,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  meetingTime: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  meetingDuration: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  timeChip: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  participants: {
    marginBottom: 12,
  },
  participantsLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  joinButton: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default ConferencingScreen;