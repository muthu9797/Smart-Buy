import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';

const { height } = Dimensions.get('window');

const TodoOptionsModal = ({ visible, onClose, onSelectItems, onClearCompleted, onClearAll }) => {
    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
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
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: height,
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

    const handleOption = (action) => {
        // Close first then execute
        onClose();
        setTimeout(action, 300);
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={onClose}
            animationType="none"
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                    <TouchableWithoutFeedback>
                        <Animated.View style={[
                            styles.content,
                            { transform: [{ translateY: slideAnim }] }
                        ]}>
                            <View style={styles.handle} />
                            <Text style={styles.title}>Task Options</Text>

                            <TouchableOpacity
                                style={styles.option}
                                onPress={() => handleOption(onSelectItems)}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                                    <MaterialIcons name="checklist" size={24} color={colors.surface} />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.optionTitle}>Select Items to Delete</Text>
                                    <Text style={styles.optionDescription}>Pick multiple tasks to remove</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color={colors.textLight} />
                            </TouchableOpacity>

                            <View style={styles.separator} />

                            <TouchableOpacity
                                style={styles.option}
                                onPress={() => handleOption(onClearCompleted)}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: colors.success }]}>
                                    <MaterialIcons name="task-alt" size={24} color={colors.surface} />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.optionTitle}>Clear Completed</Text>
                                    <Text style={styles.optionDescription}>Remove only finished tasks</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color={colors.textLight} />
                            </TouchableOpacity>

                            <View style={styles.separator} />

                            <TouchableOpacity
                                style={styles.option}
                                onPress={() => handleOption(onClearAll)}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: colors.error }]}>
                                    <MaterialIcons name="delete-forever" size={24} color={colors.surface} />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={[styles.optionTitle, { color: colors.error }]}>Clear All</Text>
                                    <Text style={styles.optionDescription}>Delete all tasks from the list</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color={colors.textLight} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            {/* Safe area spacer */}
                            <View style={{ height: 20 }} />
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg,
        ...shadows.large,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: typography.fontSizeLarge,
        fontWeight: typography.fontWeightBold,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.round,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightMedium,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    optionDescription: {
        fontSize: typography.fontSizeSmall,
        color: colors.textSecondary,
    },
    separator: {
        height: 1,
        backgroundColor: colors.border,
        marginLeft: 56, // Align with text
    },
    cancelButton: {
        marginTop: spacing.lg,
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.surfaceAlt,
        borderRadius: borderRadius.medium,
    },
    cancelText: {
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightBold,
        color: colors.textPrimary,
    },
});

export default TodoOptionsModal;
