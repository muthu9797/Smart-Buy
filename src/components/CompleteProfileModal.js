import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { updateUserProfile } from '../services/authService';

const CompleteProfileModal = ({ visible, user, onSaveSuccess }) => {
    const [fullName, setFullName] = useState('');
    const [familyId, setFamilyId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!fullName.trim() || !familyId.trim()) {
            Alert.alert('Error', 'Please fill in all fields to continue.');
            return;
        }

        setLoading(true);

        const updates = {
            fullName: fullName.trim(),
            familyId: familyId.trim(),
            email: user?.email,
            role: 'member' // Default role for Google users, can be changed later
        };

        const result = await updateUserProfile(user.id, updates);

        setLoading(false);

        if (result.success) {
            onSaveSuccess(result.data);
        } else {
            Alert.alert('Error', 'Failed to save profile: ' + result.error);
        }
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => { }} // Prevent back button closing
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Complete Your Profile</Text>
                    <Text style={styles.subtitle}>
                        Welcome! To join your family grocery list, please tell us who you are.
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Display Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Dad, Mom, Sarah"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Group ID (Family Code)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. smith-family"
                            value={familyId}
                            onChangeText={setFamilyId}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <Text style={styles.helperText}>
                            Share this ID with your family to sync lists.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save & Join</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.large,
        padding: spacing.xl,
        ...shadows.medium,
    },
    title: {
        fontSize: typography.fontSizeLarge,
        fontWeight: typography.fontWeightBold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: typography.fontSizeSmall,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightMedium,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        fontSize: typography.fontSizeMedium,
        color: colors.textPrimary,
    },
    helperText: {
        fontSize: typography.fontSizeTiny,
        color: colors.textLight,
        marginTop: spacing.xs,
        fontStyle: 'italic',
    },
    saveButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: typography.fontSizeMedium,
        fontWeight: 'bold',
    },
});

export default CompleteProfileModal;
