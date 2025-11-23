import React, { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import { useMeStats } from "@/hooks/queries/users";
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

  const { data: stats, isLoading, isError } = useMeStats();

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

  const avgScore =
    typeof stats?.overview.avgScoreCompleted === "number"
      ? stats.overview.avgScoreCompleted
      : Number(stats?.overview.avgScoreCompleted ?? 0);

  const overviewCards = stats
    ? [
        {
          key: "totalFollowed",
          label: t("stats.overview"),
          title: `${stats.overview.totalFollowed}`,
          subtitle: t("profile.lists"),
        },
        {
          key: "chapters",
          label: t("book.chapter"),
          title: `${stats.overview.totalChaptersRead}`,
          subtitle: t("stats.activity"),
        },
        {
          key: "volumes",
          label: "Volumes",
          title: `${stats.overview.totalVolumesRead}`,
          subtitle: t("activity.title"),
        },
        {
          key: "completed",
          label: t("status.completed", "Completed"),
          title: `${stats.overview.completedCount}`,
          subtitle: t("profile.favorites"),
        },
        {
          key: "reading",
          label: t("status.reading", "Reading"),
          title: `${stats.overview.readingCount}`,
          subtitle: t("stats.funnel"),
        },
        {
          key: "avgScore",
          label: t("book.rating"),
          title: avgScore ? avgScore.toFixed(1) : "–",
          subtitle: "moyenne",
        },
      ]
    : [];

  const genreData = stats
    ? stats.distributions.genres
        .slice(0, 7)
        .map((g) => ({ label: g.x, value: Number(g.y) }))
        .sort((a, b) => b.value - a.value)
    : [];

  const ratingData = stats
    ? stats.distributions.ratings
        .map((r) => ({ label: r.x, value: Number(r.y) }))
        .sort((a, b) => parseFloat(b.label) - parseFloat(a.label))
    : [];

  const activityData = [
    { label: "2025-10", value: 100 },
    { label: "2025-11", value: 400 },
    { label: "2025-12", value: 234 },
    { label: "2026-01", value: 345 },
    { label: "2026-02", value: 456 },
    { label: "2026-03", value: 567 },
  ]

    console.log(activityData);

  const seriesDistributionData = stats
    ? stats.series.distribution.map((d) => ({
        label: d.x,
        value: Number(d.y),
      }))
    : [];

  const authorsData = stats
    ? stats.authors.map((a) => ({
        label: a.x,
        value: Number(a.y),
      }))
    : [];






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
        title={t("stats.title")}
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
            {t("stats.title")}
          </Text>
          <Text
            style={[
              typography.body,
              {
                color: colors.secondaryText,
                marginTop: 4,
              },
            ]}
          >
            {t("stats.overview")}
          </Text>
        </View>

        <View style={{ gap: 24 }}>
          <OverviewCards cards={overviewCards} title={t("stats.overview")} />
          <ActivityChart
            data={activityData}
            title={t("stats.activity")}
            font={font}
          />
          <GenreChart data={genreData} title={t("stats.genres")} font={font} />
          <RatingChart
            data={ratingData}
            title={t("stats.ratings")}
            font={font}
          />
          <ReadingHeatmap
            data={stats?.preferences.heatmap ?? []}
            title={t("stats.heatmap")}
          />
          <SeriesChart
            distributionData={seriesDistributionData}
            currentProgress={stats?.series.currentProgress ?? []}
            title={t("stats.series")}
            font={font}
          />
          {stats?.funnel.counts && (
            <FunnelChart
              counts={stats.funnel.counts}
              title={t("stats.funnel")}
            />
          )}
          <AuthorsChart data={authorsData} title={t("stats.authors")} />
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

