import { supabase } from '../../supabase.config';

/**
 * Fetch messages for a specific family
 */
export const getMessages = async (familyId) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('family_id', familyId)
            .order('created_at', { ascending: true }); // Chat order

        if (error) throw error;
        return { success: true, messages: data };
    } catch (error) {
        console.error('Error fetching messages:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send a new message
 */
export const sendMessage = async (familyId, userId, userName, content) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                family_id: familyId,
                user_id: userId,
                user_name: userName,
                content: content
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, message: data };
    } catch (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Subscribe to new messages for a family
 */
export const subscribeToMessages = (familyId, onInsert) => {
    const subscription = supabase
        .channel(`public:messages:family_id=eq.${familyId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `family_id=eq.${familyId}`
            },
            (payload) => {
                onInsert(payload.new);
            }
        )
        .subscribe();

    return subscription;
};
