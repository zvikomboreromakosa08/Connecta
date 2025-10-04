import React, { useState, useEffect, useContext } from 'react';

// --- MOCKING CORE REACT NATIVE AND EXTERNAL MODULES ---

// Mocking core React Native components
const View = ({ style, children }) => <div style={{...style, display: 'flex', flexDirection: style.flexDirection || 'column'}}>{children}</div>;
const Text = ({ style, children, numberOfLines }) => <span style={style}>{children}</span>;
const TouchableOpacity = ({ onPress, style, children }) => (
    <button onClick={onPress} style={{...style, cursor: 'pointer', border: 'none', background: 'transparent', padding: 0}}>{children}</button>
);
const StyleSheet = {
    create: (styles) => {
        const platformStyles = {};
        for (const key in styles) {
            // Converts style object to CSS-in-JS compatible format, handling flex values
            platformStyles[key] = Object.fromEntries(
                Object.entries(styles[key]).map(([k, v]) => [k, typeof v === 'number' && (k === 'flex' || k.includes('Opacity')) ? v : (typeof v === 'number' ? `${v}px` : v)])
            );
            // Translate RN properties to web CSS
            if (platformStyles[key].flexDirection === undefined) platformStyles[key].flexDirection = 'column';
            if (platformStyles[key].flex === 1) platformStyles[key].height = '100%';
        }
        return platformStyles;
    },
};
const ScrollView = ({ children, style, refreshControl }) => <div style={{...style, overflowY: 'auto'}}>{children}</div>;
// Mock FlatList with basic rendering logic (no virtualization)
const FlatList = ({ data, renderItem, keyExtractor, scrollEnabled }) => (
    <View style={{ width: '100%' }}>
        {data.map((item, index) => <div key={keyExtractor(item)}>{renderItem({ item, index })}</div>)}
    </View>
);
const RefreshControl = ({ refreshing, onRefresh }) => {
    // Mock refresh control behavior (a simple visual indicator and manual trigger)
    const handleRefresh = (e) => {
        e.preventDefault();
        onRefresh();
    };
    return (
        <div style={{ padding: 10, textAlign: 'center', color: '#6366F1' }} onClick={handleRefresh}>
            {refreshing ? 'Refreshing...' : 'Pull down to refresh (click here)'}
        </div>
    );
};


// Mocking react-native-paper components (RNP)
const RNP = {
    Text: ({ style, children }) => <Text style={{...style, fontSize: 16}}>{children}</Text>,
    Button: ({ mode, onPress, loading, disabled, children, icon, style, compact }) => (
        <TouchableOpacity 
            onPress={onPress} 
            disabled={disabled || loading} 
            style={{
                ...styles.buttonMock,
                ...(mode === 'contained' ? styles.buttonContained : mode === 'outlined' ? styles.buttonOutlined : styles.buttonText),
                ...style,
                padding: compact ? '4px 8px' : '10px 16px',
            }}
        >
            {loading ? <Text>Loading...</Text> : <Text style={mode === 'contained' ? styles.buttonTextMock : {}}>{icon ? `[${icon}] ` : ''}{children}</Text>}
        </TouchableOpacity>
    ),
    Card: {
        Wrapper: ({ children, style, onPress }) => (
            <TouchableOpacity onPress={onPress} style={{ width: '100%' }}>
                <View style={{...styles.cardMock, ...style}}>{children}</View>
            </TouchableOpacity>
        ),
        Content: ({ children }) => <View style={{padding: 16}}>{children}</View>,
    },
    Title: ({ style, children }) => <Text style={{...styles.titleMock, ...style}}>{children}</Text>,
    Subheading: ({ style, children }) => <Text style={{...styles.subtitleMock, ...style}}>{children}</Text>,
    Avatar: {
        Text: ({ size, label, style }) => (
            <View style={{...styles.avatarTextMock, ...style, width: size, height: size, borderRadius: size / 2 }}>
                <Text style={{fontSize: size / 3, color: 'white'}}>{label}</Text>
            </View>
        ),
    },
    Chip: ({ icon, style, children, mode, size }) => (
        <View style={{...styles.chipMock, ...style, padding: size === 'small' ? '4px 8px' : '6px 12px'}}>
            {icon ? <Text>[{icon}] </Text> : null}
            <Text style={{fontSize: 12}}>{children}</Text>
        </View>
    ),
    ActivityIndicator: ({ size, color }) => (
        <Text style={{ fontSize: size === 'large' ? 24 : 16, color: color }}>[...Loading]</Text>
    )
};
const { Text: RNPText, Button: RNPButton, Card, Title, Subheading, Avatar, Chip, ActivityIndicator } = RNP;
// Helper to use Card.Wrapper as Card directly
const WrappedCard = RNP.Card.Wrapper;

