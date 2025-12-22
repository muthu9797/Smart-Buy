import { supabase } from '../../supabase.config';
import * as WebBrowser from 'expo-web-browser';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession(); // Required for web redirect

/**
 * Sign up a new user with email and password
 */
export const signUp = async (email, password, role, familyId) => {
    try {
        // Create auth user with metadata (trigger will auto-create profile)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: role,
                    family_id: familyId,
                }
            }
        });

        if (authError) throw authError;

        return { success: true, user: authData.user };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Sign in an existing user
 */
export const signIn = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        return { success: true, user: data.user };
    } catch (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Sign in with Google (OAuth)
 */
export const signInWithGoogle = async () => {
    try {
        const redirectUrl = makeRedirectUri({
            path: 'auth/callback',
        });
        console.log('Google Sign-In Redirect URL:', redirectUrl); // DEBUG LOG

        // 1. Start the OAuth flow with Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                skipBrowserRedirect: true,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        if (error) throw error;

        // 2. Open the browser
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        // 3. Handle redirect
        if (result.type === 'success') {
            const { url } = result;
            const { params, errorCode } = QueryParams.getQueryParams(url);

            if (errorCode) throw new Error(errorCode);

            const { access_token, refresh_token } = params;

            if (!access_token) return { success: false, error: 'No access token found' };

            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
            });

            if (sessionError) throw sessionError;

            return { success: true, user: sessionData.user };
        }

        return { success: false, error: 'Sign in cancelled' };
    } catch (error) {
        console.error('Google Sign in error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Sign out the current user
 */
export const logOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get current user's profile from database
 */
export const getUserProfile = async (userId) => {
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId);

            if (error) throw error;

            // Handle case where multiple rows might exist (take the first one)
            // or no rows exist
            let profileData = data && data.length > 0 ? data[0] : null;

            // Self-healing: If profile doesn't exist, try to create it from auth metadata
            if (!profileData) {
                console.log('Profile not found, attempting to create from auth metadata...');
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (user && user.id === userId && user.user_metadata) {
                    const { role, family_id } = user.user_metadata;

                    if (role && family_id) {
                        const { data: newProfile, error: createError } = await supabase
                            .from('profiles')
                            .insert({
                                id: userId,
                                email: user.email,
                                role: role,
                                family_id: family_id,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                            })
                            .select()
                            .single();

                        if (!createError && newProfile) {
                            console.log('✅ Successfully created missing profile');
                            profileData = newProfile;
                        } else {
                            console.error('Failed to auto-create profile:', createError);
                        }
                    }
                }
            }

            if (!profileData) {
                throw new Error('User profile not found');
            }

            // Transform snake_case to camelCase for app compatibility
            const profile = {
                id: profileData.id,
                email: profileData.email,
                role: profileData.role,
                familyId: profileData.family_id,
                fullName: profileData.full_name, // Map snake_case to camelCase
                createdAt: profileData.created_at,
                updatedAt: profileData.updated_at,
            };

            return { success: true, profile };
        } catch (error) {
            console.error(`Get user profile attempt ${attempt + 1} error:`, error);

            // If it's a 500 error (server error), retry
            // Supabase errors might not always have a status code, but if message is HTML it's likely a 500 from Cloudflare
            const isServerError = error.message && (error.message.includes('<html>') || error.status === 500 || error.code === '500');

            if (isServerError && attempt < MAX_RETRIES - 1) {
                attempt++;
                // Wait 1 second before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }

            // Format error message if it's HTML
            let errorMessage = error.message;
            if (errorMessage && errorMessage.includes('<html>')) {
                errorMessage = 'Server is temporarily unavailable. Please try again later.';
            }

            return { success: false, error: errorMessage };
        }
    }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
    try {
        // Transform camelCase to snake_case for DB
        const dbUpdates = {};
        if (updates.role) dbUpdates.role = updates.role;
        if (updates.familyId) dbUpdates.family_id = updates.familyId;
        if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;

        dbUpdates.updated_at = new Date().toISOString();

        if (updates.email) dbUpdates.email = updates.email; // Required for insert if not present

        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                ...dbUpdates,
                updated_at: new Date().toISOString(),
                // If creating, we want created_at to be set. upsert handles this if we pass it, 
                // but usually created_at has a default. 
                // Ideally we should rely on database defaults for created_at if possible or set it if missing.
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Listen to authentication state changes
 */
export const onAuthChange = (callback) => {
    // 1. Get initial session immediately
    supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
            console.error('Error getting session:', error);
            callback(null);
        } else {
            // Only callback if we have a session, otherwise wait for auth listener?
            // Actually, we should callback(null) if nosession so loading stops.
            callback(session?.user || null);
        }
    });

    // 2. Listen for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
            console.log('Auth State Change:', event, session?.user?.email);
            callback(session?.user || null);
        }
    );

    return () => subscription.unsubscribe();
};
