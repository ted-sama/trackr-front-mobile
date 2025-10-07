import React from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { ReadingStatus } from "@/types/reading-status";
import { Clock3, BookOpenIcon, BookCheck, Pause, Square, BookMarked, Eye } from "lucide-react-native";
import { useTranslation } from "react-i18next";

interface TrackingTabBarProps {
  status: string;
  currentChapter?: number | null;
  markLastChapterAsReadDisabled: boolean;
  onStatusPress: () => void;
  onMarkLastChapterAsReadPress: () => void;
  onBookmarkPress: () => void;
}

export function TrackingTabBar({
  status,
  currentChapter,
  markLastChapterAsReadDisabled,
  onMarkLastChapterAsReadPress,
  onBookmarkPress,
  onStatusPress,
}: TrackingTabBarProps) {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  const trackingStatusValues: Record<ReadingStatus, { text: string, icon: React.ReactNode }> = {
    'plan_to_read': { text: t("status.planToRead"), icon: <Clock3 size={20} strokeWidth={2.75} color={colors.planToRead} /> },
    'reading': { text: t("status.reading"), icon: <BookOpenIcon size={20} strokeWidth={2.75} color={colors.reading} /> },
    'completed': { text: t("status.completed"), icon: <BookCheck size={20} strokeWidth={2.75} color={colors.completed} /> },
    'on_hold': { text: t("status.onHold"), icon: <Pause size={20} strokeWidth={2.75} color={colors.onHold} /> },
    'dropped': { text: t("status.dropped"), icon: <Square size={20} strokeWidth={2.75} color={colors.dropped} /> },
  };

  return (
      <View
        style={[
          styles.container,
          {
            width: screenWidth * 0.94,
            height: 64,
            borderCurve: "continuous",
            borderRadius: 50,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.background,
            position: "absolute",
            left: (screenWidth - screenWidth * 0.94) / 2,
            right: (screenWidth - screenWidth * 0.94) / 2,
            bottom: insets.bottom + 16,
            shadowColor: Platform.OS === "android" ? "rgba(0,0,0,0.589)" : "rgba(0,0,0,0.1)",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 12,
            overflow: "hidden",
            zIndex: 100,
          },
        ]}
        accessibilityRole="menu"
        accessibilityLabel="Gestion du suivi"
      >
        <View style={styles.row}>
          <Pressable onPress={onStatusPress} accessibilityRole="button" accessibilityLabel="Changer le statut de suivi">
            <View style={styles.statusContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {trackingStatusValues[status as ReadingStatus].icon}
                <Text style={[typography.trackingTabBarText, { color: colors.text }]} numberOfLines={1} accessibilityLabel={`Statut de suivi : ${status}`}>{trackingStatusValues[status as ReadingStatus].text}</Text>
              </View>
              {currentChapter && (
                <View>
                  <Text style={[typography.trackingTabBarText2, { color: colors.icon }]} numberOfLines={1} accessibilityLabel={`Chapitre : ${currentChapter}`}>{t("book.chapter")} {currentChapter}</Text>
                </View>
              )}
            </View>
          </Pressable>
          <View style={styles.manageButtonContainer}>
            {!markLastChapterAsReadDisabled && (
              <Pressable
                style={({ pressed }) => [styles.manageButton, { backgroundColor: colors.actionButton, opacity: pressed ? 0.8 : 1 }]}
                onPress={onMarkLastChapterAsReadPress}
                accessibilityRole="button"
                accessibilityLabel="Mark last chapter as read"
              >
                <Eye size={20} strokeWidth={2.5} color={colors.icon} />
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.manageButton, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
              onPress={onBookmarkPress}
              accessibilityRole="button"
              accessibilityLabel="Bookmark"
            >
              <LinearGradient
                colors={[colors.primary, "#8A2BE2"]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <BookMarked size={20} strokeWidth={2.5} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: 6,
    paddingTop: 2,
  },
  statusContainer: {
    paddingLeft: 12,
    gap: 4,
  },
  manageButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  manageButton: {
    borderRadius: 100,
    overflow: "hidden",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  aiButtonWrapper: {
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  aiButton: {
    width: 50,
    height: 50,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  chatbotButton: {
    position: "absolute",
    borderRadius: 100,
    width: 60,
    height: 60,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    overflow: "hidden",
    zIndex: 101,
  },
  chatbotGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
}); 