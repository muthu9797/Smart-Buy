import { supabase } from '../../supabase.config';

/**
 * Subscribe to real-time updates for todo items
 */
export const subscribeToTodoList = (familyId, onUpdate) => {
    console.log(`Subscribing to todo_items for family: ${familyId}`);

    // Initial fetch
    fetchTodoItems(familyId).then(items => onUpdate(items));

    // Subscribe to real-time changes (matching groceryService pattern)
    const subscription = supabase
        .channel(`todo_items_${familyId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'todo_items',
            },
            (payload) => {
                console.log('Todo Real-time change:', payload);
                // Refresh the list when there's a change
                fetchTodoItems(familyId).then(items => onUpdate(items));
            }
        )
        .subscribe((status) => {
            console.log(`Todo subscription status for channel todo_items_${familyId}:`, status);
            if (status === 'SUBSCRIBED') {
                console.log('✅ Successfully subscribed to todo real-time updates');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Failed to subscribe to todo real-time updates');
            } else if (status === 'TIMED_OUT') {
                console.error('⚠️ Todo subscription timed out');
            }
        });

    // Return unsubscribe function (matching groceryService pattern)
    return () => {
        subscription.unsubscribe();
    };
};

/**
 * Fetch all todo items for a family
 */
export const fetchTodoItems = async (familyId) => {
    try {
        // console.log(`Fetching todos for family: ${familyId}`);
        const { data, error } = await supabase
            .from('todo_items')
            .select('*')
            .eq('family_id', familyId)
            .order('is_completed', { ascending: true }) // Pending first
            .order('created_at', { ascending: false }); // Newest first

        if (error) throw error;
        // console.log(`Fetched ${data?.length} todos`);
        return data || [];
    } catch (error) {
        console.error('Fetch todo items error:', error);
        return [];
    }
};

/**
 * Add a new todo item
 */
export const addTodoItem = async (familyId, text, userId, userName) => {
    try {
        console.log(`Adding todo item: family=${familyId}, user=${userId}, text=${text}`);
        const { data, error } = await supabase
            .from('todo_items')
            .insert({
                family_id: familyId,
                text: text,
                created_by: userId,
                created_by_name: userName,
                is_completed: false
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, item: data };
    } catch (error) {
        console.error('Add todo item error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Toggle todo item completion
 */
export const toggleTodoItem = async (itemId, currentStatus, userId, userName) => {
    try {
        const updates = {
            is_completed: !currentStatus,
            completed_at: !currentStatus ? new Date().toISOString() : null,
            completed_by: !currentStatus ? userId : null,
            completed_by_name: !currentStatus ? userName : null
        };

        const { data, error } = await supabase
            .from('todo_items')
            .update(updates)
            .eq('id', itemId)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            console.error('Update failed: No rows affected (RLS blocked?)');
            return { success: false, error: 'Update blocked by permission' };
        }

        console.log('Update success:', data);
        return { success: true };
    } catch (error) {
        console.error('Toggle todo item error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update todo item text
 */
export const updateTodoItem = async (itemId, newText) => {
    try {
        const { error } = await supabase
            .from('todo_items')
            .update({ text: newText })
            .eq('id', itemId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Update todo item error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete a todo item
 */
export const deleteTodoItem = async (itemId) => {
    try {
        const { error } = await supabase
            .from('todo_items')
            .delete()
            .eq('id', itemId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Delete todo item error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete multiple todo items by ID
 */
export const deleteTodoItems = async (familyId, itemIds) => {
    try {
        const { error } = await supabase
            .from('todo_items')
            .delete()
            .eq('family_id', familyId)
            .in('id', itemIds);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Bulk delete todo items error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Clear all completed todo items for a family
 */
export const clearCompletedTodos = async (familyId) => {
    try {
        const { error } = await supabase
            .from('todo_items')
            .delete()
            .eq('family_id', familyId)
            .eq('is_completed', true);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Clear completed todos error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Clear all todo items for a family
 */
export const clearAllTodos = async (familyId) => {
    try {
        const { error } = await supabase
            .from('todo_items')
            .delete()
            .eq('family_id', familyId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Clear all todos error:', error);
        return { success: false, error: error.message };
    }
};
