import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams , useRouter } from 'expo-router';

import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';

export default function BookChatScreen() {
    const { colors, currentTheme } = useTheme();
    const typography = useTypography();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { bookId, bookTitle } = useLocalSearchParams();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["right", "left"]}>
        <View style={[styles.header, { height: 60 + insets.top, paddingTop: insets.top, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={22} color={colors.icon} />
            </Pressable>
            <View style={styles.headerContent}>
                <Text style={[typography.h3, { color: colors.text }]}>Chat</Text>
                <Text style={[typography.bodyCaption, { color: colors.secondaryText, maxWidth: '80%' }]} numberOfLines={1} ellipsizeMode="tail">{bookTitle}</Text>
            </View>
            <View style={styles.headerRight}>
                <Ionicons name="ellipsis-horizontal" size={22} color={colors.icon} />
            </View>
        </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 38,
        minHeight: 38,
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    headerRight: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 38,
        minHeight: 38,
    },
});
