import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
// Configure notification behavior
try {
    if (Constants.appOwnership !== 'expo') {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });
    }
} catch (error) {
    console.warn('Notification handler setup failed (likely Expo Go environment):', error.message);
}

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async () => {
    // Check for Expo Go environment to avoid "remote notifications removed" error in SDK 53
    if (Constants.appOwnership === 'expo') {
        console.warn('Skipping notification permissions in Expo Go to avoid SDK 53 errors.');
        return false;
    }

    try {
        if (Constants.appOwnership === 'expo') {
            // In Expo Go, we can't use remote notifications, but local ones might still work or we should just skip
            // However, getPermissionsAsync might throw.
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push notification permissions');
            return false;
        }

        return true;
    } catch (error) {
        if (error.message && error.message.includes('Expo Go')) {
            console.warn('Push notifications are not supported in Expo Go (SDK 53+). Skipping permission request.');
            return false;
        }
        console.error('Request notification permissions error:', error);
        return false;
    }
};

/**
 * Schedule a local notification for new item added
 */
export const sendNewItemNotification = async (itemName, addedByRole) => {
    if (Constants.appOwnership === 'expo') return;
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🛒 New Grocery Item',
                body: `${addedByRole} added: ${itemName}`,
                data: { type: 'new_item', itemName },
                sound: true,
            },
            trigger: null, // Send immediately
        });
    } catch (error) {
        console.error('Send new item notification error:', error);
    }
};

/**
 * Schedule a local notification for item marked as bought
 */
export const sendItemBoughtNotification = async (itemName, boughtByRole) => {
    if (Constants.appOwnership === 'expo') return;
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '✅ Item Purchased',
                body: `${boughtByRole} bought: ${itemName}`,
                data: { type: 'item_bought', itemName },
                sound: true,
            },
            trigger: null, // Send immediately
        });
    } catch (error) {
        console.error('Send item bought notification error:', error);
    }
};

/**
 * Add notification response listener
 */
export const addNotificationResponseListener = (callback) => {
    if (Constants.appOwnership === 'expo') return { remove: () => { } };
    return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Add notification received listener (for foreground notifications)
 */
export const addNotificationReceivedListener = (callback) => {
    if (Constants.appOwnership === 'expo') return { remove: () => { } };
    return Notifications.addNotificationReceivedListener(callback);
};
