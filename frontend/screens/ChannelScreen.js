import React, { useState, useEffect, useContext, useRef } from 'react';

// --- MOCKING CORE REACT NATIVE AND EXTERNAL MODULES ---

// Mocking core React Native components
const View = ({ style, children }) => <div style={{...style, display: 'flex', flexDirection: style.flexDirection || 'column'}}>{children}</div>;
const Text = ({ style, children }) => <span style={style}>{children}</span>;
const TouchableOpacity = ({ onPress, style, children, disabled }) => (
    <button onClick={onPress} disabled={disabled} style={{...style, cursor: disabled ? 'default' : 'pointer', border: 'none', background: 'transparent', padding: 0}}>{children}</button>
);
const StyleSheet = {
    create: (styles) => {
        const platformStyles = {};
        for (const key in styles) {
            // Converts style object to CSS-in-JS compatible format
            platformStyles[key] = Object.fromEntries(
                Object.entries(styles[key]).map(([k, v]) => [k, typeof v === 'number' && (k === 'flex' || k.includes('Opacity')) ? v : (typeof v === 'number' ? `${v}px` : v)])
            );
            // Translate RN properties to web CSS
            if (platformStyles[key].flexDirection === undefined) platformStyles[key].flexDirection = 'column';
        }
        return platformStyles;
    },
};
const Platform = { OS: 'web' };
const KeyboardAvoidingView = ({ children, style, behavior }) => <div style={{...style, flex: 1}}>{children}</div>;

// Mock FlatList with basic rendering logic and scroll ref
const MockFlatList = React.forwardRef(({ data, renderItem, keyExtractor, style, onContentSizeChange, onLayout }, ref) => {
    // Simulate scroll behavior for the web
    useEffect(() => {
        if (ref && ref.current) {
            ref.current.scrollTop = ref.current.scrollHeight;
        }
    }, [data, ref]);

    return (
        <div ref={ref} onContentSizeChange={onContentSizeChange} onLayout={onLayout} style={{...style, overflowY: 'auto', flex: 1}}>
            {data.map((item, index) => <div key={keyExtractor(item)}>{renderItem({ item, index })}</div>)}
        </div>
    );
});
const FlatList = MockFlatList;

// Mocking react-native-paper components (RNP)
const RNP = {
    Text: ({ style, children }) => <Text style={{...style, fontSize: 16}}>{children}</Text>,
    TextInput: ({ value, onChangeText, placeholder, mode, style, multiline, maxLength, ...props }) => (
        <input 
            type="text" 
            value={value} 
            onChange={(e) => onChangeText(e.target.value)} 
            placeholder={placeholder} 
            style={{...styles.textInputMock, ...style, height: multiline ? 'auto' : 40}}
            {...props}
        />
    ),
    Button: ({ mode, onPress, children, icon, style }) => (
        <TouchableOpacity 
            onPress={onPress} 
            style={{...styles.buttonMock, ...styles.buttonContained, ...style}}
        >
            <Text style={styles.buttonTextMock}>{icon ? `[${icon}] ` : ''}{children}</Text>
        </TouchableOpacity>
    ),
    Card: {
        Wrapper: ({ children, style, onPress }) => (
            <div style={{...styles.cardMock, ...style}} onClick={onPress}>{children}</div>
        ),
        Content: ({ children, style }) => <div style={{padding: 16, ...style}}>{children}</div>,
    },
    Avatar: {
        Text: ({ size, label, style }) => (
            <View style={{...styles.avatarTextMock, ...style, width: size, height: size, borderRadius: size / 2 }}>
                <Text style={{fontSize: size / 3, color: 'white'}}>{label}</Text>
            </View>
        ),
    },
    IconButton: ({ icon, onPress, disabled, style, mode }) => (
        <TouchableOpacity 
            onPress={onPress} 
            disabled={disabled} 
            style={{...styles.iconButtonMock, ...(mode === 'contained' && styles.iconButtonContained), ...style, opacity: disabled ? 0.5 : 1}}
        >
            <Text>{icon === 'send' ? '▶' : icon === 'dots-vertical' ? '•••' : `[${icon}]`}</Text>
        </TouchableOpacity>
    ),
    Menu: ({ visible, onDismiss, anchor, children }) => (
        <div style={{position: 'relative'}}>
            {anchor}
            {visible && (
                <div style={styles.menuMock}>
                    {children}
                </div>
            )}
        </div>
    ),
    Chip: ({ icon, style, children }) => (
        <View style={{...styles.chipMock, ...style}}>
            {icon ? <Text>[{icon}] </Text> : null}
            <Text style={{fontSize: 12}}>{children}</Text>
        </View>
    ),
};

