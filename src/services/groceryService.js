import { supabase } from '../../supabase.config';

/**
 * Add a new grocery item
 */
/**
 * Add a new grocery item
 */
export const addGroceryItem = async (familyId, itemName, quantity, userId, userRole, userName, emoji, listId) => {
    // console.log('Adding grocery item:', { familyId, itemName, quantity, userId, userRole, userName, emoji, listId });
    try {
        const itemData = {
            family_id: familyId,
            name: itemName,
            quantity: quantity || '1',
            added_by: userId,
            added_by_role: userRole,
            added_by_name: userName,
            is_bought: false,
            emoji: emoji || '🛒',
        };

        if (listId) {
            itemData.list_id = listId;
        }

        const { data, error } = await supabase
            .from('grocery_items')
            .insert(itemData)
            .select()
            .single();

        if (error) throw error;

        // console.log('Item added successfully:', data);
        return { success: true, itemId: data.id };
    } catch (error) {
        console.error('Add grocery item error:', error);

        let errorMessage = error.message;
        if (errorMessage && (errorMessage.includes('JSON Parse error') || errorMessage.includes('Unexpected character') || errorMessage.includes('<html>'))) {
            errorMessage = 'Server is temporarily unavailable. Please try again later.';
        }

        return { success: false, error: errorMessage };
    }
};

/**
 * Mark an item as bought
 */