// Mocking Context and Axios
const AuthContext = React.createContext({
    user: { name: 'Guest User', id: 'guest', profilePicture: 'url' } // Mock user for initial render
});
const SocketContext = React.createContext(null); // Mock Socket Context
const axios = {
    // Mock implementation for authenticated requests
    get: async (url) => {
        await new Promise(r => setTimeout(r, 300)); // Simulate network delay
        if (url.includes('my-channels')) {
            return {
                data: [
                    { _id: 'c1', name: 'General', description: 'Main chat', members: [{id: 1}, {id: 2}], isPrivate: false },
                    { _id: 'c2', name: 'Project Alpha', description: 'Feature planning', members: [{id: 1}], isPrivate: true },
                    { _id: 'c3', name: 'Random', description: 'Fun chat', members: [{id: 1}, {id: 3}, {id: 4}], isPrivate: false },
                ]
            };
        } else if (url.includes('messages/recent')) {
            return {
                data: [
                    { _id: 'm1', content: 'Team, please check the Alpha Project status update by 3 PM today.', sender: { name: 'Jane Doe' }, priority: 'urgent', aiSummary: 'Action required: Review Alpha status by 3 PM.' },
                    { _id: 'm2', content: 'Did anyone see the latest documentation updates?', sender: { name: 'John Smith' }, priority: 'medium', aiSummary: null },
                ]
            };
        } else if (url.includes('conferencing/upcoming')) {
            return {
                data: [
                    { _id: 'meet1', title: 'Weekly Standup', startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
                ]
            };
        }
        return { data: [] };
    }
};

// Mock useFocusEffect - simulates mounting logic since the component is used in a mock navigator
const useFocusEffect = React.useCallback;

// --- DASHBOARD SCREEN COMPONENT ---

const DashboardScreen = ({ navigation }) => {
    // Mock navigation object since we are in a single file
    const mockNavigation = { navigate: (screen, params) => console.log(`[Navigation] Navigate to: ${screen}`, params) };
    navigation = navigation || mockNavigation;
    
    const { user } = useContext(AuthContext);
    const socket = useContext(SocketContext);
    
    const [channels, setChannels] = useState([]);
    const [recentMessages, setRecentMessages] = useState([]);
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
        setupSocketListeners();
    }, [socket]); // Re-run if socket initializes

    const setupSocketListeners = () => {
        if (socket && socket.connected) {
            console.log('[Socket] Setting up dashboard listeners');
            socket.on('new-message', (message) => {
                // Prepend new message and limit list size
                setRecentMessages(prev => [message, ...prev.slice(0, 9)]);
            });

            // Example: socket.on('status-update', (data) => { /* ... */ });
        }
    };

    const loadDashboardData = async () => {
        try {
            // Note: In a real app, axios would be configured to use the auth token automatically.
            const [channelsRes, messagesRes, meetingsRes] = await Promise.all([
                axios.get('/api/channels/my-channels'),
                axios.get('/api/messages/recent'),
                axios.get('/api/conferencing/upcoming')
            ]);

            setChannels(channelsRes.data);
            setRecentMessages(messagesRes.data);
            setUpcomingMeetings(meetingsRes.data);
        } catch (error) {
            console.error('Dashboard data loading failed:', error);
            // In a real app, this should trigger an Alert or Banner
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
            urgent: '#FEF2F2', // Red-50
            high: '#FFFBEB',   // Yellow-50
            medium: '#F0F9FF', // Blue-50
            low: '#F0FDF4'     // Green-50
        };
        return colors[priority.toLowerCase()] || '#F0F9FF';
    };

    const renderChannelItem = ({ item }) => (
        <WrappedCard 
            style={styles.channelCard}
            onPress={() => navigation.navigate('ChannelChat', { channelId: item._id, channelName: item.name })}
        >
            <Card.Content>
                <View style={styles.channelHeader}>
                    <Avatar.Text 
                        size={40} 
                        label={item.name.substring(0, 2).toUpperCase()} 
                    />
                    <View style={styles.channelInfo}>
                        <Title style={styles.channelName}>{item.name}</Title>
                        <Subheading style={styles.channelMembers}>
                            {item.members.length} members
                        </Subheading>
                    </View>
                    {item.isPrivate && (
                        <Chip icon="lock" style={styles.privateChip}>Private</Chip>
                    )}
                </View>
            </Card.Content>
        </WrappedCard>
    );

    const renderMessageItem = ({ item }) => (
        <WrappedCard style={styles.messageCard} onPress={() => navigation.navigate('ChannelChat', { channelId: item.channelId })}>
            <Card.Content>
                <View style={styles.messageHeader}>
                    <Avatar.Text 
                        size={32} 
                        label={item.sender.name.substring(0, 2).toUpperCase()} 
                    />
                    <View style={styles.messageInfo}>
                        <RNPText style={styles.senderName}>{item.sender.name}</RNPText>
                        <RNPText style={styles.messageContent} numberOfLines={2}>
                            {item.content}
                        </RNPText>
                    </View>
                    <Chip 
                        mode="outlined" 
                        size="small"
                        style={{ ...styles.priorityChip, backgroundColor: getPriorityColor(item.priority || 'medium') }}
                    >
                        {item.priority || 'Medium'}
                    </Chip>
                </View>
                {item.aiSummary && (
                    <RNPText style={styles.aiSummary}>🤖 {item.aiSummary}</RNPText>
                )}
            </Card.Content>
        </WrappedCard>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <RNPText style={{marginTop: 10, color: '#6366F1'}}>Fetching latest data...</RNPText>
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
            {/* Welcome Section */}
            <WrappedCard style={styles.welcomeCard}>
                <Card.Content>
                    <Title>Welcome back, {user?.name || 'User'}! 👋</Title>
                    <Subheading>
                        Here's what's happening in your workspace today.
                    </Subheading>
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <RNPText style={styles.statNumber}>{channels.length}</RNPText>
                            <RNPText style={styles.statLabel}>Channels</RNPText>
                        </View>
                        <View style={styles.statItem}>
                            <RNPText style={styles.statNumber}>{recentMessages.length}</RNPText>
                            <RNPText style={styles.statLabel}>New Messages</RNPText>
                        </View>
                        <View style={styles.statItem}>
                            <RNPText style={styles.statNumber}>{upcomingMeetings.length}</RNPText>
                            <RNPText style={styles.statLabel}>Meetings</RNPText>
                        </View>
                    </View>
                </Card.Content>
            </WrappedCard>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <RNPButton
                    mode="contained"
                    icon="plus"
                    onPress={() => navigation.navigate('CreateChannel')}
                    style={styles.actionButton}
                >
                    New Channel
                </RNPButton>
                <RNPButton
                    mode="outlined"
                    icon="video"
                    onPress={() => navigation.navigate('Conferencing')}
                    style={styles.actionButton}
                >
                    Start Meeting
                </RNPButton>
            </View>

            {/* Recent Messages */}
            <Title style={styles.sectionTitle}>Recent Messages</Title>
            {recentMessages.length > 0 ? (
                <FlatList
                    data={recentMessages}
                    renderItem={renderMessageItem}
                    keyExtractor={item => item._id}
                    scrollEnabled={false}
                />
            ) : (
                <RNPText style={styles.emptyText}>No recent messages. Start a conversation!</RNPText>
            )}

            {/* Your Channels */}
            <Title style={styles.sectionTitle}>Your Channels (Top 5)</Title>
            {channels.length > 0 ? (
                <FlatList
                    data={channels.slice(0, 5)}
                    renderItem={renderChannelItem}
                    keyExtractor={item => item._id}
                    scrollEnabled={false}
                />
            ) : (
                <RNPText style={styles.emptyText}>You haven't joined any channels yet.</RNPText>
            )}

            {/* Upcoming Meetings */}
            {upcomingMeetings.length > 0 && (
                <>
                    <Title style={styles.sectionTitle}>Upcoming Meetings</Title>
                    {upcomingMeetings.map(meeting => (
                        <WrappedCard key={meeting._id} style={styles.meetingCard}>
                            <Card.Content>
                                <RNPText style={styles.meetingTitle}>{meeting.title}</RNPText>
                                <RNPText style={styles.meetingTime}>
                                    {new Date(meeting.startTime).toLocaleString()}
                                </RNPText>
                                <RNPButton
                                    mode="contained"
                                    compact
                                    onPress={() => navigation.navigate('Conferencing', { meetingId: meeting._id })}
                                >
                                    Join Meeting
                                </RNPButton>
                            </Card.Content>
                        </WrappedCard>
                    ))}
                </>
            )}
            <View style={{ height: 50 }} /> {/* Spacer */}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    // RNP Mock Styles
    cardMock: {
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        borderRadius: 8,
    },
    buttonMock: {
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContained: {
        backgroundColor: '#6366F1', // Indigo-500
    },
    buttonOutlined: {
        border: '1px solid #6366F1',
        color: '#6366F1',
        backgroundColor: 'transparent',
    },
    buttonText: {
        backgroundColor: 'transparent',
        boxShadow: 'none',
        color: '#6366F1',
    },
    buttonTextMock: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    titleMock: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    subtitleMock: {
        color: '#6B7280',
        fontSize: 14,
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

    // Layout and specific styles
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
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        padding: 20,
        fontStyle: 'italic',
    },
    welcomeCard: {
        marginBottom: 16,
        elevation: 2,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
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
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 4,
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
        fontWeight: 'bold',
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
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
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
        padding: 10,
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
