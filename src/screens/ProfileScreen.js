import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { logOut, getUserProfile, updateUserProfile } from '../services/authService';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';

const ProfileScreen = ({ user, onLogout }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editRole, setEditRole] = useState('wife');
    const [editFullName, setEditFullName] = useState('');
    const [editFamilyId, setEditFamilyId] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const result = await getUserProfile(user.id);
        if (result.success) {
            setUserProfile(result.profile);
            setUserProfile(result.profile);
            setEditRole(result.profile.role);
            setEditFullName(result.profile.fullName || '');
            setEditFamilyId(result.profile.familyId);
        }
        setLoading(false);
    };

    const handleSaveProfile = async () => {
        if (!editFamilyId.trim()) {
            Alert.alert('Error', 'Group ID cannot be empty');
            return;
        }

        setSaving(true);
        const result = await updateUserProfile(user.id, {
            role: editRole,
            fullName: editFullName.trim(),
            familyId: editFamilyId.trim()
        });

        if (result.success) {
            setUserProfile({
                ...userProfile,
                role: editRole,
                fullName: editFullName.trim(),
                familyId: editFamilyId.trim()
            });
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully');
        } else {
            Alert.alert('Error', 'Failed to update profile: ' + result.error);
        }
        setSaving(false);
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await logOut();
                        if (result.success) {
                            onLogout();
                        } else {
                            Alert.alert('Error', 'Failed to logout');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    const roleColor = userProfile?.role === 'wife' ? colors.wifeColor : colors.husbandColor;
    const roleEmoji = userProfile?.role === 'wife' ? '👩' : '👨';

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: roleColor }]}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerEmoji}>{roleEmoji}</Text>
                    <Text style={styles.headerTitle}>
                        {userProfile?.fullName || (userProfile?.role === 'wife' ? 'She' : 'He')}
                    </Text>
                </View>
                {!isEditing && (
                    <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Profile Info */}
            <View style={styles.content}>
                {isEditing ? (
                    <View style={styles.editForm}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Gender</Text>
                            <View style={styles.roleSelector}>
                                <TouchableOpacity
                                    style={[styles.roleOption, editRole === 'wife' && styles.roleOptionSelected]}
                                    onPress={() => setEditRole('wife')}
                                >
                                    <Text style={styles.roleOptionText}>👩 She</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleOption, editRole === 'husband' && styles.roleOptionSelected]}
                                    onPress={() => setEditRole('husband')}
                                >
                                    <Text style={styles.roleOptionText}>👨 He</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editFullName}
                                onChangeText={setEditFullName}
                                placeholder="Enter your name"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Group ID</Text>
                            <TextInput
                                style={styles.input}
                                value={editFamilyId}
                                onChangeText={setEditFamilyId}
                                placeholder="Enter Group ID"
                            />
                            <Text style={styles.helperText}>Share this ID with your group members.</Text>
                        </View>

                        <View style={styles.editActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => {
                                setIsEditing(false);
                                setEditRole(userProfile.role);
                                setEditFullName(userProfile.fullName || '');
                                setEditFamilyId(userProfile.familyId);
                            }}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={saving}>
                                {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{userProfile?.email}</Text>
                        </View>

                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Name</Text>
                            <Text style={styles.infoValue}>{userProfile?.fullName || 'Not set'}</Text>
                        </View>

                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Gender</Text>
                            <Text style={styles.infoValue}>
                                {userProfile?.role === 'wife' ? 'She 👩' : 'He 👨'}
                            </Text>
                        </View>

                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Group ID</Text>
                            <Text style={styles.infoValue}>{userProfile?.familyId}</Text>
                        </View>
                    </>
                )}

                {/* About */}
                <View style={styles.aboutCard}>
                    <Text style={styles.aboutTitle}>About This App</Text>
                    <Text style={styles.aboutText}>
                        This grocery shopping app helps couples coordinate their shopping together.
                        Add items to the shared list, get notified when group members add something,
                        and mark items as bought to keep everyone in sync! 🛒
                    </Text>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.xxl,
        paddingTop: spacing.xxl * 2,
        alignItems: 'center',
        position: 'relative',
    },
    headerContent: {
        alignItems: 'center',
    },
    editButton: {
        position: 'absolute',
        top: spacing.xxl * 1.5,
        right: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.round,
    },
    editButtonText: {
        color: colors.surface,
        fontWeight: typography.fontWeightBold,
    },
    headerEmoji: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    headerTitle: {
        fontSize: typography.fontSizeXXL,
        fontWeight: typography.fontWeightBold,
        color: colors.surface,
    },
    content: {
        padding: spacing.lg,
    },
    infoCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.small,
    },
    infoLabel: {
        fontSize: typography.fontSizeSmall,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightMedium,
        color: colors.textPrimary,
    },
    aboutCard: {
        backgroundColor: colors.surfaceAlt,
        borderRadius: borderRadius.medium,
        padding: spacing.lg,
        marginTop: spacing.md,
        marginBottom: spacing.xl,
    },
    aboutTitle: {
        fontSize: typography.fontSizeLarge,
        fontWeight: typography.fontWeightBold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    aboutText: {
        fontSize: typography.fontSizeMedium,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    logoutButton: {
        backgroundColor: colors.error,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        alignItems: 'center',
        ...shadows.medium,
    },
    logoutButtonText: {
        color: colors.surface,
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightBold,
    },
    editForm: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        ...shadows.medium,
        marginBottom: spacing.md,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    inputLabel: {
        fontSize: typography.fontSizeSmall,
        fontWeight: typography.fontWeightBold,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.small,
        padding: spacing.md,
        fontSize: typography.fontSizeMedium,
        backgroundColor: colors.background,
    },
    helperText: {
        fontSize: 12,
        color: colors.textLight,
        marginTop: 4,
    },
    roleSelector: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    roleOption: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    roleOptionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.surfaceAlt,
        borderWidth: 2,
    },
    roleOptionText: {
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightMedium,
    },
    editActions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.sm,
    },
    saveButton: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        alignItems: 'center',
    },
    saveButtonText: {
        color: colors.surface,
        fontWeight: typography.fontWeightBold,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: colors.surfaceAlt,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontWeight: typography.fontWeightBold,
    },
});

export default ProfileScreen;
