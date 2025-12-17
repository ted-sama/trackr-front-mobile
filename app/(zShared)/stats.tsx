import React, { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import { useMeStats, useUser, useUserStats } from "@/hooks/queries/users";
import { useFont } from "@shopify/react-native-skia";
import { Manrope_500Medium } from "@expo-google-fonts/manrope";
import { OverviewCards } from "@/components/stats/OverviewCards";
import { GenreChart } from "@/components/stats/GenreChart";
import { RatingChart } from "@/components/stats/RatingChart";
import { ActivityChart } from "@/components/stats/ActivityChart";
import { ReadingHeatmap } from "@/components/stats/ReadingHeatmap";
import { FunnelChart } from "@/components/stats/FunnelChart";
import { SeriesChart } from "@/components/stats/SeriesChart";
import { AuthorsChart } from "@/components/stats/AuthorsChart";
import { TypesChart } from "@/components/stats/TypesChart";
import { useUserStore } from "@/stores/userStore";

const AnimatedScrollView = Animated.createAnimatedComponent(
  Animated.ScrollView
);

export default function StatsScreen() {
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState<number>(0);
  const font = useFont(Manrope_500Medium, 11);
  const { username } = useLocalSearchParams<{ username?: string }>();
  const { currentUser } = useUserStore();

  const isMe = !username || username === currentUser?.username;
  const { data: user } = isMe ? { data: currentUser } : useUser(username || '');
  const { data: stats, isLoading, isError } = isMe ? useMeStats() : useUserStats(username);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  if (!stats) {
    // Return early data structures
    const overviewCards = [];
    const genreData = [];
    const ratingData = [];
    const activityData = [];
    const seriesDistributionData = [];
    const authorsData = [];
  }

  const overviewCards = stats
    ? [
        {
          key: "totalFollowed",
          label: t("stats.overview.followed"),
          title: `${stats.overview.totalFollowed}`,
        },
        {
          key: "chapters",
          label: t("stats.overview.chapters"),
          title: `${stats.overview.totalChaptersRead}`,
        },
        {
          key: "streak",
          label: t("stats.overview.streak"),
          title: `${stats.overview.longestStreak} ${t("stats.overview.weeks")}`,
        },
        {
          key: "completed",
          label: t("stats.overview.completed"),
          title: `${stats.overview.completedCount}`,
        },
        {
          key: "reading",
          label: t("stats.overview.reading"),
          title: `${stats.overview.readingCount}`,
        },
        {
          key: "avgRating",
          label: t("stats.overview.rating"),
          title: stats.overview.avgRating ? stats.overview.avgRating : "–",
        },
      ]
    : [];

  const genreData = stats
    ? stats.distributions.genres
        .slice(0, 12)
        .map((g) => ({ label: g.x, value: Number(g.y) }))
        .sort((a, b) => b.value - a.value)
    : [];

  const ratingData = stats
    ? stats.distributions.ratings
        .map((r) => ({ label: r.x, value: Number(r.y) }))
        .sort((a, b) => parseFloat(b.label) - parseFloat(a.label))
    : [];

  const activityData = stats
    ? stats.activity.chaptersReadHistory.map((d) => ({
        label: d.x,
        value: Number(d.y),
      }))
    : [];

  const seriesDistributionData = stats
    ? stats.series.distribution.map((d) => ({
        label: t(`stats.series.${d.x}`),
        value: Number(d.y),
      }))
    : [];

  const authorsData = stats
    ? stats.authors.map((a) => ({
        label: a.x,
        value: Number(a.y),
      }))
    : [];

  const typesData = stats
    ? stats.distributions.types.map((t) => ({
        label: t.x,
        value: Number(t.y),
      }))
    : [];

  const funnelCounts = stats
    ? stats.funnel.counts
    : {
        reading: 0,
        completed: 0,
        on_hold: 0,
        dropped: 0,
      };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError || !stats) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <Text style={[typography.body, { color: colors.secondaryText }]}>
          Une erreur est survenue lors du chargement des statistiques.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />

      <AnimatedHeader
        title={t("stats.title", {name: user?.displayName})}
        scrollY={scrollY}
        onBack={() => router.back()}
        collapseThreshold={titleY > 0 ? titleY : undefined}
      />

      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: insets.top + 70,
          paddingBottom: 64,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={styles.titleContainer}
          onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}
        >
          <Text style={[typography.h1, { color: colors.text }]}>
            {t("stats.title", {name: user?.displayName})}
          </Text>
        </View>

        <View style={{ gap: 24 }}>
          <OverviewCards cards={overviewCards} />
          <FunnelChart counts={funnelCounts} />
          {user?.plan === "plus" && (
            <View style={{ gap: 24 }}>
              <GenreChart data={genreData} />
              <TypesChart data={typesData} />
              <ActivityChart data={activityData} font={font} />
              <RatingChart data={ratingData} font={font} />
              <ReadingHeatmap data={stats?.preferences.heatmap ?? []} />
              <SeriesChart
                distributionData={seriesDistributionData}
                currentProgress={stats?.series.currentProgress ?? []}
                font={font}
              />
              <AuthorsChart data={authorsData} username={isMe ? undefined : username} />
            </View>
          )}
        </View>
      </AnimatedScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 24,
  },
});

