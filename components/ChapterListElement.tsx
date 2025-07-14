import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { Chapter } from '@/types/chapter';
import { CalendarDaysIcon } from 'lucide-react-native';
export default function ChapterListElement({ chapter }: { chapter: Chapter }) {
    const { colors } = useTheme();
    const typography = useTypography();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        scale.value = withTiming(0.97, { duration: 100 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
    };

    const handlePress = () => {
        Linking.openURL(chapter.externalUrl);
    };

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
            <Animated.View style={[styles.container, { backgroundColor: colors.card }, animatedStyle]}>
                <Text style={[typography.bodyBold, { color: colors.text }]}>{chapter.chapter}</Text>
                <Text style={[typography.body, { color: colors.text }]}>{chapter.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <CalendarDaysIcon size={16} color={colors.secondaryText} />
                    <Text style={[typography.body, { color: colors.secondaryText }]}>Sorti le {new Date(chapter.publishedAt).toLocaleDateString()}</Text>
                </View>
            </Animated.View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 16,
    }
})