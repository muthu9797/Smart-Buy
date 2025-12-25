import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TouchableWithoutFeedback,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Alert
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { getLists, createList, deleteList, updateList, duplicateList } from '../services/groceryService';

const ListSelectorModal = ({ visible, onClose, familyId, currentListId, onSelect }) => {
    const { isDarkMode, colors: themeColors } = useTheme();
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [editingList, setEditingList] = useState(null);
    const [duplicatingList, setDuplicatingList] = useState(null);
    const [creatingLoader, setCreatingLoader] = useState(false);

    // New state for options menu
    const [optionsList, setOptionsList] = useState(null);

    useEffect(() => {
        if (visible) {
            // Reset UI state to ensure clean slate
            setIsCreating(false);
            setEditingList(null);
            setDuplicatingList(null);
            setOptionsList(null);
            setNewListName('');

            if (familyId) {
                fetchLists();
            }
        }
    }, [visible, familyId]);

    const fetchLists = async () => {
        setLoading(true);
        const result = await getLists(familyId);
        if (result.success) {
            setLists(result.lists);
            // If currentListId is not in the list (e.g. after deletion or first load), select the first one
            if (result.lists.length > 0 && !result.lists.find(l => l.id === currentListId)) {
                // Auto-select first list if current is invalid
                onSelect(result.lists[0].id);
            }
        } else {
            console.error('Failed to fetch lists:', result.error);
        }
        setLoading(false);
    };

    const handleSaveList = async () => {
        if (!newListName.trim()) return;

        setCreatingLoader(true);
        let result;

        if (editingList) {
            // Rename existing
            result = await updateList(editingList.id, { name: newListName.trim() });
        } else if (duplicatingList) {
            // Duplicate existing
            result = await duplicateList(duplicatingList.id, familyId, newListName.trim());
        } else {
            // Create new
            result = await createList(familyId, newListName.trim());
        }

        setCreatingLoader(false);

        if (result.success) {
            setNewListName('');
            setEditingList(null);
            setDuplicatingList(null);
            setIsCreating(false);
            fetchLists();
            if (!editingList) {
                onSelect(result.list.id); // Auto-select new list only
            }
            onClose(); // Optional: close modal completely? Maybe just close popup.
            // Actually, keep modal open but close popup is handled by setIsCreating(false)
        } else {
            Alert.alert('Error', 'Failed to save list: ' + result.error);
        }
    };

    const handleAction = async (list, action) => {
        if (action === 'delete') {
            if (list.is_locked) {
                Alert.alert('Locked List', 'This list is locked. Unlock it first to delete.');
                return;
            }
            if (lists.length <= 1) {
                Alert.alert('Cannot Delete', 'You must have at least one list.');
                return;
            }

            Alert.alert(
                'Delete List',
                `Are you sure you want to delete "${list.name}"? All items in it will be lost.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            setLoading(true);
                            const result = await deleteList(list.id);
                            if (result.success) {
                                fetchLists();
                            } else {
                                Alert.alert('Error', 'Failed to delete list');
                            }
                            setLoading(false);
                        }
                    }
                ]
            );
        } else if (action === 'lock') {
            handleToggleLock(list);
        } else if (action === 'rename') {
            setEditingList(list);
            setNewListName(list.name);
            setIsCreating(true);
        } else if (action === 'duplicate') {
            setDuplicatingList(list);
            setNewListName('');
            setIsCreating(true);
        }
    };

    const handleToggleLock = async (list) => {
        setLoading(true);
        const result = await updateList(list.id, { is_locked: !list.is_locked });
        if (result.success) {
            fetchLists();
        } else {
            Alert.alert('Error', 'Failed to update list lock status');
        }
        setLoading(false);
    };

    const onLongPressList = (list) => {
        setOptionsList(list);
    };

    const handleOptionSelect = (action) => {
        const list = optionsList;
        setOptionsList(null); // Close options menu

        if (action === 'rename') {
            handleAction(list, 'rename');
        } else if (action === 'lock') {
            handleAction(list, 'lock');
        } else if (action === 'delete') {
            handleAction(list, 'delete');
        } else if (action === 'duplicate') {
            handleAction(list, 'duplicate');
        }
    };

    if (!visible) return null;

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
                        <View style={[styles.modalContainer, { backgroundColor: themeColors.surface }]}>
                            <View style={styles.header}>
                                <Text style={[styles.title, { color: themeColors.textPrimary }]}>My Lists</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditingList(null);
                                        setDuplicatingList(null);
                                        setNewListName('');
                                        setIsCreating(true);
                                    }}
                                    style={styles.addButton}
                                >
                                    <MaterialIcons name="add" size={24} color={themeColors.primary} />
                                </TouchableOpacity>
                            </View>



                            {loading ? (
                                <ActivityIndicator size="large" color={themeColors.primary} style={styles.loader} />
                            ) : (
                                <ScrollView style={styles.listContainer}>
                                    {lists.map((list) => (
                                        <TouchableOpacity
                                            key={list.id}
                                            style={[
                                                styles.optionRow,
                                                { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                                                currentListId === list.id && [styles.optionRowSelected, { backgroundColor: themeColors.background, borderColor: themeColors.primary }]
                                            ]}
                                            onPress={() => {
                                                onSelect(list.id);
                                                onClose();
                                            }}
                                            onLongPress={() => onLongPressList(list)}
                                            delayLongPress={500}
                                        >
                                            <View style={styles.listInfo}>
                                                <Text style={[
                                                    styles.optionLabel,
                                                    { color: themeColors.textPrimary },
                                                    currentListId === list.id && { color: themeColors.primary }
                                                ]}>
                                                    {list.name}
                                                </Text>
                                            </View>

                                            {list.is_locked && (
                                                <MaterialIcons name="lock-outline" size={16} color={themeColors.textSecondary} style={{ marginRight: 8 }} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                    {lists.length === 0 && (
                                        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No lists found.</Text>
                                    )}
                                </ScrollView>
                            )}

                            <TouchableOpacity style={[styles.closeButton, { borderTopColor: themeColors.border }]} onPress={onClose}>
                                <Text style={[styles.closeText, { color: themeColors.textSecondary }]}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                    {isCreating && (
                        <View style={styles.createOverlay}>
                            <View style={[styles.createDialog, { backgroundColor: themeColors.surface }]}>
                                <Text style={[styles.createTitle, { color: themeColors.textPrimary }]}>
                                    {editingList ? 'Rename List' : (duplicatingList ? 'Duplicate List' : 'New List Name')}
                                </Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.textPrimary, borderColor: themeColors.border }]}
                                    placeholder="e.g. Party, Weekly"
                                    placeholderTextColor={themeColors.textLight}
                                    value={newListName}
                                    onChangeText={setNewListName}
                                    autoFocus={true}
                                />
                                <View style={styles.createActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.cancelBtn, { backgroundColor: themeColors.background }]}
                                        onPress={() => {
                                            setIsCreating(false);
                                            setEditingList(null);
                                            setDuplicatingList(null);
                                            setNewListName('');
                                        }}
                                    >
                                        <Text style={[styles.actionTextCancel, { color: themeColors.textSecondary }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.saveBtn, { backgroundColor: themeColors.primary }]}
                                        onPress={handleSaveList}
                                        disabled={creatingLoader}
                                    >
                                        {creatingLoader ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.actionTextSave}>
                                                {editingList ? 'Save' : (duplicatingList ? 'Duplicate' : 'Create')}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}


                    {/* Options Menu Overlay */}
                    {optionsList && (
                        <View style={styles.createOverlay}>
                            <View style={[styles.createDialog, { backgroundColor: themeColors.surface }]}>
                                <Text style={[styles.createTitle, { color: themeColors.textPrimary }]}>{optionsList.name}</Text>

                                <TouchableOpacity
                                    style={[styles.optionButton, { borderBottomColor: themeColors.border }]}
                                    onPress={() => handleOptionSelect('rename')}
                                >
                                    <MaterialIcons name="edit" size={20} color={themeColors.textPrimary} style={styles.optionIcon} />
                                    <Text style={[styles.optionText, { color: themeColors.textPrimary }]}>Rename List</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.optionButton, { borderBottomColor: themeColors.border }]}
                                    onPress={() => handleOptionSelect('duplicate')}
                                >
                                    <Ionicons name="copy-outline" size={20} color={themeColors.textPrimary} style={styles.optionIcon} />
                                    <Text style={[styles.optionText, { color: themeColors.textPrimary }]}>Duplicate List</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.optionButton, { borderBottomColor: themeColors.border }]}
                                    onPress={() => handleOptionSelect('lock')}
                                >
                                    <MaterialIcons
                                        name={optionsList.is_locked ? "lock-open" : "lock-outline"}
                                        size={20}
                                        color={themeColors.textPrimary}
                                        style={styles.optionIcon}
                                    />
                                    <Text style={[styles.optionText, { color: themeColors.textPrimary }]}>
                                        {optionsList.is_locked ? 'Unlock List' : 'Lock List'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.optionButton, styles.deleteOption]}
                                    onPress={() => handleOptionSelect('delete')}
                                >
                                    <MaterialIcons name="delete-outline" size={20} color={themeColors.error} style={styles.optionIcon} />
                                    <Text style={[styles.optionText, { color: themeColors.error }]}>Delete List</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.cancelOptionButton, { backgroundColor: themeColors.background }]}
                                    onPress={() => setOptionsList(null)}
                                >
                                    <Text style={[styles.cancelOptionText, { color: themeColors.textSecondary }]}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback >
        </Modal >
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
        maxHeight: '80%',
        padding: spacing.xl,
        ...shadows.medium,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: typography.fontSizeLarge,
        fontWeight: typography.fontWeightBold,
        color: colors.textPrimary,
    },
    addButton: {
        padding: spacing.xs,
    },
    createOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderRadius: borderRadius.large, // Match container
    },
    createDialog: {
        width: '90%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.medium,
        padding: spacing.lg,
        ...shadows.medium,
    },
    createTitle: { // Add this if missing
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.md,
        color: colors.textPrimary,
        textAlign: 'center',
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.small,
        padding: spacing.sm,
        marginBottom: spacing.sm,
    },
    createActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.sm,
    },
    actionButton: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.small,
    },
    cancelBtn: {
        backgroundColor: colors.surfaceAlt,
    },
    saveBtn: {
        backgroundColor: colors.primary,
    },
    actionTextCancel: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSmall,
    },
    actionTextSave: {
        color: '#fff',
        fontSize: typography.fontSizeSmall,
        fontWeight: 'bold',
    },
    listContainer: {
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
        marginBottom: spacing.sm,
    },
    optionRowSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.surfaceAlt,
    },
    listInfo: {
        flex: 1,
    },
    optionLabel: {
        fontSize: typography.fontSizeMedium,
        fontWeight: typography.fontWeightMedium,
        color: colors.textPrimary,
    },
    optionLabelSelected: {
        color: colors.primary,
        fontWeight: typography.fontWeightBold,
    },
    deleteIcon: {
        padding: spacing.xs,
    },
    loader: {
        marginVertical: spacing.xl,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginTop: spacing.md,
    },
    closeButton: {
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    closeText: {
        fontSize: typography.fontSizeMedium,
        color: colors.textSecondary,
        fontWeight: typography.fontWeightMedium,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    optionIcon: {
        marginRight: spacing.md,
    },
    optionText: {
        fontSize: typography.fontSizeMedium,
        color: colors.textPrimary,
    },
    deleteOption: {
        borderBottomWidth: 0,
    },
    deleteText: {
        color: colors.error,
    },
    cancelOptionButton: {
        marginTop: spacing.md,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        backgroundColor: colors.surfaceAlt,
        borderRadius: borderRadius.small,
    },
    cancelOptionText: {
        color: colors.textSecondary,
        fontWeight: typography.fontWeightMedium,
    },
});

export default ListSelectorModal;
