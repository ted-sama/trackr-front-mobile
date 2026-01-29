import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { getPalette } from "@somesoap/react-native-image-palette";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { router } from "expo-router";
import { Pin } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { Book } from "@/types/book";
import { PinnedBookTracking } from "@/hooks/queries/users";
import { useBookRecap, RecapResponse } from "@/hooks/queries/books";
import ProgressBar from "@/components/ui/ProgressBar";
import RecapBottomSheet from "./RecapBottomSheet";

interface PinnedBookCardProps {
  book: Book;
  tracking: PinnedBookTracking | null;
}

const DEFAULT_GRADIENT_COLOR = "#6366f1";

export default function PinnedBookCard({ book, tracking }: PinnedBookCardProps) {
  const { t } = useTranslation();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const [dominantColor, setDominantColor] = useState<string>(DEFAULT_GRADIENT_COLOR);
  const [recapSheetVisible, setRecapSheetVisible] = useState(false);
  const [forceRecap, setForceRecap] = useState(false);
  const recapSheetRef = useRef<TrueSheet>(null);

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 220 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 220 });
  };

  // Extract dominant color from cover image
  useEffect(() => {
    if (book?.coverImage) {
      getPalette(book.coverImage)
        .then((palette) => {
          const color = palette.vibrant || palette.muted || DEFAULT_GRADIENT_COLOR;
          setDominantColor(color);
        })
        .catch(() => {
          setDominantColor(DEFAULT_GRADIENT_COLOR);
        });
    }
  }, [book?.coverImage]);

  // Fetch recap for current chapter
  const currentChapter = tracking?.currentChapter ?? 0;
  const { data: recapData, isLoading: recapLoading, refetch: refetchRecap } = useBookRecap(
    book?.id?.toString(),
    currentChapter > 0 ? currentChapter : undefined,
    { force: forceRecap }
  );

  const totalChapters = book?.chapters ?? 0;
  const isOngoing = book?.status === 'ongoing' || totalChapters === 0;
  const chapterDisplay = isOngoing ? '?' : totalChapters.toString();
  const progressPercent = isOngoing ? null : Math.round((currentChapter / totalChapters) * 100);

  const handleCardPress = () => {
    router.push(`/book/${book.id}`);
  };

  const handleRecapPress = () => {
    recapSheetRef.current?.present();
    setRecapSheetVisible(true);
  };

  const handleRecapSheetClose = () => {
    setRecapSheetVisible(false);
  };

  const handleContinueReading = () => {
    recapSheetRef.current?.dismiss();
    setRecapSheetVisible(false);
    router.push(`/book/${book.id}`);
  };

  // Dev mode: force recap generation on long press
  const handleForceRecap = () => {
    if (__DEV__) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setForceRecap(true);
      Alert.alert("Dev Mode", "Forcing recap generation...");
    }
  };

  // Create gradient colors based on dominant color - more vibrant and visible
  const gradientColors = currentTheme === "dark"
    ? [`${dominantColor}60`, `${dominantColor}35`, `${dominantColor}18`]
    : [`${dominantColor}45`, `${dominantColor}25`, `${dominantColor}12`];

  const authorText = book?.type === "comic"
    ? book?.publishers?.map((p) => p.name).join(", ")
    : book?.authors?.map((a) => a.name).join(", ");

  const chapterLabel = book?.type === "comic" ? t("book.issue") : t("book.chapter");

  return (
    <>
      <Pressable
        onPress={handleCardPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[animatedStyle]}>
          <LinearGradient
            colors={gradientColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, { borderColor: `${dominantColor}45` }]}
          >
            {/* Pin icon */}
            <View style={styles.pinIcon}>
              <Pin size={14} color={dominantColor} fill={dominantColor} />
            </View>

            <View style={styles.content}>
              {/* Cover Image */}
              <Image
                source={{ uri: book?.coverImage }}
                style={styles.coverImage}
                contentFit="cover"
                transition={200}
              />

              {/* Book Info */}
              <View style={styles.infoContainer}>
                <Text
                  style={[typography.h3, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {book?.title}
                </Text>
                <Text
                  style={[typography.caption, { color: colors.secondaryText }]}
                  numberOfLines={1}
                >
                  {authorText || t("common.book")}
                </Text>

                {/* Progress Section */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={[typography.bodyCaption, { color: colors.secondaryText }]}>
                      {chapterLabel} {currentChapter}/{chapterDisplay}
                    </Text>
                    {progressPercent !== null && (
                      <Text style={[typography.bodyCaption, { color: colors.secondaryText }]}>
                        {progressPercent}%
                      </Text>
                    )}
                  </View>
                  {!isOngoing && (
                    <ProgressBar
                      current={currentChapter}
                      max={totalChapters}
                      height={4}
                      progressColor={dominantColor}
                      style={{ marginTop: 4 }}
                    />
                  )}
                </View>

                {/* Recap Preview */}
                {recapData?.recap && currentChapter > 0 && (
                  <Pressable
                    onPress={handleRecapPress}
                    style={[styles.recapContainer, { backgroundColor: `${dominantColor}15` }]}
                  >
                    <Text
                      style={[typography.bodyCaption, { color: colors.text, opacity: 0.8 }]}
                      numberOfLines={2}
                    >
                      {recapData.recap}
                    </Text>
                    <Text
                      style={[typography.caption, { color: dominantColor, marginTop: 4 }]}
                    >
                      {t("home.tapToReadMore")} →
                    </Text>
                  </Pressable>
                )}

                {/* Recap available soon (3h delay not reached) */}
                {recapData?.availableAt && !recapData?.recap && currentChapter > 0 && (
                  <Pressable
                    onLongPress={handleForceRecap}
                    delayLongPress={500}
                    style={[styles.recapContainer, { backgroundColor: `${dominantColor}15` }]}
                  >
                    <Text style={[typography.bodyCaption, { color: colors.secondaryText }]}>
                      {t("home.recapAvailableSoon")}
                    </Text>
                    {__DEV__ && (
                      <Text style={[typography.caption, { color: colors.secondaryText, opacity: 0.5, marginTop: 2 }]}>
                        Long press to force (dev)
                      </Text>
                    )}
                  </Pressable>
                )}

                {recapLoading && currentChapter > 0 && (
                  <View style={[styles.recapContainer, { backgroundColor: `${dominantColor}15` }]}>
                    <Text style={[typography.bodyCaption, { color: colors.secondaryText }]}>
                      {t("common.loading")}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>

      <RecapBottomSheet
        ref={recapSheetRef}
        bookTitle={book?.title ?? ""}
        chapter={currentChapter}
        recap={recapData?.recap ?? ""}
        isComic={book?.type === "comic"}
        onClose={handleRecapSheetClose}
        onContinueReading={handleContinueReading}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  pinIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
  content: {
    flexDirection: "row",
    gap: 12,
  },
  coverImage: {
    width: 70,
    height: 70 * 1.5,
    borderRadius: 8,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recapContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
});
