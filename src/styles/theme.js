export const colors = {
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

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const typography = {
    fontSizeSmall: 12,
    fontSizeNormal: 14,
    fontSizeMedium: 16,
    fontSizeLarge: 18,
    fontSizeXL: 24,
    fontSizeXXL: 32,

    fontWeightNormal: '400',
    fontWeightMedium: '500',
    fontWeightBold: '700',
};

export const borderRadius = {
    small: 8,
    medium: 12,
    large: 16,
    xl: 24,
    round: 999,
};

export const shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
};

export const getColorForName = (name) => {
    if (!name) return colors.primary;

    // Simple hash function to generate consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Predefined palette of nice colors
    const palette = [
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        '#45B7D1', // Blue
        '#96CEB4', // Green
        '#FFEEAD', // Yellow
        '#D4A5A5', // Pink
        '#9B59B6', // Purple
        '#3498DB', // Blue
        '#E67E22', // Orange
        '#2ECC71', // Green
    ];

    const index = Math.abs(hash) % palette.length;
    return palette[index];
};