const { TextInput, Button, Card, Avatar, IconButton, Menu, Chip, Text: RNPText } = RNP;
const WrappedCard = RNP.Card.Wrapper;

// Mocking Context and Axios
const MOCK_USER_ID = 'u1';
const MOCK_CHANNEL_ID = 'c1';

const AuthContext = React.createContext({
    user: { _id: MOCK_USER_ID, id: MOCK_USER_ID, name: 'Current User', profilePicture: 'url' } 
});
const SocketContext = React.createContext({
    connected: true,
    emit: (event, data) => console.log(`[Socket] EMIT: ${event}`, data),
    on: (event, callback) => {
        // Mock socket message reception (Only for initial setup, real messages are sent via state/optimistic updates)
        if (event === 'new-message') {
            // Simulate a message coming from another user 2 seconds later
            setTimeout(() => {
                const mockIncomingMessage = {
                    _id: 'm-mock-r' + Date.now(),
                    content: "Got your message! Thanks for the update.",
                    sender: { _id: 'u2', name: 'Jane Doe' },
                    channel: MOCK_CHANNEL_ID,
                    createdAt: new Date().toISOString(),
                };
                console.log('[Socket Mock] Receiving simulated message:', mockIncomingMessage);
                callback(mockIncomingMessage);
            }, 2000);
        }
    }
}); 
const axios = {
    get: async (url) => {
        await new Promise(r => setTimeout(r, 500)); // Simulate network delay
        if (url.includes(MOCK_CHANNEL_ID + '/messages')) {
            return {
                data: [
                    { _id: 'm1', content: 'Hey team, welcome to the main channel!', sender: { _id: 'u2', name: 'Jane Doe' }, createdAt: new Date(Date.now() - 3600000).toISOString() },
                    { _id: 'm2', content: 'What are the main goals for this week?', sender: { _id: 'u1', name: 'Current User' }, createdAt: new Date(Date.now() - 3000000).toISOString() },
                    { _id: 'm3', content: 'The project is delayed by 3 days due to external dependencies.', sender: { _id: 'u3', name: 'Bob Smith' }, createdAt: new Date(Date.now() - 1800000).toISOString(), aiSummary: 'Summary: Project delay confirmed (3 days) due to dependencies.' },
                    { _id: 'm4', content: 'Understood. I will adjust the sprint plan.', sender: { _id: 'u1', name: 'Current User' }, createdAt: new Date(Date.now() - 600000).toISOString() },
                ]
            };
        } else if (url.includes('/api/channels/' + MOCK_CHANNEL_ID)) {
            return {
                data: {
                    _id: MOCK_CHANNEL_ID,
                    name: 'Frontend-Dev',
                    description: 'Discussion and planning for the client-side application.',
                    members: [
                        { _id: 'u1', name: 'Current User', availabilityStatus: 'online' },
                        { _id: 'u2', name: 'Jane Doe', availabilityStatus: 'online' },
                        { _id: 'u3', name: 'Bob Smith', availabilityStatus: 'offline' },
                        { _id: 'u4', name: 'Alice Ray', availabilityStatus: 'online' },
                        { _id: 'u5', name: 'Chris Lee', availabilityStatus: 'busy' },
                        { _id: 'u6', name: 'Eve King', availabilityStatus: 'online' },
                        { _id: 'u7', name: 'Frank Hill', availabilityStatus: 'offline' },
                        { _id: 'u8', name: 'Grace Liu', availabilityStatus: 'online' },
                        { _id: 'u9', name: 'Hank Chen', availabilityStatus: 'online' },
                        { _id: 'u10', name: 'Ivy Tan', availabilityStatus: 'online' },
                    ],
                }
            };
        }
        return { data: {} };
    }
};

