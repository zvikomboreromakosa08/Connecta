import React, { useState, useContext } from 'react';

// --- MOCKING CORE REACT NATIVE AND EXTERNAL MODULES ---

// Mocking core React Native components (View, Text, StyleSheet, etc.)
const View = ({ style, children }) => <div style={{...style, display: 'flex', flexDirection: 'column'}}>{children}</div>;
const Text = ({ style, children }) => <span style={style}>{children}</span>;
const TextInput = ({ style, placeholder, value, onChangeText, secureTextEntry, autoCapitalize, keyboardType, label, mode }) => (
    <input
        style={{...style, padding: 10, borderRadius: 4, border: '1px solid #ccc', margin: '5px 0'}}
        type={secureTextEntry ? 'password' : 'text'}
        placeholder={label || placeholder}
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        autoCapitalize={autoCapitalize === 'none' ? 'none' : 'sentences'}
    />
);
const TouchableOpacity = ({ onPress, style, children, disabled }) => (
    <button onClick={onPress} style={{...style, cursor: disabled ? 'not-allowed' : 'pointer'}} disabled={disabled}>
        {children}
    </button>
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
const KeyboardAvoidingView = ({ children, style }) => <View style={style}>{children}</View>;
const Platform = { OS: 'web' }; // Mock platform as web for non-iOS paths
const ScrollView = ({ children, contentContainerStyle }) => <View style={contentContainerStyle}>{children}</View>;
// Mock Alert - IMPORTANT: replaces the forbidden alert()
const Alert = {
    alert: (title, message) => {
        console.warn(`[Mock Alert] ${title}: ${message}`);
        // Use a simple prompt replacement for the UI context
        const alertBox = document.createElement('div');
        alertBox.style.cssText = `
            position: fixed; top: 20%; left: 50%; transform: translate(-50%, -50%);
            background: white; border: 1px solid #ccc; padding: 20px; z-index: 1000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-radius: 8px;
            width: 80%; max-width: 300px; text-align: center;
        `;
        alertBox.innerHTML = `
            <h4 style="margin: 0 0 10px; font-size: 18px;">${title}</h4>
            <p style="margin: 0 0 20px; font-size: 14px;">${message}</p>
            <button onclick="document.body.removeChild(this.parentNode)" style="padding: 8px 16px; background: #6366F1; color: white; border: none; border-radius: 4px; cursor: pointer;">OK</button>
        `;
        document.body.appendChild(alertBox);
    }
};


// Mocking react-native-paper components
const RNP = {
    Text: ({ style, children }) => <Text style={{...style, fontSize: 16}}>{children}</Text>,
    TextInput: (props) => <TextInput {...props} style={{...styles.inputMock, ...(props.mode === 'outlined' ? {border: '1px solid #999', borderRadius: 8} : {})}} />,
    Button: ({ mode, onPress, loading, disabled, children, icon, style }) => (
        <TouchableOpacity 
            onPress={onPress} 
            disabled={disabled || loading} 
            style={{
                ...styles.buttonMock,
                ...(mode === 'contained' ? styles.buttonContained : styles.buttonText),
                ...style,
                backgroundColor: disabled || loading ? '#A5B4FC' : styles.buttonContained.backgroundColor,
            }}
        >
            {loading ? <Text>Loading...</Text> : <Text style={mode === 'contained' ? styles.buttonTextMock : {}}>{icon ? `[${icon}] ` : ''}{children}</Text>}
        </TouchableOpacity>
    ),
    Card: ({ children, style }) => <View style={{...styles.cardMock, ...style}}>{children}</View>,
    Title: ({ style, children }) => <Text style={{...styles.titleMock, ...style}}>{children}</Text>,
    Subheading: ({ style, children }) => <Text style={{...styles.subtitleMock, ...style}}>{children}</Text>,
    Avatar: {
        Icon: ({ size, icon, style }) => (
            <View style={{...styles.avatarIconMock, ...style, width: size, height: size, borderRadius: size / 2 }}>
                <Text style={{fontSize: size / 2, color: 'white'}}>[ {icon} ]</Text>
            </View>
        ),
    },
};
const { Text: RNPText, TextInput: RNPTextInput, Button: RNPButton, Card, Avatar, Title, Subheading } = RNP;


// Mocking Context and Axios
const AuthContext = React.createContext({
    login: (user, token) => { console.log('Mock Login:', user, token); },
});
const axios = {
    post: async (url, data) => {
        console.log(`[Mock Axios] POST to ${url} with data:`, data);
        // Simulate a successful response after a short delay
        await new Promise(resolve => setTimeout(resolve, 500));
        if (data.email === 'error@test.com') {
            throw { response: { data: { error: 'User already exists or invalid credentials.' } } };
        }
        return { 
            data: { 
                token: 'mock_jwt_token_12345', 
                user: { email: data.email, name: 'Mock User' } 
            } 
        };
    }
};

// --- LOGIN SCREEN COMPONENT ---

const LoginScreen = ({ navigation }) => {
    // Mock navigation object since we are in a single file
    const mockNavigation = { navigate: (screen) => console.log(`[Navigation] Navigate to: ${screen}`) };
    navigation = navigation || mockNavigation;
    
    const [email, setEmail] = useState('user@example.com');
    const [password, setPassword] = useState('password123');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    
    // Get login function from mock context
    const { login } = useContext(AuthContext);

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
            // In a real app, process.env.EXPO_PUBLIC_API_URL should be used
            const response = await axios.post(
                `http://localhost:5000${endpoint}`,
                { email, password }
            );

            const { token, user } = response.data;
            // Use the login function from AuthContext to set global state and navigate
            login(user, token); 
            navigation.navigate('Main'); // Navigate manually after successful login context update

        } catch (error) {
            console.error('Auth Error:', error);
            // Display a custom error message
            Alert.alert(
                'Authentication Failed',
                error.response?.data?.error || 'Could not connect to the server or unknown error occurred.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Card style={styles.card}>
                    <View style={styles.contentContainer}>
                        <View style={styles.logoContainer}>
                            <Avatar.Icon 
                                size={80} 
                                icon="chat" 
                                style={styles.logo}
                            />
                            <Title style={styles.title}>Connecta</Title>
                            <Subheading style={styles.subtitle}>
                                {isSignUp ? 'Create your account' : 'Welcome back'}
                            </Subheading>
                        </View>

                        <RNPTextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            mode="outlined"
                            style={styles.input}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <RNPTextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            mode="outlined"
                            style={styles.input}
                            secureTextEntry
                        />

                        <RNPButton
                            mode="contained"
                            onPress={handleAuth}
                            loading={loading}
                            disabled={loading}
                            style={styles.button}
                        >
                            {isSignUp ? 'Sign Up' : 'Login'}
                        </RNPButton>

                        <RNPButton
                            mode="text"
                            onPress={() => setIsSignUp(!isSignUp)}
                            style={styles.switchButton}
                        >
                            {isSignUp 
                                ? 'Already have an account? Login' 
                                : "Don't have an account? Sign Up"
                            }
                        </RNPButton>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <RNPText style={styles.dividerText}>OR</RNPText>
                            <View style={styles.dividerLine} />
                        </View>

                        <RNPButton
                            mode="outlined"
                            icon="google"
                            onPress={() => {Alert.alert('Social Login', 'Google OAuth not implemented.');}}
                            style={styles.oauthButton}
                        >
                            Continue with Google
                        </RNPButton>

                        {/* This is conditional on Platform.OS being 'ios' in the original request, 
                            but we'll always show it in this mock for layout completeness. */}
                        <RNPButton
                            mode="outlined"
                            icon="apple"
                            onPress={() => {Alert.alert('Social Login', 'Apple OAuth not implemented.');}}
                            style={styles.oauthButton}
                        >
                            Continue with Apple
                        </RNPButton>
                        
                    </View>
                </Card>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        height: '100vh', // Ensure it fills the vertical viewport in web mock
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    contentContainer: {
        padding: 20,
    },
    // RNP Mock Styles
    cardMock: {
        backgroundColor: 'white',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        borderRadius: 12,
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
    },
    inputMock: {
        height: 50,
        fontSize: 16,
        marginBottom: 16,
    },
    buttonMock: {
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    buttonContained: {
        backgroundColor: '#6366F1', // Indigo-500
    },
    buttonText: {
        backgroundColor: 'transparent',
        boxShadow: 'none',
        color: '#6366F1',
    },
    buttonTextMock: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    titleMock: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#374151',
    },
    subtitleMock: {
        color: '#6B7280',
    },
    avatarIconMock: {
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    
    // Layout and specific styles
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        backgroundColor: '#6366F1',
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#374151',
    },
    subtitle: {
        color: '#6B7280',
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
        paddingVertical: 8,
    },
    switchButton: {
        marginTop: 16,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
        width: '100%',
        flex: 0, // Prevent flex expansion
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#6B7280',
        fontSize: 14,
    },
    oauthButton: {
        marginBottom: 12,
    },
});

export default LoginScreen;
