import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
    Keyboard
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import SideMenu from '../components/SideMenu';
import AppLauncherModal from '../components/AppLauncherModal';
import TodoOptionsModal from '../components/TodoOptionsModal';
import {
    subscribeToTodoList,
    addTodoItem,
    toggleTodoItem,
    deleteTodoItem,
    deleteTodoItems,
    updateTodoItem,
    clearCompletedTodos,
    clearAllTodos
} from '../services/todoService';

const ToDoListScreen = ({ user, navigation }) => {
    const { isDarkMode, colors: themeColors } = useTheme();
    const [items, setItems] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sideMenuVisible, setSideMenuVisible] = useState(false);
    const [appLauncherVisible, setAppLauncherVisible] = useState(false);

    // Input state
    const [inputText, setInputText] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);

    // Multi-select state
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());

    // Options modal state
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);

    // Initial load and subscription
    useFocusEffect(
        React.useCallback(() => {
            if (!user?.id) return;

            const fetchProfileAndSubscribe = async () => {
                const { getUserProfile } = require('../services/authService');
                const { profile } = await getUserProfile(user.id);
                if (profile) {
                    setUserProfile(profile);
                    const unsubscribe = subscribeToTodoList(profile.familyId, (newItems) => {
                        setItems(newItems);
                        setLoading(false);
                    });
                    return unsubscribe;
                }
            };

            let unsubscribePromise = fetchProfileAndSubscribe();

            return () => {
                unsubscribePromise.then(unsub => unsub && unsub());
            };
        }, [user?.id])
    );

    const handleAddItem = async () => {
        if (!inputText.trim()) return;

        const text = inputText.trim();
        setInputText('');
        setIsAdding(false);
        Keyboard.dismiss(); // Dismiss keyboard after adding

        const { getUserProfile } = require('../services/authService');
        const { profile } = await getUserProfile(user.id);

        if (profile) {
            // Optimistic Update: Create a temporary item and add it to the list immediately
            const tempId = `temp-${Date.now()}`;
            const optimisticItem = {
                id: tempId,
                text: text,
                is_completed: false,
                family_id: profile.familyId,
                created_by: user.id,
                created_by_name: profile.fullName,
                created_at: new Date().toISOString()
            };
            setItems(prev => [optimisticItem, ...prev]);

            const result = await addTodoItem(profile.familyId, text, user.id, profile.fullName);

            if (result.success) {
                // Replace temp item with real item from DB
                setItems(prev => prev.map(i => i.id === tempId ? result.item : i));
            } else {
                // Revert if failed
                setItems(prev => prev.filter(i => i.id !== tempId));
                Alert.alert('Error', 'Failed to add task');
            }
        }
    };

    const handleToggle = async (item) => {
        // Optimistic update
        const previousItems = [...items];
        setItems(prev => prev.map(i =>
            i.id === item.id ? {
                ...i,
                is_completed: !i.is_completed,
                completed_by_name: !i.is_completed ? userProfile?.fullName : null
            } : i
        ));

        const result = await toggleTodoItem(item.id, item.is_completed, user.id, userProfile?.fullName);
        if (!result.success) {
            setItems(previousItems); // Revert
            Alert.alert('Error', 'Failed to update item');
        }
    };

    const handleDelete = (item) => {
        Alert.alert(
            'Delete Task',
            'Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        // Optimistic
                        const previousItems = [...items];
                        setItems(prev => prev.filter(i => i.id !== item.id));

                        const result = await deleteTodoItem(item.id);
                        if (!result.success) {
                            setItems(previousItems);
                            Alert.alert('Error', 'Failed to delete');
                        }
                    }
                }
            ]
        );
    };

    // Multi-select handlers
    const toggleSelection = (itemId) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const deleteSelectedItems = () => {
        if (selectedItems.size === 0) return;

        Alert.alert(
            'Delete Selected',
            `Delete ${selectedItems.size} item(s)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const idsToDelete = Array.from(selectedItems);
                        const previousItems = [...items];
                        setItems(prev => prev.filter(i => !selectedItems.has(i.id)));

                        const result = await deleteTodoItems(userProfile?.familyId, idsToDelete);
                        if (!result.success) {
                            setItems(previousItems);
                            Alert.alert('Error', 'Failed to delete items');
                        }

                        setSelectedItems(new Set());
                        setIsMultiSelectMode(false);
                    }
                }
            ]
        );
    };

    const handleLongPress = (item) => {
        if (!isMultiSelectMode) {
            setIsMultiSelectMode(true);
            setSelectedItems(new Set([item.id]));
        }
    };

    const exitMultiSelectMode = () => {
        setIsMultiSelectMode(false);
        setSelectedItems(new Set());
    };

    // Clear functions
    const performClearCompleted = async () => {
        if (!userProfile) return;

        const completedCount = items.filter(i => i.is_completed).length;
        if (completedCount === 0) {
            Alert.alert('Info', 'No completed tasks to clear.');
            return;
        }

        const previousItems = [...items];
        setItems(prev => prev.filter(i => !i.is_completed));
        setOptionsModalVisible(false);

        const result = await clearCompletedTodos(userProfile.familyId);
        if (!result.success) {
            setItems(previousItems);
            Alert.alert('Error', 'Failed to clear completed tasks: ' + result.error);
        }
    };

    const performClearAll = async () => {
        if (!userProfile) return;
        if (items.length === 0) return;

        Alert.alert(
            'Confirm Clear All',
            'Are you sure you want to delete all tasks?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Delete All',
                    style: 'destructive',
                    onPress: async () => {
                        const previousItems = [...items];
                        setItems([]);
                        setOptionsModalVisible(false);

                        const result = await clearAllTodos(userProfile.familyId);
                        if (!result.success) {
                            setItems(previousItems);
                            Alert.alert('Error', 'Failed to clear all: ' + result.error);
                        }
                    }
                }
            ]
        );
    };

    const handleClearOptions = () => {
        if (items.length === 0) return;
        setOptionsModalVisible(true);
    };

    const renderItem = ({ item }) => {
        const isSelected = selectedItems.has(item.id);

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onLongPress={() => handleLongPress(item)}
                onPress={() => {
                    if (isMultiSelectMode) {
                        toggleSelection(item.id);
                    }
                }}
            >
                <View style={[
                    styles.itemCard,
                    { backgroundColor: themeColors.surface },
                    item.is_completed && styles.itemCardCompleted,
                    isSelected && styles.itemCardSelected
                ]}>
                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => {
                            if (isMultiSelectMode) {
                                toggleSelection(item.id);
                            } else {
                                handleToggle(item);
                            }
                        }}
                    >
                        <MaterialIcons
                            name={isMultiSelectMode
                                ? (isSelected ? "check-circle" : "radio-button-unchecked")
                                : (item.is_completed ? "check-box" : "check-box-outline-blank")
                            }
                            size={24}
                            color={isMultiSelectMode
                                ? (isSelected ? themeColors.primary : themeColors.textSecondary)
                                : (item.is_completed ? themeColors.success : themeColors.textSecondary)
                            }
                        />
                    </TouchableOpacity>

                    <View style={styles.itemContent}>
                        <Text style={[styles.itemText, { color: themeColors.textPrimary }, item.is_completed && styles.itemTextCompleted]}>
                            {item.text}
                        </Text>
                        <View style={styles.metaRow}>
                            <Text style={[styles.itemMeta, { color: themeColors.textSecondary }]}>
                                Added by {item.created_by_name || 'Unknown'}
                            </Text>
                            {item.is_completed && item.completed_by_name && (
                                <Text style={[styles.completedText, { color: themeColors.success }]}>
                                    • ✅ Done by {item.completed_by_name}
                                </Text>
                            )}
                        </View>
                    </View>

                    {!isMultiSelectMode && (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDelete(item)}
                        >
                            <MaterialIcons name="delete-outline" size={24} color={themeColors.error} />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: themeColors.background }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
            <StatusBar style={isDarkMode ? "light" : "dark"} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: themeColors.surface }]}>
                <View style={styles.headerLeft}>
                    {isMultiSelectMode ? (
                        <TouchableOpacity onPress={exitMultiSelectMode} style={styles.iconButton}>
                            <MaterialIcons name="close" size={28} color={themeColors.textPrimary} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => setSideMenuVisible(true)} style={styles.iconButton}>
                            <MaterialIcons name="menu" size={28} color={themeColors.textPrimary} />
                        </TouchableOpacity>
                    )}
                    <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>
                        {isMultiSelectMode ? `${selectedItems.size} Selected` : 'To-Do List'}
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    {isMultiSelectMode ? (
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={deleteSelectedItems}
                        >
                            <MaterialIcons name="delete" size={24} color={colors.error} />
                        </TouchableOpacity>
                    ) : (
                        <>
                            {items.length > 0 && (
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={handleClearOptions}
                                >
                                    <Text style={styles.actionIcon}>🗑️</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => setAppLauncherVisible(true)}
                            >
                                <MaterialIcons name="grid-view" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={themeColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyEmoji}>📝</Text>
                            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No tasks yet</Text>
                        </View>
                    }
                />
            )}

            {/* Input Area (Bottom) */}
            <View style={[styles.inputWrapper, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.textPrimary, borderColor: themeColors.border }]}
                        placeholder="Add a task..."
                        placeholderTextColor={themeColors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleAddItem}
                    />
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: themeColors.primary }]}
                        onPress={handleAddItem}
                    >
                        <MaterialIcons name="add" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <SideMenu
                visible={sideMenuVisible}
                onClose={() => setSideMenuVisible(false)}
                userProfile={userProfile}
                onNavigateProfile={() => navigation.navigate('Profile')}
                onNavigateSettings={() => navigation.navigate('Settings')}
                onLogout={() => { }}
            />

            <AppLauncherModal
                visible={appLauncherVisible}
                onClose={() => setAppLauncherVisible(false)}
                onNavigate={(appId) => {
                    if (appId === 'grocery') {
                        navigation.navigate('GroceryList');
                    } else if (appId === 'todo') {
                        // Already here
                    } else if (appId === 'chat') {
                        Alert.alert('Coming Soon', 'Group Chat feature is currently under development.');
                    }
                }}
            />

            {/* Clear Options Modal */}
            <TodoOptionsModal
                visible={optionsModalVisible}
                onClose={() => setOptionsModalVisible(false)}
                onSelectItems={() => {
                    setIsMultiSelectMode(true);
                    setSelectedItems(new Set());
                }}
                onClearCompleted={performClearCompleted}
                onClearAll={performClearAll}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        paddingTop: spacing.xxl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shadows.small,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    headerTitle: {
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
        color: colors.textPrimary,
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing.md
    },
    iconButton: {
        padding: spacing.sm,
    },
    actionIcon: {
        fontSize: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 80,
    },
    itemCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        ...shadows.small,
    },
    itemCardCompleted: {
        opacity: 0.7,
        backgroundColor: '#F5F5F5',
    },
    checkboxContainer: {
        padding: spacing.sm,
    },
    itemContent: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    itemText: {
        fontSize: typography.fontSizeMedium,
        color: colors.textPrimary,
    },
    itemTextCompleted: {
        textDecorationLine: 'line-through',
        color: colors.textSecondary,
    },
    deleteButton: {
        padding: spacing.sm,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: spacing.xs,
    },
    itemMeta: {
        fontSize: typography.fontSizeSmall,
        color: colors.textSecondary,
    },
    completedText: {
        fontSize: typography.fontSizeSmall,
        color: colors.success,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        fontSize: typography.fontSizeMedium,
        color: colors.textSecondary,
    },
    inputWrapper: {
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    input: {
        flex: 1,
        height: 48,
        backgroundColor: colors.background,
        borderRadius: borderRadius.round,
        paddingHorizontal: spacing.lg,
        fontSize: typography.fontSizeMedium,
        borderWidth: 1,
        borderColor: colors.border,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.round,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.medium,
    },
    itemCardSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: colors.primary,
        borderWidth: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsModalContent: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.large,
        padding: spacing.lg,
        width: '80%',
        maxWidth: 300,
    },
    optionsModalTitle: {
        fontSize: typography.fontSizeLarge,
        fontWeight: typography.fontWeightBold,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.medium,
        backgroundColor: colors.background,
        marginBottom: spacing.sm,
        gap: spacing.md,
    },
    optionButtonDanger: {
        backgroundColor: '#FFEBEE',
    },
    optionText: {
        fontSize: typography.fontSizeMedium,
        color: colors.textPrimary,
    },
    optionTextDanger: {
        color: colors.error,
    },
    optionButtonCancel: {
        padding: spacing.md,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    optionTextCancel: {
        fontSize: typography.fontSizeMedium,
        color: colors.textSecondary,
    },
});

export default ToDoListScreen;
