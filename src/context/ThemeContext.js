import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Light theme colors
export const lightColors = {
    // Primary colors
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    primaryLight: '#818cf8',

    // Accent colors
    accent: '#ec4899',
    accentLight: '#f9a8d4',

    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',

    // Neutral colors
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceAlt: '#f1f5f9',

    // Text colors
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    textLight: '#94a3b8',

    // Border colors
    border: '#e2e8f0',
    borderDark: '#cbd5e1',

    // Role-specific colors
    wifeColor: '#ec4899',
    husbandColor: '#3b82f6',
};

// Dark theme colors
export const darkColors = {
    // Primary colors
    primary: '#818cf8',
    primaryDark: '#6366f1',
    primaryLight: '#a5b4fc',

    // Accent colors
    accent: '#f472b6',
    accentLight: '#f9a8d4',

    // Status colors
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',

    // Neutral colors
    background: '#0f172a',
    surface: '#1e293b',
    surfaceAlt: '#334155',

    // Text colors
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textLight: '#64748b',

    // Border colors
    border: '#334155',
    borderDark: '#475569',

    // Role-specific colors
    wifeColor: '#f472b6',
    husbandColor: '#60a5fa',
};

const THEME_STORAGE_KEY = '@app_theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved theme preference on app start
    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme !== null) {
                setIsDarkMode(savedTheme === 'dark');
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTheme = async () => {
        try {
            const newMode = !isDarkMode;
            setIsDarkMode(newMode);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light');
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const colors = isDarkMode ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
