import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
    Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { colors, spacing, typography, borderRadius, shadows, getColorForName } from '../styles/theme';

const { width, height } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75; // Menu takes 75% of screen width

const SideMenu = ({ visible, onClose, userProfile, onNavigateProfile, onNavigateSettings, onLogout }) => {
    const { isDarkMode, colors: themeColors } = useTheme();
    const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current; // Start off-screen left
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Open
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Close
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -MENU_WIDTH,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    if (!visible && slideAnim._value === -MENU_WIDTH) return null; // Optimization? Or just rely on zIndex/pointerEvents

    // Helper for Avatar Color
    const avatarColor = userProfile?.role ? getColorForName(userProfile.role) : colors.primary;

    return (
        <View style={[styles.overlay, !visible && { pointerEvents: 'none' }]}>
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
            </TouchableWithoutFeedback>

            {/* Menu Drawer */}
            <Animated.View style={[
                styles.drawer,
                { transform: [{ translateX: slideAnim }], backgroundColor: themeColors.surface }
            ]}>
                {/* Header / User Info */}
                <View style={[styles.menuHeader, { borderBottomColor: themeColors.border }]}>
                    <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                        <Text style={styles.avatarText}>
                            {userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : (userProfile?.role === 'wife' ? 'S' : (userProfile?.role === 'husband' ? 'H' : '?'))}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: themeColors.textPrimary }]}>
                            {userProfile?.fullName || (userProfile?.role === 'wife' ? 'She' : (userProfile?.role === 'husband' ? 'He' : 'Guest'))}
                        </Text>
                        <Text style={[styles.userFamily, { color: themeColors.textSecondary }]}>Group: {userProfile?.familyId}</Text>
                    </View>
                </View>

                {/* Navigation Items */}
                <View style={styles.menuItems}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onNavigateProfile(); }}>
                        <MaterialIcons name="person" size={24} color={themeColors.textPrimary} style={styles.menuIcon} />
                        <Text style={[styles.menuItemText, { color: themeColors.textPrimary }]}>Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onNavigateSettings && onNavigateSettings(); }}>
                        <MaterialIcons name="settings" size={24} color={themeColors.textPrimary} style={styles.menuIcon} />
                        <Text style={[styles.menuItemText, { color: themeColors.textPrimary }]}>Settings</Text>
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

                    <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onLogout(); }}>
                        <MaterialIcons name="logout" size={24} color={themeColors.error} style={styles.menuIcon} />
                        <Text style={[styles.menuItemText, { color: themeColors.error }]}>Log Out</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
                    <Text style={[styles.versionText, { color: themeColors.textLight }]}>Grocery App v1.0</Text>
                </View>

            </Animated.View >
        </View >
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        zIndex: 1000, // Above everything
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: MENU_WIDTH,
        height: height,
        backgroundColor: colors.surface,
        ...shadows.large,
        paddingTop: spacing.xxl, // Safe area
    },
    menuHeader: {
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        color: colors.surface,
        fontSize: typography.fontSizeLarge,
        fontWeight: typography.fontWeightBold,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: typography.fontSizeLarge,
        fontWeight: typography.fontWeightBold,
        color: colors.textPrimary,
    },
    userFamily: {
        fontSize: typography.fontSizeSmall,
        color: colors.textSecondary,
    },
    menuItems: {
        flex: 1,
        paddingVertical: spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    menuIcon: {
        marginRight: spacing.lg,
    },
    menuItemText: {
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightMedium,
        color: colors.textPrimary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.md,
        marginHorizontal: spacing.lg,
    },
    footer: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'center',
    },
    versionText: {
        fontSize: typography.fontSizeSmall,
        color: colors.textLight,
    },
});

export default SideMenu;
