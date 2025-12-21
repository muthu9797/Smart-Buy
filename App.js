import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthChange } from './src/services/authService';
import LoginScreen from './src/screens/LoginScreen';
import GroceryListScreen from './src/screens/GroceryListScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { colors } from './src/styles/theme';

const Stack = createStackNavigator();

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange((authUser) => {
            setUser(authUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? (
                <Stack.Navigator
                    screenOptions={{
                        headerShown: false,
                    }}
                >
                    <Stack.Screen name="GroceryList">
                        {(props) => (
                            <GroceryListScreen
                                {...props}
                                user={user}
                                onLogout={() => setUser(null)}
                            />
                        )}
                    </Stack.Screen>
                    <Stack.Screen name="Profile">
                        {(props) => (
                            <ProfileScreen
                                {...props}
                                user={user}
                                onLogout={() => setUser(null)}
                            />
                        )}
                    </Stack.Screen>
                </Stack.Navigator>
            ) : (
                <LoginScreen onLoginSuccess={setUser} />
            )}
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
});
