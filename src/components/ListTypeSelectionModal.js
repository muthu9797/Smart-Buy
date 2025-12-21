import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TouchableWithoutFeedback,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';

const ListTypeSelectionModal = ({ visible, onClose, currentType, onSelect }) => {
    if (!visible) return null;

    const options = [
        { id: 'daily', label: 'Daily List', description: 'For immediate shopping needs' },
        { id: 'monthly', label: 'Monthly List', description: 'For bulk stock-up & planning' },
    ];

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContainer}>
                            <Text style={styles.title}>Select List Type</Text>

                            <View style={styles.optionsContainer}>
                                {options.map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        style={[
                                            styles.optionRow,
                                            currentType === option.id && styles.optionRowSelected
                                        ]}
                                        onPress={() => {
                                            onSelect(option.id);
                                            onClose();
                                        }}
                                    >
                                        <View style={styles.radioContainer}>
                                            <View style={[
                                                styles.radioOuter,
                                                currentType === option.id && styles.radioOuterSelected
                                            ]}>
                                                {currentType === option.id && <View style={styles.radioInner} />}
                                            </View>
                                        </View>
                                        <View style={styles.textContainer}>
                                            <Text style={[
                                                styles.optionLabel,
                                                currentType === option.id && styles.optionLabelSelected
                                            ]}>
                                                {option.label}
                                            </Text>
                                            <Text style={styles.optionDescription}>
                                                {option.description}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContainer: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.large,
        width: '100%',
        maxWidth: 340,
        padding: spacing.xl,
        ...shadows.medium,
    },
    title: {
        fontSize: typography.fontSizeLarge,
        fontWeight: typography.fontWeightBold,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    optionsContainer: {
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.medium,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    optionRowSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.surfaceAlt,
    },
    radioContainer: {
        marginRight: spacing.md,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.textLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: colors.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
    },
    textContainer: {
        flex: 1,
    },
    optionLabel: {
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightMedium,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    optionLabelSelected: {
        color: colors.primary,
        fontWeight: typography.fontWeightBold,
    },
    optionDescription: {
        fontSize: typography.fontSizeSmall,
        color: colors.textSecondary,
    },
    cancelButton: {
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: typography.fontSizeMedium,
        color: colors.textSecondary,
        fontWeight: typography.fontWeightMedium,
    },
});

export default ListTypeSelectionModal;