export const markItemAsBought = async (familyId, itemId, userId, userName) => {
    try {
        const { error } = await supabase
            .from('grocery_items')
            .update({
                is_bought: true,
                bought_by: userId,
                bought_by_name: userName, // New field
                bought_at: new Date().toISOString(),
            })
            .eq('id', itemId)
            .eq('family_id', familyId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Mark item as bought error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Unmark an item as bought (toggle back)
 */
export const unmarkItemAsBought = async (familyId, itemId) => {
    try {
        const { error } = await supabase
            .from('grocery_items')
            .update({
                is_bought: false,
                bought_by: null,
                bought_by_name: null, // Clear field
                bought_at: null,
            })
            .eq('id', itemId)
            .eq('family_id', familyId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Unmark item error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete a grocery item
 */
export const deleteGroceryItem = async (familyId, itemId) => {
    try {
        const { data, error } = await supabase
            .from('grocery_items')
            .delete()
            .eq('id', itemId)
            .eq('family_id', familyId)
            .select();

        if (error) throw error;

        // If no data returned, it means the item wasn't found or RLS blocked it
        // If no data returned, it means the item wasn't found or RLS blocked it
        if (!data || data.length === 0) {
            return { success: false, error: 'Item not found or permission denied (RLS)' };
        }

        return { success: true };
    } catch (error) {
        console.error('Delete grocery item error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Clear all grocery items for a family
 */
export const clearAllGroceryItems = async (familyId) => {
    try {
        const { error } = await supabase
            .from('grocery_items')
            .delete()
            .eq('family_id', familyId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Clear all items error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Clear only purchased items for a family
 */
export const clearPurchasedItems = async (familyId) => {
    try {
        const { error } = await supabase
            .from('grocery_items')
            .delete()
            .eq('family_id', familyId)
            .eq('is_bought', true);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Clear purchased items error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete multiple grocery items by ID
 */
export const deleteGroceryItems = async (familyId, itemIds) => {
    try {
        const { error } = await supabase
            .from('grocery_items')
            .delete()
            .eq('family_id', familyId)
            .in('id', itemIds);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Bulk delete items error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update a grocery item
 */
export const updateGroceryItem = async (familyId, itemId, updates) => {
    try {
        const { error } = await supabase
            .from('grocery_items')
            .update({
                name: updates.name,
                quantity: updates.quantity,
                emoji: updates.emoji,
                updated_at: new Date().toISOString(),
            })
            .eq('id', itemId)
            .eq('family_id', familyId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Update grocery item error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Subscribe to real-time updates of grocery items
 * Returns an unsubscribe function
 */
export const subscribeToGroceryList = (familyId, onUpdate, onError) => {
    // Initial fetch
    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from('grocery_items')
                .select('*')
                .eq('family_id', familyId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Convert snake_case to camelCase for consistency with original code
            const items = data.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity || '1',
                addedBy: item.added_by,
                addedByRole: item.added_by_role,
                addedByName: item.added_by_name, // New field, fallback handled in UI
                isBought: item.is_bought,
                boughtBy: item.bought_by,
                boughtByName: item.bought_by_name, // New field
                boughtAt: item.bought_at,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                emoji: item.emoji || '🛒',
                listId: item.list_id, // Map list_id
            }));

            onUpdate(items);
        } catch (error) {
            console.error('Fetch grocery items error:', error);

            let errorMessage = error.message;
            // Check for JSON parse error (HTML response) or explicit HTML content
            if (errorMessage && (errorMessage.includes('JSON Parse error') || errorMessage.includes('Unexpected character') || errorMessage.includes('<html>'))) {
                errorMessage = 'Server is temporarily unavailable. Please try again later.';
            }

            if (onError) onError(errorMessage);
        }
    };

    // Fetch initial data
    fetchItems();

    // Subscribe to real-time changes
    const subscription = supabase
        .channel(`grocery_items_${familyId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'grocery_items',
            },
            (payload) => {
                console.log('Real-time change:', payload);
                // Refresh the list when there's a change
                fetchItems();
            }
        )
        .subscribe((status) => {
            console.log(`Supabase subscription status for channel grocery_items_${familyId}:`, status);
            if (status === 'SUBSCRIBED') {
                console.log('✅ Successfully subscribed to real-time updates');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Failed to subscribe to real-time updates');
            } else if (status === 'TIMED_OUT') {
                console.error('⚠️ Subscription timed out');
            }
        });

    // Return unsubscribe function
    return () => {
        subscription.unsubscribe();
    };
};

/**
 * Get all lists for a family
 */
export const getLists = async (familyId) => {
    try {
        const { data, error } = await supabase
            .from('lists')
            .select('*')
            .eq('family_id', familyId)
            .order('created_at', { ascending: true }); // Daily first usually

        if (error) throw error;

        return { success: true, lists: data };
    } catch (error) {
        console.error('Get lists error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Create a new list
 */
export const createList = async (familyId, name) => {
    try {
        const { data, error } = await supabase
            .from('lists')
            .insert({
                family_id: familyId,
                name: name,
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, list: data };
    } catch (error) {
        console.error('Create list error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete a list
 */
export const deleteList = async (listId) => {
    try {
        // Items cascade delete, so just delete the list
        const { error } = await supabase
            .from('lists')
            .delete()
            .eq('id', listId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Delete list error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update a list (e.g. rename, lock)
 */
export const updateList = async (listId, updates) => {
    try {
        const { data, error } = await supabase
            .from('lists')
            .update(updates)
            .eq('id', listId)
            .select()
            .single();

        if (error) throw error;

        return { success: true, list: data };
    } catch (error) {
        console.error('Update list error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Duplicate a list and its items
 */
export const duplicateList = async (listId, familyId, newName) => {
    try {
        // 1. Create new list
        const { data: newList, error: createError } = await supabase
            .from('lists')
            .insert({
                family_id: familyId,
                name: newName,
            })
            .select()
            .single();

        if (createError) throw createError;

        // 2. Fetch existing items
        const { data: existingItems, error: fetchError } = await supabase
            .from('grocery_items')
            .select('*')
            .eq('list_id', listId);

        if (fetchError) throw fetchError;

        if (existingItems && existingItems.length > 0) {
            // 3. Prepare items for new list
            const newItems = existingItems.map(item => ({
                family_id: familyId,
                list_id: newList.id,
                name: item.name,
                is_bought: item.is_bought,
                quantity: item.quantity,
                added_by: item.added_by,
                added_by_name: item.added_by_name,
                added_by_role: item.added_by_role,
                emoji: item.emoji
            }));

            // 4. Bulk insert
            const { error: insertError } = await supabase
                .from('grocery_items')
                .insert(newItems);

            if (insertError) throw insertError;
        }

        return { success: true, list: newList };
    } catch (error) {
        console.error('Duplicate list error:', error);
        return { success: false, error: error.message };
    }
};
