import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { signIn, signUp, signInWithGoogle } from '../services/authService';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';

const LoginScreen = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [familyId, setFamilyId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (!isLogin && (!familyId || !role)) {
            Alert.alert('Error', 'Please enter your Name and Group ID');
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                const result = await signIn(email, password);
                if (result.success) {
                    onLoginSuccess(result.user);
                } else {
                    Alert.alert('Login Failed', result.error);
                }
            } else {
                const result = await signUp(email, password, role, familyId.trim());
                if (result.success) {
                    onLoginSuccess(result.user);
                } else {
                    Alert.alert('Sign Up Failed', result.error);
                }
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const result = await signInWithGoogle();
            if (result.success) {
                onLoginSuccess(result.user);
            } else {
                if (result.error !== 'Sign in cancelled') {
                    Alert.alert('Google Login Failed', result.error);
                }
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/login-illustration.png')}
                        style={styles.illustration}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Grocery Shopping</Text>
                    <Text style={styles.subtitle}>
                        Shop together, stay connected
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={colors.textLight}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={colors.textLight}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                    />

                    {!isLogin && (
                        <>
                            {/* Name Input */}
                            <TextInput
                                style={styles.input}
                                placeholder="Your Name (e.g., Mom, Dad, John)"
                                placeholderTextColor={colors.textLight}
                                value={role}
                                onChangeText={setRole}
                                autoCapitalize="words"
                                autoCorrect={false}
                            />

                            {/* Group ID */}
                            <TextInput
                                style={styles.input}
                                placeholder="Group ID (e.g., smith-family)"
                                placeholderTextColor={colors.textLight}
                                value={familyId}
                                onChangeText={setFamilyId}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <Text style={styles.helperText}>
                                All group members must use the same Group ID to share the grocery list
                            </Text>
                        </>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.surface} />
                        ) : (
                            <Text style={styles.submitButtonText}>
                                {isLogin ? 'Login' : 'Sign Up'}
                            </Text>
                        )}
                    </TouchableOpacity>



                    {/* Google Login Button */}
                    <TouchableOpacity
                        style={[styles.googleButton, loading && styles.submitButtonDisabled]}
                        onPress={handleGoogleLogin}
                        disabled={loading}
                    >
                        <Image
                            source={require('../../assets/google-logo.png')}
                            style={styles.googleIcon}
                            resizeMode="contain"
                        />
                        <Text style={styles.googleButtonText}>Sign in with Google</Text>
                    </TouchableOpacity>

                    {/* Toggle Login/Signup */}
                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={() => setIsLogin(!isLogin)}
                    >
                        <Text style={styles.toggleText}>
                            {isLogin ? "Don't have an account? " : 'Already have an account? '}
                            <Text style={styles.toggleTextBold}>
                                {isLogin ? 'Sign Up' : 'Login'}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF5E6', // Warm cream background to match illustration
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    illustration: {
        width: 300,
        height: 200,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: typography.fontSizeXXL,
        fontWeight: typography.fontWeightBold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: typography.fontSizeMedium,
        color: colors.textSecondary,
    },
    formContainer: {
        width: '100%',
    },
    input: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        fontSize: typography.fontSizeMedium,
        color: colors.textPrimary,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.small,
    },
    roleContainer: {
        marginBottom: spacing.md,
    },
    roleLabel: {
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightMedium,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    roleButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    roleButton: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.medium,
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
    },
    roleButtonActive: {
        borderColor: 'transparent',
    },
    roleButtonText: {
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightMedium,
        color: colors.textSecondary,
    },
    roleButtonTextActive: {
        color: colors.surface,
        fontWeight: typography.fontWeightBold,
    },
    helperText: {
        fontSize: typography.fontSizeSmall,
        color: colors.textLight,
        marginBottom: spacing.md,
        fontStyle: 'italic',
    },
    submitButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        alignItems: 'center',
        marginTop: spacing.md,
        ...shadows.medium,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: colors.surface,
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightBold,
    },
    googleButton: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        alignItems: 'center',
        marginTop: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.small,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    googleIcon: {
        width: 24,
        height: 24,
        marginRight: spacing.xs,
        backgroundColor: colors.surface,
        borderRadius: 12, // Optional: makes it circular if the image is transparent
    },
    googleButtonText: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightBold,
    },
    toggleButton: {
        marginTop: spacing.lg,
        alignItems: 'center',
    },
    toggleText: {
        fontSize: typography.fontSizeMedium,
        color: colors.textSecondary,
    },
    toggleTextBold: {
        color: colors.primary,
        fontWeight: typography.fontWeightBold,
    },
});

export default LoginScreen;
