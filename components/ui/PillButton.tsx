import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { Pressable, Text, StyleSheet } from "react-native";
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from "react-native-reanimated";

interface PillButtonProps {
    title: string;
    icon?: React.ReactNode;
    style?: 'default' | 'destructive';
    disabled?: boolean;
    selected?: boolean;
    toggleable?: boolean;
    onPress?: () => void;
}

export default function PillButton({title, icon = null, style = 'default', disabled = false, selected = false, toggleable = false, onPress = () => {}}: PillButtonProps) {
    const { colors } = useTheme();
    const typography = useTypography();
    const scaleAnim = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scaleAnim.value }]
    }));
    return (
        <Animated.View style={animatedStyle}>
            <Pressable
                style={[
                    styles.actionButton,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    style === 'destructive' && { backgroundColor: colors.card, borderColor: colors.error },
                    toggleable && !selected && { opacity: 0.4 },
                    disabled && { opacity: 0.5 },
                ]}
                onPress={onPress}
                onPressIn={() => {scaleAnim.value = withTiming(0.98, { duration: 220 });}}
                onPressOut={() => {scaleAnim.value = withTiming(1, { duration: 220 });}}
                disabled={disabled}
            >
                {icon}
                <Text
                    style={[
                        typography.caption,
                        { color: style === 'destructive' ? colors.error : colors.secondaryText },
                    ]}
                >
                    {title}
                </Text>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    }
});
