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
import ListSelectorModal from '../components/ListSelectorModal';
import NotificationBadge from '../components/NotificationBadge';
import ListOptionsModal from '../components/ListOptionsModal';
import SideMenu from '../components/SideMenu';
import AppLauncherModal from '../components/AppLauncherModal';
import CompleteProfileModal from '../components/CompleteProfileModal';

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
import { Audio } from 'expo-av';
import { processVoiceCommand } from '../services/aiService';
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

    // New List State
    const [currentList, setCurrentList] = useState({ id: null, name: 'Daily' });
    const [listSelectorVisible, setListSelectorVisible] = useState(false);

    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [sideMenuVisible, setSideMenuVisible] = useState(false);
    const [appLauncherVisible, setAppLauncherVisible] = useState(false);
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
            if (userProfile?.familyId) {
                // Initial fetching of lists to set the default currentList if needed
                const initializeLists = async () => {
                    const { getLists } = require('../services/groceryService');
                    const listResult = await getLists(userProfile.familyId);
                    if (listResult.success && listResult.lists.length > 0) {
                        // Prefer 'Daily' if exists, else first one
                        const dailyList = listResult.lists.find(l => l.name === 'Daily');
                        if (!currentList.id) {
                            setCurrentList(dailyList || listResult.lists[0]);
                        }
                    }
                };

                if (!currentList.id) {
                    initializeLists();
                }

                unsubscribe = subscribeToGroceryList(
                    userProfile.familyId,
                    (updatedItems) => {
                        setItems(sortItems(updatedItems));
                        setLoading(false);
                        setRefreshing(false);
                    },
                    (error) => {
                        // console.error('Subscription error:', error);
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
    }, [userProfile?.familyId]);


    // Helper to get effective family ID
    const getEffectiveFamilyId = () => {
        if (!userProfile) return null;
        return userProfile.familyId;
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

        const familyId = userProfile.familyId;

        const performAddItem = async () => {
            // Optimistic update
            const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
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
                listId: currentList.id,
            };

            setItems(prev => sortItems([newItem, ...prev]));

            const result = await addGroceryItem(
                familyId,
                itemName,
                quantity,
                user.id,
                userProfile.role,
                userProfile.fullName, // Pass name
                emoji,
                currentList.id
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
        console.log('DEBUG handleToggleBought UI Triggered:', item.id, item.name);

        if (isSelectionMode) {
            console.log('DEBUG Selection Mode active');
            toggleSelection(item.id);
            return;
        }

        if (!userProfile) {
            console.log('DEBUG handleToggleBought ABORT: No userProfile');
            Alert.alert('Error', 'Profile missing. Please restart app.');
            return;
        }

        console.log('DEBUG Proceeding with toggle. Current status:', item.isBought);

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

        try {
            const result = item.isBought
                ? await unmarkItemAsBought(familyId, item.id)
                : await markItemAsBought(familyId, item.id, user.id, userProfile.fullName);

            console.log('DEBUG Toggle result:', result);

            if (!result.success) {
                // Revert if failed
                setItems(previousItems);
                Alert.alert('Error', 'Failed to update item: ' + result.error);
            }
        } catch (e) {
            console.error('DEBUG Toggle Exception:', e);
            setItems(previousItems);
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

        const familyId = userProfile.familyId;

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

    // Voice Recording State using Ref for stability
    const recordingRef = React.useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            if (permissionResponse?.status !== 'granted') {
                console.log('Requesting permission..');
                const perm = await requestPermission();
                if (perm.status !== 'granted') {
                    Alert.alert('Permission needed', 'Microphone permission is required for voice commands.');
                    return;
                }
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });

            console.log('Starting recording..');

            // Use the default HIGH_QUALITY preset for maximum compatibility
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            recordingRef.current = recording;
            setIsRecording(true);
            console.log('Recording started');
        } catch (err) {
            console.error('Failed to start recording', err);
            setIsRecording(false);
            Alert.alert('Error', 'Could not start recording.');
        }
    };

    const stopRecording = async () => {
        console.log('Stopping recording..');
        setIsRecording(false); // Update UI immediately

        const recording = recordingRef.current;
        if (!recording) {
            console.log('No active recording ref found');
            return;
        }

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            console.log('Recording stopped and stored at', uri);
            recordingRef.current = null; // Clear ref

            // Process with Gemini
            await handleVoiceInput(uri);
        } catch (error) {
            console.error('Failed to stop recording', error);
            recordingRef.current = null;
        }
    };

    const handleVoiceInput = async (uri) => {
        setLoading(true); // Show global loading or a specific "Processing..." state
        try {
            const items = await processVoiceCommand(uri);
            console.log('Gemini extracted items:', items);

            if (items && items.length > 0) {
                // Add items one by one
                for (const item of items) {
                    await handleAddItem(item.name, item.quantity || '1 pcs', item.emoji || '🛒');
                }
                Alert.alert('Success', `Added ${items.length} items from voice!`);
            } else {
                Alert.alert('Voice Command', 'Could not understand the items. Please try again or speak closer to the mic.');
            }
        } catch (error) {
            console.error('Voice processing error:', error);
            Alert.alert('Error', 'Failed to process voice command.');
        } finally {
            setLoading(false);
        }
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
        // Filter by List
        if (currentList.id && item.listId !== currentList.id) return false;

        if (selectedCategory === 'All') return true;
        const category = getCategory(item.name);
        return category === selectedCategory;
    });

    // Filter items by Current List for stats
    const currentListItems = items.filter(item => {
        if (currentList.id && item.listId !== currentList.id) return false;
        return true;
    });

    const pendingItems = currentListItems.filter(item => !item.isBought);
    const boughtItems = currentListItems.filter(item => item.isBought);

    // Get all unique categories from the items present in the list + 'All'
    // Actually better to show ALL available categories or just the ones in the list?
    // Showing only ones in the list makes sense to avoid empty filters.
    // But also might want 'Vegetables' even if empty to quickly check? 
    // Usually "Filter by..." implies filtering existing data. 
    // Let's compute categories from `items`.
    const availableCategories = ['All', ...new Set(currentListItems.map(item => getCategory(item.name)))].sort();
    // But wait, "Other" might be last. And "All" first.
    // Let's separate 'All' and sort the rest.
    const uniqueCategories = [...new Set(currentListItems.map(item => getCategory(item.name)))].sort();
    const filterCategories = ['All', ...uniqueCategories];

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

        const familyId = userProfile.familyId;
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

                        const familyId = userProfile.familyId;
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
            {/* Complete Profile Modal */}
            <CompleteProfileModal
                visible={!loading && user && !userProfile}
                user={user}
                onSaveSuccess={(newProfile) => {
                    // Normalize the profile data returned from DB (snake_case) to app (camelCase)
                    const normalizedProfile = {
                        id: newProfile.id,
                        email: newProfile.email,
                        role: newProfile.role,
                        familyId: newProfile.family_id,
                        fullName: newProfile.full_name,
                        createdAt: newProfile.created_at,
                        updatedAt: newProfile.updated_at,
                    };
                    setUserProfile(normalizedProfile);
                }}
            />

            {/* List Type Selector Button (Floating or Header) */}
            {/* We moved it to header, so no floating button needed here unless we want one */}


            {/* Header */}
            {
                isSelectionMode ? (
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
                                <Text style={styles.headerTitle}>Grocery List</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            {/* List Selector Button */}
                            <TouchableOpacity
                                style={styles.listTypeContainer}
                                onPress={() => setListSelectorVisible(true)}
                            >
                                <View style={styles.listTypeButton}>
                                    <Text style={styles.listTypeButtonText}>
                                        {(currentList.name || 'D').charAt(0)}
                                    </Text>
                                </View>
                                <Text style={styles.listTypeLabel}>
                                    {currentList.name || 'List'}
                                </Text>
                            </TouchableOpacity>

                            {items.length > 0 && (
                                <TouchableOpacity onPress={handleClearOptions} style={styles.iconButton}>
                                    <Text style={styles.actionIcon}>🗑️</Text>
                                </TouchableOpacity>
                            )}

                            {/* <TouchableOpacity onPress={() => setNotificationCount(0)} style={styles.iconButton}>
                                <View>
                                    <Text style={styles.actionIcon}>🔔</Text>
                                    <NotificationBadge count={notificationCount} />
                                </View>
                            </TouchableOpacity> */}
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => setAppLauncherVisible(true)}
                            >
                                <MaterialIcons name="grid-view" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )
            }

            {/* App Launcher Modal */}
            <AppLauncherModal
                visible={appLauncherVisible}
                onClose={() => setAppLauncherVisible(false)}
                onNavigate={(appId) => {
                    console.log('Navigate to app:', appId);
                    if (appId === 'grocery') {
                        // Already here
                    } else if (appId === 'todo') {
                        navigation.navigate('ToDoList');
                    } else if (appId === 'chat') {
                        Alert.alert('Coming Soon', 'Group Chat feature is currently under development.');
                    }
                }}
            />

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
                    <Text style={styles.statNumber}>{currentListItems.length}</Text>
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
                keyExtractor={(item) => item.id || `fallback-${Math.random()}`}
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
            {
                !isSelectionMode && (
                    <TouchableOpacity
                        style={[styles.fab, isRecording && styles.fabRecording]}
                        onPress={() => {
                            if (!isRecording) setModalVisible(true);
                        }}
                        onLongPress={startRecording}
                        onPressOut={() => {
                            // Only stop if we actually started via long press
                            if (isRecording) stopRecording();
                        }}
                        delayLongPress={300} // Shorten delay for better feel
                        activeOpacity={0.7}
                    >
                        <MaterialIcons
                            name={isRecording ? "mic" : "add"}
                            size={32}
                            color="#FFF"
                        />
                    </TouchableOpacity>
                )
            }

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

            {/* List Selector Modal */}
            <ListSelectorModal
                visible={listSelectorVisible}
                onClose={() => setListSelectorVisible(false)}
                familyId={userProfile?.familyId}
                currentListId={currentList.id}
                onSelect={(listId) => {
                    // We need to find the list object to set name
                    // We can fetch lists or pass it up.
                    // The simple way: reload lists in useEffect will catch it if we update currentList.id?
                    // No, useEffect runs on mount.
                    // We need to fetch the list name.
                    const fetchListName = async () => {
                        const { getLists } = require('../services/groceryService');
                        const res = await getLists(userProfile.familyId);
                        if (res.success) {
                            const found = res.lists.find(l => l.id === listId);
                            if (found) setCurrentList(found);
                        }
                    };
                    fetchListName();
                }}
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
        </View >
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
    fabRecording: {
        backgroundColor: colors.error, // Red to indicate recording
        transform: [{ scale: 1.2 }],
    },
});

export default GroceryListScreen;
