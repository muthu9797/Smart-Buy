import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import GroceryItem from '../components/GroceryItem';
import AddItemModal from '../components/AddItemModal';
import ListTypeSelectionModal from '../components/ListTypeSelectionModal';
import NotificationBadge from '../components/NotificationBadge';
import ListOptionsModal from '../components/ListOptionsModal';
import SideMenu from '../components/SideMenu';

import {
    subscribeToGroceryList,
    addGroceryItem,
    markItemAsBought,
    unmarkItemAsBought,
    deleteGroceryItem,
    updateGroceryItem,
    clearAllGroceryItems,
    clearPurchasedItems,
    deleteGroceryItems,
} from '../services/groceryService';
import { getUserProfile } from '../services/authService';
import {
    requestNotificationPermissions,
    sendNewItemNotification,
    sendItemBoughtNotification,
    addNotificationReceivedListener,
} from '../services/notificationService';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { COMMON_ITEMS } from '../data/commonItems';

const GroceryListScreen = ({ user, onLogout, navigation }) => {
    const [items, setItems] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [listType, setListType] = useState('daily'); // 'daily' or 'monthly'
    const [listSelectionModalVisible, setListSelectionModalVisible] = useState(false);
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [sideMenuVisible, setSideMenuVisible] = useState(false); // New state for side menu
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState(new Set());

    // 1. Fetch User Profile on Mount
    // 1. Fetch User Profile on Mount and Focus
    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                try {
                    const profileResult = await getUserProfile(user.id);
                    if (profileResult.success) {
                        setUserProfile(profileResult.profile);
                    } else {
                        console.error('Failed to load user profile:', profileResult.error);
                    }
                } catch (error) {
                    console.error('Initialize screen error:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        }, [user.id])
    );

    useEffect(() => {
        requestNotificationPermissions();

        const notificationListener = addNotificationReceivedListener((notification) => {
            setNotificationCount(prev => prev + 1);
            setTimeout(() => setNotificationCount(prev => Math.max(0, prev - 1)), 3000);
        });

        return () => {
            notificationListener.remove();
        };
    }, []);

    // 2. Subscribe to Grocery List (depends on Profile and List Type)
    useEffect(() => {
        let unsubscribe;

        const setupSubscription = () => {
            if (userProfile) {
                setLoading(true); // Show loading when switching lists
                const currentFamilyId = listType === 'daily'
                    ? userProfile.familyId
                    : `${userProfile.familyId}-monthly`;

                unsubscribe = subscribeToGroceryList(
                    currentFamilyId,
                    handleGroceryListUpdate,
                    (error) => {
                        Alert.alert('Error', 'Failed to load grocery list');
                        console.error(error);
                        setLoading(false);
                    }
                );
            }
        };

        setupSubscription();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [userProfile, listType]);

    // Helper to get effective family ID
    const getEffectiveFamilyId = () => {
        if (!userProfile) return null;
        return listType === 'daily' ? userProfile.familyId : `${userProfile.familyId}-monthly`;
    };

    const itemsRef = React.useRef(items);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    const sortItems = (itemsToSort) => {
        return [...itemsToSort].sort((a, b) => {
            if (a.isBought === b.isBought) {
                // If both bought, sort by boughtAt (newest first)
                if (a.isBought) {
                    const dateA = a.boughtAt ? new Date(a.boughtAt).getTime() : 0;
                    const dateB = b.boughtAt ? new Date(b.boughtAt).getTime() : 0;
                    return dateB - dateA;
                }
                // If both pending, sort by createdAt (newest first)
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            }
            // Pending (false) comes before Bought (true)
            return a.isBought ? 1 : -1;
        });
    };

    const handleGroceryListUpdate = (updatedItems) => {
        // Check for new items and send notifications
        // Use ref to get latest items state without breaking closure
        const currentItems = itemsRef.current;

        if (currentItems.length > 0 && userProfile) {
            updatedItems.forEach((newItem) => {
                const existingItem = currentItems.find(item => item.id === newItem.id);

                // New item added by partner
                if (!existingItem && newItem.addedBy !== user.id) {
                    sendNewItemNotification(newItem.name, newItem.addedByRole);
                }

                // Item marked as bought by partner
                if (existingItem && !existingItem.isBought && newItem.isBought && newItem.boughtBy !== user.id) {
                    // We don't have the boughtByRole directly in the item, but we can infer or just say "Someone"
                    // Ideally, we should store boughtByRole in the item too, but for now let's just say "Someone" or fetch it
                    // Or better, let's update the item structure to include boughtByRole if possible, 
                    // but for now let's just use a generic message or try to use the role from the notification payload if we had it.
                    // Actually, wait, sendItemBoughtNotification takes boughtByRole. 
                    // Since we don't have it in the item update (only boughtBy ID), we might need to change how we send this.
                    // For now, let's just pass "Someone" or maybe we can't easily get the name without a lookup.
                    // Let's change the notification service to accept just the name if we have it, or generic.
                    // BUT, the item update doesn't have the role of the person who bought it.
                    // Let's just say "A family member" for now to be safe, or we can try to fetch it.
                    // Actually, the previous code assumed wife/husband binary.
                    // Let's just pass "Family Member" for now.
                    sendItemBoughtNotification(newItem.name, 'Family Member');
                }
            });
        }

        setItems(sortItems(updatedItems));
        setRefreshing(false);
        setLoading(false);
    };

    const handleAddItem = async (itemName, quantity, emoji) => {
        console.log('handleAddItem called with:', { itemName, quantity, emoji });
        if (!userProfile) {
            console.error('User profile missing in handleAddItem');
            return;
        }

        const familyId = getEffectiveFamilyId();

        const performAddItem = async () => {
            // Optimistic update
            const tempId = 'temp-' + Date.now();
            const newItem = {
                id: tempId,
                name: itemName,
                quantity: quantity,
                emoji: emoji,
                addedBy: user.id,
                addedByRole: userProfile.role,
                addedByName: userProfile.fullName, // Optimistic name
                isBought: false,
                createdAt: new Date().toISOString(),
                boughtBy: null,
                boughtAt: null,
            };

            setItems(prev => sortItems([newItem, ...prev]));

            const result = await addGroceryItem(
                familyId,
                itemName,
                quantity,
                user.id,
                userProfile.role,
                userProfile.fullName, // Pass name
                emoji
            );

            console.log('addGroceryItem result:', result);

            if (result.success) {
                // Update the temp ID with the real ID from server
                setItems(prev => prev.map(item =>
                    item.id === tempId ? { ...item, id: result.itemId } : item
                ));
            } else {
                // Revert if failed
                setItems(prev => prev.filter(item => item.id !== tempId));
                Alert.alert('Error', 'Failed to add item: ' + result.error);
            }
        };

        // Check for duplicates (only pending items)
        const isDuplicate = items.some(
            item => !item.isBought && item.name.trim().toLowerCase() === itemName.trim().toLowerCase()
        );

        if (isDuplicate) {
            Alert.alert(
                'Duplicate Item',
                `"${itemName}" is already on your list. Do you want to add it anyway?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Add Anyway', onPress: performAddItem }
                ]
            );
        } else {
            await performAddItem();
        }
    };

    const handleToggleBought = async (item) => {
        if (isSelectionMode) {
            toggleSelection(item.id);
            return;
        }

        if (!userProfile) return;

        // Optimistic update
        const previousItems = [...items];
        const updatedItems = items.map(i =>
            i.id === item.id
                ? { ...i, isBought: !i.isBought, boughtBy: !i.isBought ? user.id : null, boughtByName: !i.isBought ? userProfile.fullName : null, boughtAt: !i.isBought ? new Date().toISOString() : null }
                : i
        );

        // Sort immediately
        setItems(sortItems(updatedItems));

        const familyId = getEffectiveFamilyId();

        const result = item.isBought
            ? await unmarkItemAsBought(familyId, item.id)
            : await markItemAsBought(familyId, item.id, user.id, userProfile.fullName);

        if (!result.success) {
            // Revert if failed
            setItems(previousItems);
            Alert.alert('Error', 'Failed to update item: ' + result.error);
        }
    };

    const toggleSelection = (itemId) => {
        setSelectedItemIds(prev => {
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
        if (selectedItemIds.size === 0) return;

        Alert.alert(
            'Delete Selected',
            `Delete ${selectedItemIds.size} item(s)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (!userProfile) return;

                        const previousItems = [...items];
                        const idsToDelete = Array.from(selectedItemIds);

                        // Optimistic
                        setItems(prev => prev.filter(i => !selectedItemIds.has(i.id)));
                        setIsSelectionMode(false);
                        setSelectedItemIds(new Set());

                        const familyId = getEffectiveFamilyId();
                        const result = await deleteGroceryItems(familyId, idsToDelete);

                        if (!result.success) {
                            setItems(previousItems);
                            Alert.alert('Error', 'Failed to delete items: ' + result.error);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteItem = (item) => {
        Alert.alert(
            'Delete Item',
            `Are you sure you want to delete "${item.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (!userProfile) return;

                        // Optimistic update: Remove from UI immediately
                        const previousItems = [...items];
                        setItems(prev => prev.filter(i => i.id !== item.id));

                        const familyId = getEffectiveFamilyId();
                        const result = await deleteGroceryItem(familyId, item.id);

                        if (!result.success) {
                            // Revert if failed
                            setItems(previousItems);
                            Alert.alert('Error', 'Failed to delete item: ' + result.error);
                        }
                    },
                },
            ]
        );
    };

    const handleEditItem = async (itemId, newName, newQuantity, newEmoji) => {
        if (!userProfile) return;

        // Optimistic update
        const previousItems = [...items];
        setItems(prev => prev.map(item =>
            item.id === itemId
                ? { ...item, name: newName, quantity: newQuantity, emoji: newEmoji }
                : item
        ));

        const familyId = getEffectiveFamilyId();

        const result = await updateGroceryItem(
            familyId,
            itemId,
            {
                name: newName,
                quantity: newQuantity,
                emoji: newEmoji
            }
        );

        if (!result.success) {
            // Revert if failed
            setItems(previousItems);
            Alert.alert('Error', 'Failed to update item: ' + result.error);
        }
    };

    const handleLongPress = (item) => {
        Alert.alert(
            'Manage Item',
            `What would you like to do with "${item.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Edit',
                    onPress: () => {
                        setItemToEdit(item);
                        setModalVisible(true);
                    }
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => handleDeleteItem(item)
                }
            ]
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        // The real-time listener will update automatically
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Helper to get category for an item
    const getCategory = (itemName) => {
        const match = COMMON_ITEMS.find(
            i => i.name.toLowerCase() === itemName.toLowerCase()
        );
        return match ? match.category : 'Other';
    };

    // Derived state for filtering
    const filteredItems = items.filter(item => {
        if (selectedCategory === 'All') return true;
        const category = getCategory(item.name);
        return category === selectedCategory;
    });

    const pendingItems = items.filter(item => !item.isBought); // Use original items for count?
    // Actually, usually headers show stats for the whole list.
    // If I filter, should stats update? Maybe confusing.
    // Let's keep stats for the TOTAL list, but show filtered items in list.
    // Or maybe show counts of filtered items?
    // User said "Filter the grocery list", usually implies viewing a subset.
    // Let's keep the global stats (Pending/Bought/Total) as is, so they know what's in the DB.
    // But the list below shows filtered.

    const pendingFilteredItems = filteredItems.filter(item => !item.isBought);
    const boughtFilteredItems = filteredItems.filter(item => item.isBought);

    // Get all unique categories from the items present in the list + 'All'
    // Actually better to show ALL available categories or just the ones in the list?
    // Showing only ones in the list makes sense to avoid empty filters.
    // But also might want 'Vegetables' even if empty to quickly check? 
    // Usually "Filter by..." implies filtering existing data. 
    // Let's compute categories from `items`.
    const availableCategories = ['All', ...new Set(items.map(item => getCategory(item.name)))].sort();
    // But wait, "Other" might be last. And "All" first.
    // Let's separate 'All' and sort the rest.
    const uniqueCategories = [...new Set(items.map(item => getCategory(item.name)))].sort();
    const filterCategories = ['All', ...uniqueCategories];

    const boughtItems = items.filter(item => item.isBought); // Keep original for stats

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    // Logic actions separated from UI trigger
    const performClearPurchased = async () => {
        if (!userProfile) return;

        const boughtCount = items.filter(i => i.isBought).length;
        if (boughtCount === 0) {
            Alert.alert('Info', 'No purchased items to clear.');
            return;
        }

        const previousItems = [...items];
        setItems(prev => prev.filter(i => !i.isBought));

        const familyId = getEffectiveFamilyId();
        const result = await clearPurchasedItems(familyId);

        if (!result.success) {
            setItems(previousItems);
            Alert.alert('Error', 'Failed to clear bought items: ' + result.error);
        }
    };

    const performClearAll = async () => {
        if (!userProfile) return;
        if (items.length === 0) return;

        // Double check for Clear All as it's destructive
        Alert.alert(
            'Confirm Clear All',
            'Are you sure you want to delete everything?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Delete All',
                    style: 'destructive',
                    onPress: async () => {
                        const previousItems = [...items];
                        setItems([]);

                        const familyId = getEffectiveFamilyId();
                        const result = await clearAllGroceryItems(familyId);

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

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            {isSelectionMode ? (
                <View style={[styles.header, styles.headerSelection]}>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => {
                            setIsSelectionMode(false);
                            setSelectedItemIds(new Set());
                        }} style={styles.iconButton}>
                            <MaterialIcons name="close" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{selectedItemIds.size} Selected</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={deleteSelectedItems} style={styles.iconButton}>
                            <MaterialIcons name="delete" size={24} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => setSideMenuVisible(true)} style={styles.iconButton}>
                            <MaterialIcons name="menu" size={28} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>🛒 Grocery List</Text>
                        </View>
                    </View>
                    <View style={styles.headerActions}>
                        {/* List Type Button */}
                        <TouchableOpacity
                            style={styles.listTypeContainer}
                            onPress={() => setListSelectionModalVisible(true)}
                        >
                            <View style={styles.listTypeButton}>
                                <Text style={styles.listTypeButtonText}>
                                    {listType === 'daily' ? 'D' : 'M'}
                                </Text>
                            </View>
                            <Text style={styles.listTypeLabel}>
                                {listType === 'daily' ? 'Daily' : 'Monthly'}
                            </Text>
                        </TouchableOpacity>

                        {items.length > 0 && (
                            <TouchableOpacity onPress={handleClearOptions} style={styles.iconButton}>
                                <Text style={styles.actionIcon}>🗑️</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity onPress={() => setNotificationCount(0)} style={styles.iconButton}>
                            <View>
                                <Text style={styles.actionIcon}>🔔</Text>
                                <NotificationBadge count={notificationCount} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{pendingItems.length}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{boughtItems.length}</Text>
                    <Text style={styles.statLabel}>Bought</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{items.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
            </View>

            {/* Filter Chips */}
            <View style={styles.filterContainer}>
                <FlatList
                    data={filterCategories}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item}
                    contentContainerStyle={styles.filterContent}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                selectedCategory === item && styles.filterChipSelected
                            ]}
                            onPress={() => setSelectedCategory(item)}
                        >
                            <Text style={[
                                styles.filterChipText,
                                selectedCategory === item && styles.filterChipTextSelected
                            ]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Grocery List */}
            <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <GroceryItem
                        item={item}
                        onToggleBought={handleToggleBought}
                        onDelete={handleLongPress} // Passing handleLongPress to the prop named onDelete
                        currentUserId={user.id}
                        userRole={userProfile?.role}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedItemIds.has(item.id)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyEmoji}>📝</Text>
                        <Text style={styles.emptyText}>No items yet</Text>
                        <Text style={styles.emptySubtext}>
                            Tap the + button to add your first item
                        </Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
            />

            {/* Floating Add Button */}
            {!isSelectionMode && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>
            )}

            {/* Add Item Modal */}
            <AddItemModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setItemToEdit(null);
                }}
                onAdd={handleAddItem}
                onEdit={handleEditItem}
                initialItem={itemToEdit}
                currentItems={items}
            />

            {/* List Type Selection Modal */}
            <ListTypeSelectionModal
                visible={listSelectionModalVisible}
                onClose={() => setListSelectionModalVisible(false)}
                currentType={listType}
                onSelect={setListType}
            />

            {/* List Options Modal (Delete Menu) */}
            <ListOptionsModal
                visible={optionsModalVisible}
                onClose={() => setOptionsModalVisible(false)}
                onSelectOption={() => setIsSelectionMode(true)}
                onClearPurchased={performClearPurchased}
                onClearAll={performClearAll}
            />

            <SideMenu
                visible={sideMenuVisible}
                onClose={() => setSideMenuVisible(false)}
                userProfile={userProfile}
                onNavigateProfile={() => navigation.navigate('Profile')}
                onLogout={onLogout}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: typography.fontSizeMedium,
        color: colors.textSecondary,
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
    headerSelection: {
        backgroundColor: colors.surfaceAlt,
    },
    headerTitle: {
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
        color: colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: typography.fontSizeSmall,
        color: colors.textSecondary,
        marginTop: 4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    iconButton: {
        padding: spacing.sm,
    },
    actionIcon: {
        fontSize: 24,
    },
    logoutButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    logoutText: {
        color: colors.error,
        fontSize: typography.fontSizeSmall,
        fontWeight: typography.fontWeightMedium,
    },
    logoutIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: spacing.xs,
    },
    logoutIconText: {
        fontSize: 16,
        fontWeight: typography.fontWeightBold,
        color: colors.error,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: spacing.md,
        gap: spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.medium,
        padding: spacing.md,
        alignItems: 'center',
        ...shadows.small,
    },
    statNumber: {
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
        color: colors.primary,
    },
    statLabel: {
        fontSize: typography.fontSizeSmall,
        color: colors.textSecondary,
        marginTop: 4,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 100,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl * 2,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    emptyText: {
        fontSize: typography.fontSizeLarge,
        fontWeight: typography.fontWeightBold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    emptySubtext: {
        fontSize: typography.fontSizeMedium,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: spacing.xl,
        right: spacing.xl,
        width: 64,
        height: 64,
        borderRadius: borderRadius.round,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.large,
    },
    fabText: {
        fontSize: 32,
        color: colors.surface,
        fontWeight: typography.fontWeightBold,
    },
    filterContainer: {
        marginBottom: spacing.sm,
    },
    filterContent: {
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
        paddingBottom: spacing.sm,
    },
    filterChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: borderRadius.round,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.small,
    },
    filterChipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterChipText: {
        fontSize: typography.fontSizeSmall,
        fontWeight: typography.fontWeightMedium,
        color: colors.textSecondary,
    },
    filterChipTextSelected: {
        color: colors.surface,
        fontWeight: typography.fontWeightBold,
    },
    listTypeContainer: {
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    listTypeButton: {
        width: 32,
        height: 32,
        backgroundColor: colors.surfaceAlt,
        borderRadius: borderRadius.small,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    listTypeButtonText: {
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightBold,
        color: colors.primary,
    },
    listTypeLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        marginTop: 2,
        fontWeight: typography.fontWeightMedium,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitleContainer: {
        marginLeft: spacing.md,
    },
});

export default GroceryListScreen;
