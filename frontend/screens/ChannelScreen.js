// frontend/screens/ChannelScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import {
  Card,
  TextInput,
  Button,
  Avatar,
  IconButton,
  Menu,
  Chip,
  ActivityIndicator
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const ChannelScreen = ({ route, navigation }) => {
  const { channelId } = route.params;
  const { user } = useAuth();
  const { isConnected, joinChannel, leaveChannel, sendMessage, listenToEvent } = useSocket();
  
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  
  const flatListRef = useRef();

  useEffect(() => {
    loadChannelData();
    
    if (channelId) {
      joinChannel(channelId);
    }

    const unsubscribe = listenToEvent('new-message', (message) => {
      if (message.channel === channelId) {
        setMessages(prev => {
          const isOptimistic = prev.some(m => m.isOptimistic && m.content === message.content && m.sender.id === user.id);
          if (isOptimistic) {
            return [...prev.filter(m => !m.isOptimistic), message];
          }
          return [...prev, message];
        });
        scrollToBottom();
      }
    });

    return () => {
      unsubscribe();
      if (channelId) {
        leaveChannel(channelId);
      }
    };
  }, [channelId]);

  const loadChannelData = async () => {
    try {
      const mockChannel = {
        _id: channelId,
        name: 'Frontend-Dev',
        description: 'Discussion and planning for the client-side application.',
        members: [
          { _id: 'u1', name: 'Current User', availabilityStatus: 'online' },
          { _id: 'u2', name: 'Jane Doe', availabilityStatus: 'online' },
          { _id: 'u3', name: 'Bob Smith', availabilityStatus: 'offline' },
          { _id: 'u4', name: 'Alice Ray', availabilityStatus: 'online' },
        ],
      };

      const mockMessages = [
        { 
          _id: 'm1', 
          content: 'Hey team, welcome to the main channel!', 
          sender: { _id: 'u2', name: 'Jane Doe' }, 
          createdAt: new Date(Date.now() - 3600000).toISOString() 
        },
        { 
          _id: 'm2', 
          content: 'What are the main goals for this week?', 
          sender: { _id: 'u1', name: 'Current User' }, 
          createdAt: new Date(Date.now() - 3000000).toISOString() 
        },
      ];

      setChannel(mockChannel);
      setMessages(mockMessages);
    } catch (error) {
      Alert.alert('Error', 'Failed to load channel data');
      console.error('Channel data loading failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessageHandler = () => {
    if (!newMessage.trim() || !user) return;

    const contentToSend = newMessage;
    setNewMessage('');

    const optimisticMessage = {
      _id: Date.now().toString(),
      content: contentToSend,
      sender: user,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const messageData = {
        content: contentToSend,
        channelId: channelId
      };
      
      sendMessage(messageData);
    } catch (error) {
      console.error('Message sending failed:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const renderMessage = ({ item, index }) => {
    const messageSenderId = item.sender?._id || item.sender?.id;
    const isUser = messageSenderId === user?.id;
    const showAvatar = index === 0 || 
      (messages[index - 1] && messages[index - 1].sender?._id !== messageSenderId);

    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.otherMessage,
      ]}>
        {!isUser && showAvatar && (
          <Avatar.Text 
            size={32}
            label={item.sender?.name?.substring(0, 2).toUpperCase() || '??'}
            style={styles.avatar}
          />
        )}
        
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.otherBubble
        ]}>
          {!isUser && showAvatar && (
            <Text style={styles.senderName}>
              {item.sender?.name}
            </Text>
          )}
          
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.otherMessageText]}>
            {item.content}
          </Text>
          
          {item.aiSummary && (
            <Card style={styles.aiSummaryCard}>
              <Card.Content style={styles.aiSummaryContent}>
                <Text style={styles.aiSummaryText}>🤖 {item.aiSummary}</Text>
              </Card.Content>
            </Card>
          )}
          
          <View style={styles.timestampContainer}>
            {item.isOptimistic && (
              <Chip mode="outlined" size="small" style={styles.optimisticChip}>
                Sending...
              </Chip>
            )}
            <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.otherTimestamp]}>
              {new Date(item.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text>Loading channel...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <Card style={styles.header}>
        <Card.Content style={styles.headerContent}>
          <View style={styles.channelInfo}>
            <Text style={styles.channelName}>#{channel?.name}</Text>
            <Text style={styles.channelDescription}>
              {channel?.description}
            </Text>
          </View>
          
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon={() => <Ionicons name="ellipsis-vertical" size={20} color="#000" />}
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item 
              icon={() => <Ionicons name="information-circle" size={20} color="#000" />}
              title="Channel Info" 
              onPress={() => {
                setMenuVisible(false);
                Alert.alert('Channel Info', `Name: ${channel?.name}\nMembers: ${channel?.members?.length}`);
              }} 
            />
            <Menu.Item 
              icon={() => <Ionicons name="person-add" size={20} color="#000" />}
              title="Add Members" 
              onPress={() => {
                setMenuVisible(false);
                Alert.alert('Add Members', 'Add members functionality');
              }} 
            />
            <Menu.Item 
              icon={() => <Ionicons name="videocam" size={20} color="#000" />}
              title="Start Meeting" 
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('Conferencing');
              }} 
            />
          </Menu>
        </Card.Content>
        
        <View style={styles.membersContainer}>
          <Text style={styles.membersCount}>{channel?.members?.length} Members:</Text>
          {channel?.members?.slice(0, 8).map(member => (
            <View key={member._id} style={styles.memberItem}>
              <Avatar.Text 
                size={28}
                label={member.name.substring(0, 2).toUpperCase()}
                style={[
                  styles.memberAvatar,
                  member.availabilityStatus === 'online' && styles.onlineAvatar,
                  member.availabilityStatus === 'busy' && styles.busyAvatar
                ]}
              />
            </View>
          ))}
          {channel?.members?.length > 8 && (
            <Chip style={styles.moreChip}>
              +{channel.members.length - 8}
            </Chip>
          )}
        </View>
      </Card>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item._id}
        style={styles.messagesList}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
      />

      <Card style={styles.inputContainer}>
        <Card.Content style={styles.inputContent}>
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder={`Message #${channel?.name}`}
            mode="outlined"
            style={styles.textInput}
            multiline
            maxLength={1000}
            onSubmitEditing={sendMessageHandler}
          />
          <IconButton
            icon={() => <Ionicons name="send" size={20} color="#FFF" />}
            mode="contained"
            onPress={sendMessageHandler}
            disabled={!newMessage.trim()}
            style={styles.sendButton}
          />
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
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
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  channelDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: 'wrap',
  },
  membersCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    marginRight: 8,
  },
  memberItem: {
    marginRight: 4,
    marginBottom: 4,
  },
  memberAvatar: {
    backgroundColor: '#9CA3AF',
  },
  onlineAvatar: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  busyAvatar: {
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  moreChip: {
    backgroundColor: '#E5E7EB',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
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
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    elevation: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#374151',
  },
  messageText: {
    fontSize: 14,
  },
  userMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#374151',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 10,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherTimestamp: {
    color: '#9CA3AF',
  },
  optimisticChip: {
    backgroundColor: '#FEF3C7',
    marginRight: 4,
  },
  aiSummaryCard: {
    marginTop: 8,
    backgroundColor: '#ECFDF5',
  },
  aiSummaryContent: {
    padding: 8,
  },
  aiSummaryText: {
    fontSize: 12,
    color: '#065F46',
    fontStyle: 'italic',
  },
  inputContainer: {
    margin: 16,
    elevation: 4,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    margin: 0,
  },
});

export default ChannelScreen;