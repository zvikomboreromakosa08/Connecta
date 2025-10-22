import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Card, Title, Button, Avatar, TextInput, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const ChannelScreen = () => {
  // Add your state and logic for messages here
  const [message, setMessage] = React.useState('');

  return (
    <View style={styles.container}>
      {/* Channel Header */}
      <Card style={styles.header}>
        <Card.Content style={styles.headerContent}>
          <View style={styles.channelInfo}>
            <Text style={styles.channelName}>General</Text>
            <Text style={styles.channelDescription}>Team communication channel</Text>
            <View style={styles.membersContainer}>
              {/* Member avatars would go here */}
              <Avatar.Text size={24} label="ZK" style={[styles.memberItem, styles.onlineAvatar]} />
              <Chip mode="outlined" style={styles.moreChip}>+5</Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Messages List */}
      <FlatList
        style={styles.messagesList}
        data={[{ id: '1', user: 'John', message: 'Hello team!', isUser: false }]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[
            styles.messageContainer,
            item.isUser ? styles.userMessage : styles.otherMessage
          ]}>
            {!item.isUser && (
              <Avatar.Text size={32} label="JD" style={styles.avatar} />
            )}
            <View style={[
              styles.messageBubble,
              item.isUser ? styles.userBubble : styles.otherBubble
            ]}>
              {!item.isUser && (
                <Text style={styles.senderName}>{item.user}</Text>
              )}
              <Text style={[
                styles.messageText,
                item.isUser ? styles.userMessageText : styles.otherMessageText
              ]}>
                {item.message}
              </Text>
              <View style={styles.timestampContainer}>
                <Text style={[
                  styles.timestamp,
                  item.isUser ? styles.userTimestamp : styles.otherTimestamp
                ]}>
                  10:30 AM
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Input Area */}
      <Card style={styles.inputContainer}>
        <Card.Content style={styles.inputContent}>
          <TextInput
            mode="outlined"
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            style={styles.textInput}
            multiline
          />
          <Button
            mode="contained"
            style={styles.sendButton}
            onPress={() => {/* Send message logic */}}
          >
            <Ionicons name="send" size={16} color="white" />
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 8,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  channelDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  membersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    alignItems: 'center',
  },
  memberItem: {
    marginRight: 4,
    marginBottom: 4,
  },
  memberAvatar: {},
  onlineAvatar: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  busyAvatar: {
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  moreChip: {
    marginLeft: 4,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  messageContainer: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 8,
    borderRadius: 8,
  },
  userBubble: {
    backgroundColor: '#6366F1',
  },
  otherBubble: {
    backgroundColor: '#E5E7EB',
  },
  messageText: {
    color: '#000',
  },
  userMessageText: {
    color: '#FFF',
  },
  otherMessageText: {
    color: '#000',
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aiSummaryCard: {
    marginTop: 4,
    backgroundColor: '#F3F4F6',
  },
  aiSummaryContent: {
    paddingVertical: 4,
  },
  aiSummaryText: {
    fontSize: 12,
    color: '#6B7280',
  },
  timestampContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  optimisticChip: {
    backgroundColor: '#FEF3C7',
  },
  timestamp: {
    fontSize: 10,
    color: '#6B7280',
  },
  userTimestamp: {
    color: '#FFF',
  },
  otherTimestamp: {
    color: '#6B7280',
  },
  inputContainer: {
    padding: 8,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
  },
  sendButton: {
    backgroundColor: '#6366F1',
    marginLeft: 8,
  },
});

export default ChannelScreen;