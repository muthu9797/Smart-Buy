import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Animated,
    FlatList,
    ActivityIndicator,
    Image,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { COMMON_ITEMS, units } from '../data/commonItems';

import { getSmartSuggestions } from '../services/aiService';

const AddItemModal = ({ visible, onClose, onAdd, onEdit, initialItem, currentItems }) => {
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [unit, setUnit] = useState('pcs');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showBrowser, setShowBrowser] = useState(false);
    const [expandedItem, setExpandedItem] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [aiSuggestions, setAiSuggestions] = useState([]); // New state for AI
    const [isLoadingAI, setIsLoadingAI] = useState(false); // Loading state
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [feedbackItemId, setFeedbackItemId] = useState(null);
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    // Debounce timer ref
    const debounceTimer = React.useRef(null);

    const categories = [...new Set(COMMON_ITEMS.map(item => item.category))];

    React.useEffect(() => {
        if (visible) {
            if (initialItem) {
                setItemName(initialItem.name);
                // Parse quantity and unit from string "1 kg"
                const parts = initialItem.quantity.split(' ');
                if (parts.length >= 2) {
                    setQuantity(parts[0]);
                    setUnit(parts[1]);
                } else {
                    setQuantity(initialItem.quantity);
                    setUnit('pcs');
                }
            } else {
                resetForm();
            }

            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
            setShowSuggestions(false);
            setShowBrowser(false);
            setSelectedCategory(null);
            setExpandedItem(null);
            setFeedbackItemId(null);
            setAiSuggestions([]);
        }
    }, [visible, initialItem]);

    const resetForm = () => {
        setItemName('');
        setQuantity('1');
        setUnit('pcs');
        setShowSuggestions(false);
        setShowBrowser(false);
        setSelectedCategory(null);
        setExpandedItem(null);
        setFeedbackItemId(null);
        setAiSuggestions([]);
    };

    const handleItemNameChange = (text) => {
        setItemName(text);

        // Clear previous timer
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (text.length > 0) {
            // 1. Local Suggestions (Immediate)
            const filtered = COMMON_ITEMS.filter(item =>
                item.name.toLowerCase().includes(text.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(true);

            // 2. AI Suggestions (Debounced)
            if (text.length > 2) {
                setIsLoadingAI(true);
                debounceTimer.current = setTimeout(async () => {
                    const smartSuggestions = await getSmartSuggestions(text);
                    // Filter out items that are already in local suggestions to avoid duplicates
                    const newAiSuggestions = smartSuggestions.filter(aiItem =>
                        !filtered.some(local => local.name.toLowerCase() === aiItem.name.toLowerCase())
                    );
                    setAiSuggestions(newAiSuggestions);
                    setIsLoadingAI(false);
                }, 800); // 800ms delay
            } else {
                setAiSuggestions([]);
                setIsLoadingAI(false);
            }
        } else {
            setSuggestions([]);
            setAiSuggestions([]);
            setShowSuggestions(false);
            setIsLoadingAI(false);
        }
    };

    const handleSuggestionPress = (item) => {
        setItemName(item.name);
        setShowSuggestions(false);
    };

    const handleBrowserItemPress = (item) => {
        if (expandedItem === item.name) {
            setExpandedItem(null);
        } else {
            setExpandedItem(item.name);
            setItemName(item.name);
            setQuantity('1');
            setUnit('pcs');
        }
    };

    const handleSubmit = async () => {
        if (itemName.trim() === '') {
            return;
        }

        setIsSubmitting(true);
        const finalQuantity = `${quantity} ${unit}`;

        // Find emoji for the item (check local first, then AI, then default)
        let emoji = '🛒';
        const matchedItem = COMMON_ITEMS.find(item =>
            item.name.toLowerCase() === itemName.trim().toLowerCase()
        );

        if (matchedItem) {
            emoji = matchedItem.emoji;
        } else {
            const matchedAI = aiSuggestions.find(item =>
                item.name.toLowerCase() === itemName.trim().toLowerCase()
            );
            if (matchedAI) emoji = matchedAI.emoji;
        }

        if (initialItem) {
            await onEdit(initialItem.id, itemName.trim(), finalQuantity, emoji);
        } else {
            await onAdd(itemName.trim(), finalQuantity, emoji);
        }

        setIsSubmitting(false);

        if (showBrowser) {
            // If in browser mode, show feedback and keep modal open
            const currentItem = expandedItem;
            setFeedbackItemId(currentItem);
            setTimeout(() => {
                setFeedbackItemId(null);
            }, 1500);
        } else {
            resetForm();
            onClose();
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleQuantityChange = (text) => {
        // Allow only numbers and up to 2 decimal places
        if (/^\d*\.?\d{0,2}$/.test(text)) {
            setQuantity(text);
        }
    };

    const renderBrowser = () => (
        <View style={styles.browserContainer}>
            <View style={styles.browserHeader}>
                <TouchableOpacity
                    onPress={() => {
                        if (selectedCategory) {
                            setSelectedCategory(null);
                            setExpandedItem(null);
                        } else {
                            setShowBrowser(false);
                        }
                    }}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>
                        {selectedCategory ? '← Back' : '← Close'}
                    </Text>
                </TouchableOpacity>
                <Text style={styles.browserTitle}>
                    {selectedCategory || 'Browse Categories'}
                </Text>
            </View>

            <FlatList
                data={selectedCategory
                    ? COMMON_ITEMS.filter(item => item.category === selectedCategory)
                    : categories
                }
                keyExtractor={(item) => selectedCategory ? item.name : item}
                renderItem={({ item }) => {
                    if (!selectedCategory) {
                        // Category Item
                        return (
                            <TouchableOpacity
                                style={styles.browserItem}
                                onPress={() => setSelectedCategory(item)}
                            >
                                <Text style={styles.browserItemText}>{item}</Text>
                                <Text style={styles.arrow}>›</Text>
                            </TouchableOpacity>
                        );
                    }

                    // Grocery Item
                    const isExpanded = expandedItem === item.name;
                    // Check if item is already in list (pending only)
                    const isAdded = currentItems && currentItems.some(
                        existing => !existing.isBought && existing.name.toLowerCase() === item.name.toLowerCase()
                    );

                    return (
                        <View style={styles.browserItemContainer}>
                            <TouchableOpacity
                                style={[styles.browserItem, isExpanded && styles.browserItemExpanded]}
                                onPress={() => handleBrowserItemPress(item)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    {item.emoji === ':sharpener:' ? (
                                        <Image
                                            source={require('../../assets/sharpener.png')}
                                            style={{ width: 22, height: 22, marginRight: 8 }}
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <Text style={{ fontSize: 20, marginRight: 8 }}>{item.emoji}</Text>
                                    )}
                                    <Text style={[styles.browserItemText, isExpanded && styles.browserItemTextExpanded, { flex: 1 }]}>
                                        {item.name}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {isAdded && <Text style={styles.addedIndicator}>✓ </Text>}
                                    <Text style={styles.arrow}>{isExpanded ? '▼' : '›'}</Text>
                                </View>
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.inlineCustomization}>
                                    <View style={styles.inlineRow}>
                                        <View style={styles.inlineQuantity}>
                                            <Text style={styles.inlineLabel}>Qty:</Text>
                                            <TextInput
                                                style={styles.inlineInput}
                                                value={quantity}
                                                onChangeText={handleQuantityChange}
                                                keyboardType="decimal-pad"
                                                selectTextOnFocus
                                            />
                                        </View>
                                        <FlatList
                                            data={units}
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            keyExtractor={u => u}
                                            style={styles.inlineUnits}
                                            contentContainerStyle={styles.inlineUnitsContent}
                                            renderItem={({ item: u }) => (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.inlineUnitButton,
                                                        unit === u && styles.inlineUnitButtonSelected
                                                    ]}
                                                    onPress={() => setUnit(u)}
                                                >
                                                    <Text style={[
                                                        styles.inlineUnitText,
                                                        unit === u && styles.inlineUnitTextSelected
                                                    ]}>{u}</Text>
                                                </TouchableOpacity>
                                            )}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={[
                                            styles.inlineAddButton,
                                            feedbackItemId === item.name && styles.inlineAddButtonSuccess
                                        ]}
                                        onPress={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        <Text style={styles.inlineAddButtonText}>
                                            {feedbackItemId === item.name ? '✓ Added!' : 'Add to List'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    );
                }}
                style={styles.browserList}
            />
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
                    <View style={styles.modalHandle} />

                    {showBrowser ? renderBrowser() : (
                        <>
                            <View style={styles.headerRow}>
                                <Text style={styles.modalTitle}>
                                    {initialItem ? 'Edit Grocery Item' : 'Add Grocery Item'}
                                </Text>
                                <TouchableOpacity
                                    style={styles.browseButton}
                                    onPress={() => setShowBrowser(true)}
                                >
                                    <Text style={styles.browseButtonText}>📋 Browse</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter item name (e.g., Milk, Bread...)"
                                    placeholderTextColor={colors.textLight}
                                    value={itemName}
                                    onChangeText={handleItemNameChange}
                                    autoFocus
                                    returnKeyType="next"
                                />
                                {(showSuggestions || aiSuggestions.length > 0) && (
                                    <View style={styles.suggestionsContainer}>
                                        <FlatList
                                            data={[...suggestions, ...aiSuggestions]}
                                            keyExtractor={(item) => item.name}
                                            keyboardShouldPersistTaps="handled"
                                            renderItem={({ item }) => {
                                                const isAI = !COMMON_ITEMS.some(c => c.name === item.name);
                                                return (
                                                    <TouchableOpacity
                                                        style={styles.suggestionItem}
                                                        onPress={() => handleSuggestionPress(item)}
                                                    >
                                                        <View style={styles.suggestionTextContainer}>
                                                            {item.emoji === ':sharpener:' ? (
                                                                <Image
                                                                    source={require('../../assets/sharpener.png')}
                                                                    style={{ width: 20, height: 20, marginRight: 8 }}
                                                                    resizeMode="contain"
                                                                />
                                                            ) : (
                                                                <Text style={styles.suggestionEmoji}>{item.emoji} </Text>
                                                            )}
                                                            <Text style={styles.suggestionTextInner}>
                                                                {item.name}
                                                            </Text>
                                                        </View>
                                                        {isAI && <Text style={styles.aiBadge}>✨ Gemini</Text>}
                                                    </TouchableOpacity>
                                                );
                                            }}
                                            style={styles.suggestionsList}
                                            ListFooterComponent={isLoadingAI ? (
                                                <View style={styles.aiLoading}>
                                                    <ActivityIndicator size="small" color={colors.primary} />
                                                    <Text style={styles.aiLoadingText}>Gemini is thinking...</Text>
                                                </View>
                                            ) : null}
                                        />
                                    </View>
                                )}
                            </View>

                            <View style={styles.quantityContainer}>
                                <Text style={styles.label}>Quantity:</Text>
                                <TextInput
                                    style={styles.quantityInput}
                                    placeholder="1.00"
                                    placeholderTextColor={colors.textLight}
                                    value={quantity}
                                    onChangeText={handleQuantityChange}
                                    keyboardType="decimal-pad"
                                    returnKeyType="done"
                                />
                            </View>

                            <View style={styles.unitContainer}>
                                {units.map((u) => (
                                    <TouchableOpacity
                                        key={u}
                                        style={[
                                            styles.unitButton,
                                            unit === u && styles.unitButtonSelected
                                        ]}
                                        onPress={() => setUnit(u)}
                                    >
                                        <Text style={[
                                            styles.unitButtonText,
                                            unit === u && styles.unitButtonTextSelected
                                        ]}>
                                            {u}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={handleClose}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.button,
                                        styles.addButton,
                                        (itemName.trim() === '' || isSubmitting) && styles.addButtonDisabled
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={itemName.trim() === '' || isSubmitting}
                                >
                                    <Text style={styles.addButtonText}>
                                        {isSubmitting ? 'Saving...' : (initialItem ? 'Save Changes' : 'Add Item')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.xl,
        paddingBottom: spacing.xxl,
        ...shadows.large,
        maxHeight: '90%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    inputContainer: {
        zIndex: 1, // Ensure suggestions appear above other elements
    },
    input: {
        backgroundColor: colors.surfaceAlt,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        fontSize: typography.fontSizeMedium,
        color: colors.textPrimary,
        marginBottom: spacing.md,
        borderWidth: 2,
        borderColor: colors.border,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 60, // Adjust based on input height + margin
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.medium,
        borderWidth: 1,
        borderColor: colors.border,
        maxHeight: 150,
        ...shadows.medium,
        zIndex: 10,
    },
    suggestionsList: {
        flexGrow: 0,
    },
    suggestionItem: {
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    suggestionTextContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    suggestionTextInner: {
        fontSize: typography.fontSizeMedium,
        color: colors.textPrimary,
    },
    suggestionText: {
        fontSize: typography.fontSizeMedium,
        color: colors.textPrimary,
        flex: 1,
    },
    aiBadge: {
        fontSize: 10,
        color: colors.primary,
        fontWeight: 'bold',
        backgroundColor: colors.surfaceAlt,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    aiLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        justifyContent: 'center',
        gap: spacing.sm,
    },
    aiLoadingText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSmall,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
        gap: spacing.md,
        zIndex: 0,
    },
    label: {
        fontSize: typography.fontSizeMedium,
        color: colors.textPrimary,
        fontWeight: typography.fontWeightMedium,
    },
    quantityInput: {
        flex: 1,
        backgroundColor: colors.surfaceAlt,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        fontSize: typography.fontSizeMedium,
        color: colors.textPrimary,
        borderWidth: 2,
        borderColor: colors.border,
    },
    unitContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.lg,
        zIndex: 0,
    },
    unitButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.round,
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
    },
    unitButtonSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    unitButtonText: {
        fontSize: typography.fontSizeSmall,
        color: colors.textSecondary,
        fontWeight: typography.fontWeightMedium,
    },
    unitButtonTextSelected: {
        color: colors.surface,
        fontWeight: typography.fontWeightBold,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: spacing.md,
        zIndex: 0,
    },
    button: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.medium,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightMedium,
    },
    addButton: {
        backgroundColor: colors.primary,
        ...shadows.medium,
    },
    addButtonDisabled: {
        backgroundColor: colors.border,
        opacity: 0.5,
    },
    addButtonText: {
        color: colors.surface,
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightBold,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    browseButton: {
        backgroundColor: colors.surfaceAlt,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.medium,
        borderWidth: 1,
        borderColor: colors.border,
    },
    browseButtonText: {
        fontSize: typography.fontSizeSmall,
        color: colors.primary,
        fontWeight: typography.fontWeightBold,
    },
    browserContainer: {
        height: 550, // Increased height
    },
    browserHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        paddingRight: spacing.md,
    },
    backButtonText: {
        color: colors.primary,
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightMedium,
    },
    browserTitle: {
        fontSize: typography.fontSizeLarge,
        fontWeight: typography.fontWeightBold,
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'center',
        marginRight: 40, // Balance the back button
    },
    browserList: {
        flex: 1,
    },
    browserItemContainer: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    browserItem: {
        paddingVertical: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    browserItemExpanded: {
        backgroundColor: colors.surfaceAlt,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.medium,
    },
    browserItemText: {
        fontSize: typography.fontSizeMedium,
        color: colors.textPrimary,
    },
    browserItemTextExpanded: {
        fontWeight: typography.fontWeightBold,
        color: colors.primary,
    },
    arrow: {
        fontSize: typography.fontSizeLarge,
        color: colors.textLight,
    },
    addedIndicator: {
        fontSize: typography.fontSizeMedium,
        color: colors.success || '#22c55e',
        fontWeight: 'bold',
        marginRight: spacing.xs,
    },
    inlineCustomization: {
        padding: spacing.md,
        backgroundColor: colors.surfaceAlt,
        borderBottomLeftRadius: borderRadius.medium,
        borderBottomRightRadius: borderRadius.medium,
        marginBottom: spacing.sm,
    },
    inlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.md,
    },
    inlineQuantity: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.medium,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.sm,
        width: 100,
    },
    inlineLabel: {
        fontSize: typography.fontSizeSmall,
        color: colors.textSecondary,
        marginRight: spacing.xs,
    },
    inlineInput: {
        flex: 1,
        paddingVertical: spacing.sm,
        fontSize: typography.fontSizeMedium,
        color: colors.textPrimary,
        textAlign: 'center',
    },
    inlineUnits: {
        flexGrow: 0,
    },
    inlineUnitsContent: {
        gap: spacing.sm,
    },
    inlineUnitButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.round,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inlineUnitButtonSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    inlineUnitText: {
        fontSize: typography.fontSizeSmall,
        color: colors.textSecondary,
    },
    inlineUnitTextSelected: {
        color: colors.surface,
        fontWeight: typography.fontWeightBold,
    },
    inlineAddButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.medium,
        alignItems: 'center',
    },
    inlineAddButtonText: {
        color: colors.surface,
        fontWeight: typography.fontWeightBold,
        fontSize: typography.fontSizeMedium,
    },
    inlineAddButtonSuccess: {
        backgroundColor: colors.success || '#22c55e', // Use success color or fallback green
    },
});

export default AddItemModal;
