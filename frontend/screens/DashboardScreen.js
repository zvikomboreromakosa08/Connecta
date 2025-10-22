import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Button, Avatar, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const DashboardScreen = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Welcome Card */}
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <View style={styles.welcomeHeader}>
            <View>
              <Title style={styles.welcomeTitle}>Welcome back!</Title>
              <Text style={styles.welcomeSubtitle}>Here's what's happening today.</Text>
            </View>
            <Avatar.Text size={40} label="ZK" />
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Messages</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Meetings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Channels</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Button mode="contained" style={styles.actionButton} icon="message-text">
          New Message
        </Button>
        <Button mode="outlined" style={styles.actionButton} icon="video">
          Join Call
        </Button>
      </View>

      {/* Recent Channels */}
      <Title style={styles.sectionTitle}>Recent Channels</Title>
      <Card style={styles.channelCard}>
        <Card.Content>
          <View style={styles.channelHeader}>
            <Avatar.Text size={40} label="GN" />
            <View style={styles.channelInfo}>
              <Text style={styles.channelName}>General</Text>
              <Text style={styles.channelMembers}>24 members • 5 new messages</Text>
            </View>
            <Chip mode="outlined" style={styles.privateChip}>Team</Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Messages */}
      <Title style={styles.sectionTitle}>Recent Messages</Title>
      <Card style={styles.messageCard}>
        <Card.Content>
          <View style={styles.messageHeader}>
            <Avatar.Text size={40} label="JD" />
            <View style={styles.messageInfo}>
              <Text style={styles.senderName}>John Doe</Text>
              <Text style={styles.messageContent}>Let's schedule the project review for tomorrow...</Text>
              <Text style={styles.aiSummary}>AI Summary: Scheduling project review meeting</Text>
            </View>
            <Chip mode="outlined" style={styles.priorityChip}>High</Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Upcoming Meetings */}
      <Title style={styles.sectionTitle}>Upcoming Meetings</Title>
      <Card style={styles.meetingCard}>
        <Card.Content>
          <Text style={styles.meetingTitle}>Project Sync</Text>
          <Text style={styles.meetingTime}>Today • 2:00 PM - 3:00 PM</Text>
          <Button mode="contained" style={{marginTop: 8}}>
            Join Meeting
          </Button>
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#374151',
  },
  welcomeCard: {
    marginBottom: 16,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  connectionWarning: {
    marginTop: 10,
    color: '#B91C1C',
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonContent: {
    flexDirection: 'row-reverse',
  },
  sectionTitle: {
    marginVertical: 8,
    fontSize: 18,
    fontWeight: 'bold',
  },
  channelCard: {
    marginVertical: 4,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelInfo: {
    flex: 1,
    marginLeft: 8,
  },
  channelName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  channelMembers: {
    fontSize: 12,
    color: '#6B7280',
  },
  privateChip: {
    backgroundColor: '#E5E7EB',
  },
  messageCard: {
    marginVertical: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageInfo: {
    flex: 1,
    marginLeft: 8,
  },
  senderName: {
    fontWeight: 'bold',
  },
  messageContent: {
    color: '#374151',
  },
  aiSummary: {
    marginTop: 4,
    fontStyle: 'italic',
    color: '#6B7280',
  },
  priorityChip: {
    marginLeft: 8,
  },
  meetingCard: {
    marginVertical: 4,
  },
  meetingTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  meetingTime: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default DashboardScreen;