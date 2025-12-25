import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthChange } from './src/services/authService';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import GroceryListScreen from './src/screens/GroceryListScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ToDoListScreen from './src/screens/ToDoListScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors } from './src/styles/theme';

const Stack = createStackNavigator();

function AppContent() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { colors: themeColors } = useTheme();

    useEffect(() => {
        const unsubscribe = onAuthChange((authUser) => {
            setUser(authUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
                <ActivityIndicator size="large" color={themeColors.primary} />
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
                    <Stack.Screen name="ToDoList">
                        {(props) => (
                            <ToDoListScreen
                                {...props}
                                user={user}
                            />
                        )}
                    </Stack.Screen>
                    <Stack.Screen name="Chat">
                        {(props) => (
                            <ChatScreen
                                {...props}
                                user={user}
                            />
                        )}
                    </Stack.Screen>
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                </Stack.Navigator>
            ) : (
                <LoginScreen onLoginSuccess={setUser} />
            )}
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
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