// Mock Menu.Item for RNP
RNP.Menu.Item = ({ icon, title, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.menuItemMock}>
        <Text style={{marginRight: 8}}>{icon ? `[${icon}]` : ''}</Text>
        <Text>{title}</Text>
    </TouchableOpacity>
);

// --- CHANNEL SCREEN COMPONENT ---

const ChannelScreen = ({ route, navigation }) => {
    // Mock route.params since we are in a single file
    const mockRoute = { params: { channelId: MOCK_CHANNEL_ID } };
    route = route || mockRoute;

    // Mock navigation functions
    const mockNavigation = { navigate: (screen, params) => console.log(`[Navigation] Navigate to: ${screen}`, params) };
    navigation = navigation || mockNavigation;
    
    const { channelId } = route.params;
    const { user } = useContext(AuthContext);
    const socket = useContext(SocketContext);
    
    const [channel, setChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [menuVisible, setMenuVisible] = useState(false);
    
    const flatListRef = useRef();

    useEffect(() => {
        loadChannelData();
        setupSocketListeners();
        
        // Cleanup function for socket listeners and channel leave event
        return () => {
             if (socket && socket.connected) {
                console.log(`[Socket] Leaving channel: ${channelId}`);
                socket.emit('leave-channel', channelId);
             }
        };
    }, [channelId, socket]);

    const setupSocketListeners = () => {
        if (socket && socket.connected) {
            console.log(`[Socket] Joining channel: ${channelId}`);
            socket.emit('join-channel', channelId);
            
            socket.on('new-message', (message) => {
                if (message.channel === channelId) {
                    setMessages(prev => {
                        // Replace the optimistic message if it exists (by checking content and sender)
                        const isOptimistic = prev.some(m => m.isOptimistic && m.content === message.content && m.sender.id === user.id);
                        if (isOptimistic) {
                             // Simple replacement strategy: remove last optimistic message and add new one
                             return [...prev.filter(m => !m.isOptimistic), message];
                        }
                        return [...prev, message];
                    });
                    scrollToBottom();
                }
            });
        }
    };

    const loadChannelData = async () => {
        try {
            const [channelRes, messagesRes] = await Promise.all([
                axios.get(`/api/channels/${channelId}`),
                axios.get(`/api/channels/${channelId}/messages`)
            ]);

            setChannel(channelRes.data);
            setMessages(messagesRes.data);
        } catch (error) {
            console.error('Channel data loading failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = () => {
        if (!newMessage.trim() || !user) return;

        const contentToSend = newMessage;
        setNewMessage(''); // Clear input immediately
        
        // Optimistically add message
        const optimisticMessage = {
            _id: Date.now().toString(),
            content: contentToSend,
            sender: user,
            createdAt: new Date().toISOString(),
            isOptimistic: true // Flag to identify a local message awaiting server confirmation
        };

        setMessages(prev => [...prev, optimisticMessage]);
        scrollToBottom();

        try {
            const messageData = {
                content: contentToSend,
                channelId: channelId
            };
            
            // In a real app, you would send via an API call or socket event
            if (socket) {
                 socket.emit('send-message', messageData);
            }
        } catch (error) {
            console.error('Message sending failed:', error);
            // In case of error, you might want to remove the optimistic message and notify the user.
        }
    };

    const scrollToBottom = () => {
        // Ensure this runs slightly after state update/render cycle
        setTimeout(() => {
            if (flatListRef.current) {
              flatListRef.current.scrollTop = flatListRef.current.scrollHeight;
            }
        }, 50);
    };
    
    // Function to handle Enter key press (web/desktop simulation)
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const renderMessage = ({ item, index }) => {
        const messageSenderId = item.sender?._id || item.sender?.id;
        const isUser = messageSenderId === user?.id;
        
        // Logic to group messages: only show avatar/name if the previous message was from a different sender
        const showAvatar = index === 0 || 
            (messages[index - 1] && messages[index - 1].sender?._id !== messageSenderId);

        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessage : styles.otherMessage,
            ]}>
                {/* Avatar on the left for others */}
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
                    {/* Sender Name for others, only if showing avatar */}
                    {!isUser && showAvatar && (
                        <RNPText style={styles.senderName}>
                            {item.sender?.name}
                        </RNPText>
                    )}
                    
                    <RNPText style={[styles.messageText, !isUser && styles.otherMessageText]}>
                        {item.content}
                    </RNPText>
                    
                    {/* AI Summary Card */}
                    {item.aiSummary && (
                        <WrappedCard style={styles.aiSummaryCard}>
                            <Card.Content style={styles.aiSummaryContent}>
                                <RNPText style={styles.aiSummaryText}>🤖 {item.aiSummary}</RNPText>
                            </Card.Content>
                        </WrappedCard>
                    )}
                    
                    {/* Status and Timestamp */}
                    <View style={styles.timestampContainer}>
                        {item.isOptimistic && (
                            <Chip mode="outlined" size="small" style={styles.optimisticChip}>
                                Sending...
                            </Chip>
                        )}
                        <RNPText style={[styles.timestamp, !isUser && styles.otherTimestamp]}>
                            {new Date(item.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </RNPText>
                    </View>
                </View>
                
                {/* Placeholder for user-side avatar if grouping is not desired */}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <RNPText>Loading channel...</RNPText>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            // behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Mocked for web
            keyboardVerticalOffset={90}
        >
            {/* Channel Header */}
            <WrappedCard style={styles.header}>
                <Card.Content style={styles.headerContent}>
                    <View style={styles.channelInfo}>
                        <RNPText style={styles.channelName}>#{channel?.name}</RNPText>
                        <RNPText style={styles.channelDescription}>
                            {channel?.description}
                        </RNPText>
                    </View>
                    
                    <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={
                            <IconButton
                                icon="dots-vertical"
                                onPress={() => setMenuVisible(true)}
                                style={{margin: 0}}
                            />
                        }
                    >
                        <Menu.Item 
                            icon="information" 
                            title="Channel Info" 
                            onPress={() => {setMenuVisible(false); navigation.navigate('ChannelInfo', { channelId }); }} 
                        />
                        <Menu.Item 
                            icon="account-multiple-plus" 
                            title="Add Members" 
                            onPress={() => {setMenuVisible(false); navigation.navigate('AddMembers', { channelId }); }} 
                        />
                        <Menu.Item 
                            icon="video" 
                            title="Start Meeting" 
                            onPress={() => {setMenuVisible(false); navigation.navigate('Conferencing', { channelId }); }} 
                        />
                    </Menu>
                </Card.Content>
                
                {/* Online Members */}
                <View style={styles.membersContainer}>
                    <RNPText style={styles.membersCount}>{channel?.members?.length} Members:</RNPText>
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
            </WrappedCard>

            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item._id}
                style={styles.messagesList}
                onContentSizeChange={scrollToBottom}
                onLayout={scrollToBottom}
            />

            {/* Message Input */}
            <WrappedCard style={styles.inputContainer}>
                <Card.Content style={styles.inputContent}>
                    {/* Note: onChangeText/value is managed by react-native-paper TextInput in RN */}
                    <TextInput
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder={`Message #${channel?.name}`}
                        mode="outlined"
                        style={styles.textInput}
                        multiline
                        maxLength={1000}
                        onKeyPress={handleKeyPress} // Added for web-style submit
                    />
                    <IconButton
                        icon="send"
                        mode="contained"
                        onPress={sendMessage}
                        disabled={!newMessage.trim()}
                        style={styles.sendButton}
                    />
                </Card.Content>
            </WrappedCard>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    // --- Mock Styles ---
    cardMock: {
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderRadius: 8,
    },
    avatarTextMock: {
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipMock: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: '6px 12px',
        backgroundColor: '#E5E7EB',
    },
    textInputMock: {
        padding: 8,
        borderRadius: 4,
        border: '1px solid #D1D5DB',
        fontSize: 14,
        width: '100%',
        boxSizing: 'border-box',
    },
    iconButtonMock: {
        borderRadius: 50,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    iconButtonContained: {
        backgroundColor: '#6366F1',
        color: 'white',
    },
    menuMock: {
        position: 'absolute',
        top: 40,
        right: 0,
        backgroundColor: 'white',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        zIndex: 10,
        borderRadius: 4,
        padding: 8,
        minWidth: 150,
    },
    menuItemMock: {
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    // --- Layout and specific styles ---
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
        borderRadius: 0, // Header should be full width
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    channelInfo: {
        flex: 1,
        paddingHorizontal: 8,
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
        borderColor: '#10B981', // Green
    },
    busyAvatar: {
        borderWidth: 2,
        borderColor: '#F59E0B', // Amber/Yellow
    },
    moreChip: {
        backgroundColor: '#E5E7EB',
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesList: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'flex-end',
    },
    userMessage: {
        justifyContent: 'flex-end',
        alignSelf: 'flex-end',
        width: '100%',
    },
    otherMessage: {
        justifyContent: 'flex-start',
        alignSelf: 'flex-start',
        width: '100%',
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
        backgroundColor: '#6366F1', // Indigo
        borderBottomRightRadius: 4,
        marginLeft: 'auto', // Push to the right
    },
    otherBubble: {
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
        elevation: 1,
        border: '1px solid #E5E7EB',
    },
    senderName: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#374151',
    },
    messageText: {
        fontSize: 14,
        color: 'white', // Default for user
    },
    otherMessageText: {
        color: '#374151', // Text color for others
    },
    timestampContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        justifyContent: 'flex-end',
    },
    timestamp: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)', // Lighter color on user bubble
        marginLeft: 8,
    },
    otherTimestamp: {
        color: '#9CA3AF', // Darker color on other bubble
    },
    optimisticChip: {
        backgroundColor: '#FEF3C7',
        height: 18,
        justifyContent: 'center',
        paddingHorizontal: 4,
        marginRight: 4,
    },
    aiSummaryCard: {
        marginTop: 8,
        backgroundColor: '#ECFDF5', // Green-50
        borderColor: '#10B981', // Green-600
        borderWidth: 1,
        borderRadius: 8,
        elevation: 0,
    },
    aiSummaryContent: {
        padding: 8,
    },
    aiSummaryText: {
        fontSize: 12,
        color: '#065F46', // Green-900
        fontStyle: 'italic',
    },
    inputContainer: {
        margin: 0,
        elevation: 4,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        borderRadius: 0, // Full width footer
    },
    inputContent: {
        flexDirection: 'row',
        alignItems: 'flex-end', // Align text input and button vertically at the bottom
        padding: 12,
    },
    textInput: {
        flex: 1,
        marginRight: 8,
        maxHeight: 100,
        minHeight: 40,
        backgroundColor: 'white',
    },
    sendButton: {
        margin: 0,
        width: 48,
        height: 48,
    },
});

export default ChannelScreen;
