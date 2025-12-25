import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows, getColorForName } from '../styles/theme';

const GroceryItem = ({ item, onToggleBought, onDelete, currentUserId, userRole, isSelectionMode, isSelected }) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        if (isSelectionMode) {
            onToggleBought(item);
            return;
        }

        // Animate on press
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        onToggleBought(item);
    };

    const addedByColor = getColorForName(item.addedByRole);
    const isCurrentUserItem = item.addedBy === currentUserId;

    const getAddedByName = () => {
        return item.addedByName || item.addedByRole || 'Unknown';
    };

    const getBuyerName = () => {
        if (item.boughtBy === currentUserId) return 'Me'; // Or User's Name? User said "Purchased by Name", usually "Me" is clearer for self, but let's stick to Name if available or "Me". User request was specific "by Name". But "Purchased by Ramya" when I am Ramya is ok.
        // Actually for self, "Me" is standard. Let's keep "Me" for self?
        // User request: "like purchased by name not role".
        // Let's use name if available.
        if (item.boughtByName) return item.boughtByName;
        if (item.boughtBy === item.addedBy) return item.addedByRole; // Fallback to role if name missing
        return 'a Family Member';
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={() => onDelete(item)} // onDelete is now handleLongPress from parent
            onPress={isSelectionMode ? handlePress : undefined}
            delayLongPress={500}
        >
            <Animated.View style={[
                styles.container,
                { transform: [{ scale: scaleAnim }] },
                isSelectionMode && isSelected && styles.containerSelected
            ]}>
                <View
                    style={[
                        styles.itemCard,
                        item.isBought && !isSelectionMode && styles.itemCardBought,
                        isSelectionMode && isSelected && styles.itemCardSelected
                    ]}
                >
                    <View style={styles.leftSection}>
                        {/* Checkbox or Selection Circle */}
                        <TouchableOpacity
                            onPress={handlePress}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            disabled={isSelectionMode} // handled by parent touchable in selection mode
                        >
                            <View style={[
                                styles.checkbox,
                                isSelectionMode ? styles.selectionCircle : null,
                                !isSelectionMode && item.isBought && styles.checkboxChecked,
                                isSelectionMode && isSelected && styles.selectionCircleSelected
                            ]}>
                                {!isSelectionMode && item.isBought && <Text style={styles.checkmark}>✓</Text>}
                                {isSelectionMode && isSelected && <View style={styles.selectionDot} />}
                            </View>
                        </TouchableOpacity>

                        {/* Item details */}
                        <View style={styles.itemDetails}>
                            <View style={[
                                styles.itemName,
                                item.isBought && styles.itemNameBought,
                                { flexDirection: 'row', alignItems: 'center' }
                            ]}>
                                {item.emoji === ':sharpener:' ? (
                                    <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center', marginRight: 4 }}>
                                        <Image
                                            source={require('../../assets/sharpener.png')}
                                            style={{ width: 20, height: 20 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                ) : (
                                    <Text style={{ marginRight: 4 }}>{item.emoji}</Text>
                                )}
                                <Text style={[
                                    styles.itemNameText,
                                    item.isBought && styles.itemNameBought
                                ]}>
                                    {item.name}
                                </Text>
                            </View>
                            <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
                            <View style={styles.metaRow}>
                                <Text style={styles.itemMeta}>
                                    Added by {getAddedByName()}
                                </Text>
                                {item.isBought && item.boughtAt && (
                                    <Text style={styles.boughtText}>
                                        • ✅ Purchased by {getBuyerName()}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Role indicator badge */}
                    <View style={styles.rightSection}>
                        <View style={[styles.roleBadge, { backgroundColor: addedByColor }]}>
                            <Text style={styles.roleBadgeText}>
                                {item.addedByName ? item.addedByName.charAt(0).toUpperCase() : (item.addedByRole ? item.addedByRole.charAt(0).toUpperCase() : '?')}
                            </Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    itemCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...shadows.medium,
    },
    itemCardBought: {
        backgroundColor: colors.surfaceAlt,
        opacity: 0.7,
    },
    leftSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: borderRadius.small,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    checkboxChecked: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    checkmark: {
        color: colors.surface,
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightBold,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        marginBottom: 4,
    },
    itemNameText: {
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightMedium,
        color: colors.textPrimary,
    },
    itemNameBought: {
        textDecorationLine: 'line-through',
        color: colors.textSecondary,
    },
    quantityText: {
        fontSize: typography.fontSizeSmall,
        color: colors.primary,
        fontWeight: typography.fontWeightBold,
        marginTop: 2,
        marginBottom: 2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    itemMeta: {
        fontSize: typography.fontSizeSmall,
        color: colors.textSecondary,
    },
    boughtText: {
        fontSize: typography.fontSizeSmall,
        color: colors.success,
        marginLeft: spacing.sm,
        fontWeight: typography.fontWeightMedium,
    },
    roleBadge: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.round,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
    },
    roleBadgeText: {
        color: colors.surface,
        fontSize: typography.fontSizeSmall,
        fontWeight: typography.fontWeightBold,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    deleteButton: {
        padding: spacing.xs,
        marginLeft: spacing.xs,
    },
    deleteIcon: {
        fontSize: 18,
    },
    selectionCircle: {
        borderRadius: borderRadius.round,
        borderColor: colors.textSecondary,
    },
    selectionCircleSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    selectionDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.surface,
    },
    containerSelected: {
        // Optional: add visual pop for selected
    },
    itemCardSelected: {
        backgroundColor: colors.surfaceAlt,
        borderColor: colors.primary,
        borderWidth: 1,
    }
});

export default GroceryItem;
