import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getUserProfile } from '../services/authService';
import { getMessages, sendMessage, subscribeToMessages } from '../services/chatService';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';

const ChatScreen = ({ user, navigation }) => {
    const { isDarkMode, colors: themeColors } = useTheme();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const flatListRef = useRef(null);

    // Initial Load
    useEffect(() => {
        const loadData = async () => {
            if (!user) return;

            // 1. Get Profile
            const profileRes = await getUserProfile(user.id);
            if (profileRes.success) {
                setUserProfile(profileRes.profile);

                // 2. Get Messages
                const msgsRes = await getMessages(profileRes.profile.familyId);
                if (msgsRes.success) {
                    setMessages(msgsRes.messages);
                    // Scroll to bottom after loading
                    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
                }
            }
            setLoading(false);
        };
        loadData();
    }, [user]);

    // Real-time Subscription
    useEffect(() => {
        let subscription;
        if (userProfile?.familyId) {
            subscription = subscribeToMessages(userProfile.familyId, (newMessage) => {
                setMessages(prev => {
                    // Avoid duplicates if we already added it locally (optimistic) - though here we rely on server response mostly
                    if (prev.find(m => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
                // Scroll to bottom on new message
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            });
        }
        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [userProfile]);

    const handleSend = async () => {
        if (!inputText.trim() || !userProfile) return;

        const content = inputText.trim();
        setInputText('');
        setSending(true);

        const result = await sendMessage(
            userProfile.familyId,
            user.id,
            userProfile.fullName || 'Unknown',
            content
        );

        if (!result.success) {
            console.error('Failed to send:', result.error);
            // Show error to user for debugging
            Alert.alert('Send Failed', result.error);
            setInputText(content); // Restore text on failure
        }
        setSending(false);
    };

    const renderMessage = ({ item }) => {
        const isMe = item.user_id === user.id;

        // Format time
        const timeString = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <View style={[
                styles.messageContainer,
                isMe ? styles.myMessageContainer : styles.otherMessageContainer
            ]}>
                {!isMe && (
                    <Text style={[styles.senderName, { color: themeColors.textSecondary }]}>
                        {item.user_name || 'Family Member'}
                    </Text>
                )}
                <View style={[
                    styles.bubble,
                    isMe ?
                        [styles.myBubble, { backgroundColor: '#DCF8C6' }] : // WhatsApp green (light) - adjust for dark mode below
                        [styles.otherBubble, { backgroundColor: themeColors.surfaceAlt }]
                ]}>
                    {/* Dark mode overrides for bubble colors */}
                    <View style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: isMe ?
                                (isDarkMode ? themeColors.primary : '#DCF8C6') :
                                (isDarkMode ? themeColors.surface : '#FFFFFF'),
                            borderRadius: borderRadius.medium,
                            opacity: isMe && isDarkMode ? 0.3 : 1 // Tint for dark mode primary
                        }
                    ]} />

                    {/* Accessing proper background for text contrast */}
                    <View style={[
                        styles.bubbleContent,
                        {
                            backgroundColor: isMe ?
                                (isDarkMode ? themeColors.primary : '#DCF8C6') :
                                (isDarkMode ? themeColors.surface : '#FFFFFF'),
                            borderRadius: borderRadius.medium
                        }
                    ]}>
                        <Text style={[
                            styles.messageText,
                            { color: isMe ? (isDarkMode ? '#FFFFFF' : '#000000') : themeColors.textPrimary }
                        ]}>
                            {item.content}
                        </Text>
                        <Text style={[
                            styles.timestamp,
                            { color: isMe ? (isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.45)') : themeColors.textSecondary }
                        ]}>
                            {timeString}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={themeColors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>Family Chat</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={themeColors.primary} />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    />
                )}

                <View style={[styles.inputContainer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: themeColors.background,
                            color: themeColors.textPrimary,
                            borderColor: themeColors.border
                        }]}
                        placeholder="Type a message..."
                        placeholderTextColor={themeColors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: themeColors.primary, opacity: !inputText.trim() ? 0.5 : 1 }]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending}
                    >
                        <MaterialIcons name="send" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        paddingTop: Platform.OS === 'android' ? 40 : spacing.md, // Adjust for status bar
        borderBottomWidth: 1,
        ...shadows.small,
        elevation: 2,
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        fontSize: typography.fontSizeLarge,
        fontWeight: typography.fontWeightBold,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: spacing.lg,
    },
    messageContainer: {
        marginBottom: spacing.md,
        maxWidth: '80%',
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    otherMessageContainer: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },
    senderName: {
        fontSize: typography.fontSizeSmall,
        marginBottom: 2,
        marginLeft: 4,
    },
    bubble: {
        borderRadius: borderRadius.medium,
        ...shadows.small,
        overflow: 'hidden', // Contain the background color views
    },
    bubbleContent: {
        padding: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    messageText: {
        fontSize: typography.fontSizeMedium,
    },
    timestamp: {
        fontSize: 10,
        textAlign: 'right',
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        maxHeight: 100,
        marginRight: spacing.md,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ChatScreen;
