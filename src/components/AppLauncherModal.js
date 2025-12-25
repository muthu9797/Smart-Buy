import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';

const { width } = Dimensions.get('window');

const AppLauncherModal = ({ visible, onClose, onNavigate }) => {
    const apps = [
        { id: 'grocery', name: 'Grocery List', icon: 'shopping-cart', color: '#4CAF50' }, // Green
        { id: 'todo', name: 'To-Do List', icon: 'check-box', color: '#2196F3' }, // Blue
        { id: 'chat', name: 'Chat Box', icon: 'chat', color: '#9C27B0' }, // Purple
    ];

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                {/* 
                   Positioning: The popup in the reference image is top-right, below the profile/grid.
                   We'll position it relatively or absolute top-right.
                */}
                <View style={styles.popupContainer}>
                    <View style={styles.gridContainer}>
                        {apps.map((app) => (
                            <TouchableOpacity
                                key={app.id}
                                style={styles.appItem}
                                onPress={() => {
                                    onNavigate(app.id);
                                    onClose();
                                }}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: app.color + '20' }]}>
                                    <MaterialIcons name={app.icon} size={32} color={app.color} />
                                </View>
                                <Text style={styles.appName}>{app.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.1)', // Very subtle dimming if any
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60, // approximate header height
        paddingRight: spacing.md,
    },
    popupContainer: {
        width: 300,
        backgroundColor: '#1E1E1E', // Dark background like reference
        borderRadius: borderRadius.large,
        padding: spacing.lg,
        ...shadows.large,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    appItem: {
        width: '30%', // 3 items per row roughly
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16, // Squircle shape
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    appName: {
        color: '#FFF',
        fontSize: typography.fontSizeSmall,
        textAlign: 'center',
        fontWeight: typography.fontWeightMedium,
    }
});

export default AppLauncherModal;
