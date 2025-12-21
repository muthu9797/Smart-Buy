import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';

const NotificationBadge = ({ count }) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        if (count > 0) {
            // Pulse animation when new notifications arrive
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.3,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [count]);

    if (count === 0) return null;

    return (
        <Animated.View
            style={[
                styles.badge,
                { transform: [{ scale: scaleAnim }] }
            ]}
        >
            <Text style={styles.badgeText}>
                {count > 99 ? '99+' : count}
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: colors.error,
        borderRadius: borderRadius.round,
        minWidth: 20,
        height: 20,
        paddingHorizontal: spacing.xs,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
    },
    badgeText: {
        color: colors.surface,
        fontSize: 11,
        fontWeight: typography.fontWeightBold,
    },
});

export default NotificationBadge;
