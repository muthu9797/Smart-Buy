import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius, shadows } from '../styles/theme';

const SettingsScreen = ({ navigation }) => {
    const { isDarkMode, toggleTheme, colors } = useTheme();

    const styles = createStyles(colors);

    return (
        <View style={styles.container}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Appearance Section */}
                <Text style={styles.sectionTitle}>Appearance</Text>
                <View style={styles.section}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <MaterialIcons
                                name={isDarkMode ? "dark-mode" : "light-mode"}
                                size={24}
                                color={isDarkMode ? colors.accent : colors.primary}
                            />
                            <View style={styles.settingText}>
                                <Text style={styles.settingTitle}>Dark Mode</Text>
                                <Text style={styles.settingDescription}>
                                    {isDarkMode ? 'Currently using dark theme' : 'Currently using light theme'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.border, true: colors.accentLight }}
                            thumbColor={isDarkMode ? colors.accent : colors.surface}
                        />
                    </View>
                </View>

                {/* About Section */}
                <Text style={styles.sectionTitle}>About</Text>
                <View style={styles.section}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <MaterialIcons name="info" size={24} color={colors.primary} />
                            <View style={styles.settingText}>
                                <Text style={styles.settingTitle}>Version</Text>
                                <Text style={styles.settingDescription}>1.0.0</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        paddingTop: spacing.xxl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...shadows.small,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
        color: colors.textPrimary,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.fontSizeSmall,
        fontWeight: typography.fontWeightBold,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
        marginLeft: spacing.sm,
    },
    section: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.medium,
        ...shadows.small,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingText: {
        marginLeft: spacing.md,
        flex: 1,
    },
    settingTitle: {
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightMedium,
        color: colors.textPrimary,
    },
    settingDescription: {
        fontSize: typography.fontSizeSmall,
        color: colors.textSecondary,
        marginTop: 2,
    },
});

export default SettingsScreen;
