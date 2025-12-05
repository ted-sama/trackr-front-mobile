import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, FlatList, ScrollView, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { router } from "expo-router";
import { useUserStore } from "@/stores/userStore";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import BookListElement from "@/components/BookListElement";
import CategorySlider from "@/components/CategorySlider";
import { useMostTrackedCategory, useTopRatedCategory } from "@/hooks/queries/categories";
import Avatar from "@/components/ui/Avatar";
import { ChevronRight } from "lucide-react-native";
import { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import SkeletonLoader from "@/components/skeleton-loader/SkeletonLoader";

export default function Index() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { currentUser } = useUserStore();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  // Subscribe to trackedBooks state directly so the component re-renders when it changes
  const trackedBooks = useTrackedBooksStore((state) => state.trackedBooks);
  const { data: mostTracked, isLoading: isLoadingMostTracked } = useMostTrackedCategory();
  const { data: topRated, isLoading: isLoadingTopRated } = useTopRatedCategory();

  const isLoading = isLoadingMostTracked || isLoadingTopRated;
  
  const lastRead = React.useMemo(() => {
    const booksArray = Object.values(trackedBooks).filter(book => book && book.id);
    return booksArray.filter(book => book.trackingStatus?.currentChapter && book.trackingStatus?.lastReadAt !== null).sort((a, b) => {
      if (a.trackingStatus?.lastReadAt && b.trackingStatus?.lastReadAt) {
        return new Date(b.trackingStatus.lastReadAt).getTime() - new Date(a.trackingStatus.lastReadAt).getTime();
      }
      return 0;
    }).slice(0, 3);
  }, [trackedBooks]);

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 220 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 220 });
  };

  if (isLoading) {
    return (
      <SafeAreaView
        edges={["right", "left"]}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />

        {/* Blurred header with gradient fade */}
        <View style={[styles.headerContainer, { height: 80 + insets.top }]}>
          <MaskedView
            style={StyleSheet.absoluteFillObject}
            maskElement={
              <LinearGradient
                colors={[
                  'rgba(0, 0, 0, 1)',
                  'rgba(0, 0, 0, 1)',
                  'rgba(0, 0, 0, 0.98)',
                  'rgba(0, 0, 0, 0.95)',
                  'rgba(0, 0, 0, 0.9)',
                  'rgba(0, 0, 0, 0.82)',
                  'rgba(0, 0, 0, 0.7)',
                  'rgba(0, 0, 0, 0.55)',
                  'rgba(0, 0, 0, 0.4)',
                  'rgba(0, 0, 0, 0.25)',
                  'rgba(0, 0, 0, 0.12)',
                  'rgba(0, 0, 0, 0.05)',
                  'rgba(0, 0, 0, 0.02)',
                  'rgba(0, 0, 0, 0)',
                ]}
                locations={[0, 0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.94, 0.97, 1]}
                dither={true}
                style={{ flex: 1 }}
              />
            }
          >
            <BlurView
              intensity={8}
              tint={currentTheme === "dark" ? "dark" : "light"}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor:
                    currentTheme === "dark"
                      ? "rgba(0,0,0,0.3)"
                      : "rgba(255,255,255,0.1)",
                },
              ]}
            />
          </MaskedView>

          {/* Header content skeleton */}
          <View style={[styles.header, { paddingTop: 12 + insets.top, paddingHorizontal: 16 }]}>
            <SkeletonLoader width={32} height={32} style={{ borderRadius: 16 }} />
          </View>
        </View>

        <ScrollView style={{ flex: 1 }}>
          <View style={styles.content}>
            {/* Last Read section skeleton */}
            <View style={styles.lastReadContainer}>
              <SkeletonLoader width={120} height={20} style={{ marginBottom: 16 }} />
              {[1, 2, 3].map((item) => (
                <View key={item} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <SkeletonLoader width={40} height={60} style={{ borderRadius: 4 }} />
                    <View style={{ flex: 1, justifyContent: "space-between" }}>
                      <View>
                        <SkeletonLoader width="80%" height={16} style={{ marginBottom: 4 }} />
                        <SkeletonLoader width="60%" height={12} style={{ marginBottom: 4 }} />
                        <View style={{ flexDirection: "row", gap: 4 }}>
                          <SkeletonLoader width={60} height={20} style={{ borderRadius: 10 }} />
                          <SkeletonLoader width={40} height={20} style={{ borderRadius: 10 }} />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              <SkeletonLoader width={140} height={16} style={{ marginTop: 22, alignSelf: "center" }} />
            </View>

            {/* Category sliders skeleton */}
            <View style={{ marginHorizontal: -16, marginTop: 20 }}>
              <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
                <SkeletonLoader width={180} height={20} />
              </View>
              <View style={{ flexDirection: "row", paddingLeft: 16 }}>
                {[1, 2, 3].map((item) => (
                  <View key={item} style={{ marginRight: 12 }}>
                    <SkeletonLoader width={110} height={165} style={{ borderRadius: 6, marginBottom: 8 }} />
                    <SkeletonLoader width={100} height={14} style={{ marginBottom: 4 }} />
                    <SkeletonLoader width={80} height={12} />
                  </View>
                ))}
              </View>
            </View>

            <View style={{ marginHorizontal: -16, marginTop: 20 }}>
              <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
                <SkeletonLoader width={180} height={20} />
              </View>
              <View style={{ flexDirection: "row", paddingLeft: 16 }}>
                {[1, 2, 3].map((item) => (
                  <View key={item} style={{ marginRight: 12 }}>
                    <SkeletonLoader width={110} height={165} style={{ borderRadius: 6, marginBottom: 8 }} />
                    <SkeletonLoader width={100} height={14} style={{ marginBottom: 4 }} />
                    <SkeletonLoader width={80} height={12} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["right", "left"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />

      {/* Blurred header with gradient fade */}
      <View style={[styles.headerContainer, { height: 80 + insets.top }]}>
        <MaskedView
          style={StyleSheet.absoluteFillObject}
          maskElement={
            <LinearGradient
              colors={[
                'rgba(0, 0, 0, 1)',
                'rgba(0, 0, 0, 1)',
                'rgba(0, 0, 0, 0.98)',
                'rgba(0, 0, 0, 0.95)',
                'rgba(0, 0, 0, 0.9)',
                'rgba(0, 0, 0, 0.82)',
                'rgba(0, 0, 0, 0.7)',
                'rgba(0, 0, 0, 0.55)',
                'rgba(0, 0, 0, 0.4)',
                'rgba(0, 0, 0, 0.25)',
                'rgba(0, 0, 0, 0.12)',
                'rgba(0, 0, 0, 0.05)',
                'rgba(0, 0, 0, 0.02)',
                'rgba(0, 0, 0, 0)',
              ]}
              locations={[0, 0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.94, 0.97, 1]}
              dither={true}
              style={{ flex: 1 }}
            />
          }
        >
          <BlurView
            intensity={8}
            tint={currentTheme === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFillObject}
          />
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor:
                  currentTheme === "dark"
                    ? "rgba(0,0,0,0.3)"
                    : "rgba(255,255,255,0.1)",
              },
            ]}
          />
        </MaskedView>

        {/* Header content */}
        <View style={[styles.header, { paddingTop: 12 + insets.top, paddingHorizontal: 16 }]}>
          <Pressable onPress={() => router.push("/me")}>
            <Avatar image={currentUser?.avatar || ""} size={32} borderWidth={1} borderColor={colors.border} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
      >
      <View style={styles.content}>
        <View style={styles.lastReadContainer}>
          <Text style={[typography.categoryTitle, { color: colors.text, marginBottom: 16 }]}>{t("home.lastRead")}</Text>
          {lastRead.length > 0 ? (
            <FlatList
              data={lastRead}
              renderItem={({ item }) => <BookListElement book={item} compact showTrackingStatus showTrackingChapter onPress={() => {router.push(`/book/${item.id}`)}} />}
              ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
              scrollEnabled={false}
            />
          ) : (
            <Text style={[typography.bodyBold, { color: colors.secondaryText, textAlign: "center" }]}>{t("home.noLastRead")}</Text>
          )}
          <Animated.View style={animatedStyle}>
            <Pressable 
              style={{flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 22 }} 
              onPress={() => router.push("/collection/my-library")}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Text style={[typography.body, { color: colors.accent }]}>{t("home.goToLibrary")}</Text>
              <ChevronRight size={16} strokeWidth={2.5} color={colors.accent} />
            </Pressable>
          </Animated.View>
        </View>
        <View style={{ marginHorizontal: -16 }}>
          {mostTracked && (
            <CategorySlider category={mostTracked} seeMore={false} />
          )}
        </View>
        <View style={{ marginHorizontal: -16 }}>
          {topRated && (
              <CategorySlider category={topRated} seeMore={false} />
          )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 98,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    paddingBottom: 16,
    zIndex: 99,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 160,
    paddingHorizontal: 16,
    paddingBottom: 78,
  },
  lastReadContainer: {
    flexDirection: "column",
    marginBottom: 20,
  },
  bluredStatusBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    zIndex: 1000,
  }
});
