import { useUserStore } from "@/stores/userStore";
import {
  View,
  ScrollView,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import Avatar from "@/components/ui/Avatar";
import PlusBadge from "@/components/ui/PlusBadge";
import { router } from "expo-router";
import BookCard from "@/components/BookCard";
import { useUserLists, useUserTop } from "@/hooks/queries/users";
import CollectionListElement from "@/components/CollectionListElement";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import { useState, useEffect } from "react";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  withTiming,
} from "react-native-reanimated";
import PillButton from "@/components/ui/PillButton";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ChartNoAxesCombined, Notebook, Settings } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import SkeletonLoader from "@/components/skeleton-loader/SkeletonLoader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { getPalette } from "@somesoap/react-native-image-palette";

dayjs.extend(utc);

export default function Profile() {
  const { currentUser } = useUserStore();
  const { data: topBooks, isLoading } = useUserTop();
  const { data: userListsPages } = useUserLists();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const scrollY = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const [titleY, setTitleY] = useState<number>(0);
  const { t } = useTranslation();
  const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

  // Dominant color for gradient
  const [dominantColor, setDominantColor] = useState<string | null>(null);
  const gradientOpacity = useSharedValue(0);

  const gradientAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: gradientOpacity.value,
    };
  });

  const gradientHeight = 275;

  const gradientElasticStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-gradientHeight, 0],
      [2, 1],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [-gradientHeight, 0],
      [-gradientHeight / 2, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
    };
  });

  // Extract dominant color only from backdrop image (not color mode, not avatar)
  useEffect(() => {
    if (currentUser?.backdropMode === "image" && currentUser?.backdropImage) {
      getPalette(currentUser.backdropImage).then(palette => {
        setDominantColor(palette.vibrant);
      });
    } else {
      setDominantColor(null);
    }
  }, [currentUser?.backdropImage, currentUser?.backdropMode]);

  // Animate gradient opacity when dominant color is available
  useEffect(() => {
    if (dominantColor) {
      gradientOpacity.value = withTiming(0.45, { duration: 100 });
    } else {
      gradientOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [dominantColor]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
          {/* Backdrop skeleton */}
          <View style={{ width: "110%", height: 275, marginHorizontal: -16 }}>
            <SkeletonLoader width="100%" height="100%" />
          </View>

          {/* Avatar and name skeleton */}
          <View style={{ alignItems: "center", marginTop: -40, paddingHorizontal: 16 }}>
            <SkeletonLoader width={80} height={80} style={{ borderRadius: 40, borderWidth: 4, borderColor: colors.background }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 }}>
              <SkeletonLoader width={150} height={28} />
            </View>
          </View>

          {/* Action buttons skeleton */}
          <View style={{ flexDirection: "row", gap: 16, paddingHorizontal: 16, marginTop: 24, justifyContent: "center" }}>
            <SkeletonLoader width={100} height={36} style={{ borderRadius: 18 }} />
            <SkeletonLoader width={100} height={36} style={{ borderRadius: 18 }} />
          </View>

          {/* Favorites section skeleton */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <SkeletonLoader width={120} height={20} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              {[1, 2, 3, 4].map((item) => (
                <SkeletonLoader key={item} width={80} height={120} style={{ borderRadius: 4 }} />
              ))}
            </View>
          </View>

          {/* Lists section skeleton */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <SkeletonLoader width={100} height={20} style={{ marginBottom: 12 }} />
            {[1, 2].map((item) => (
              <View key={item} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <SkeletonLoader width={80} height={80} style={{ borderRadius: 4 }} />
                  <View style={{ flex: 1 }}>
                    <SkeletonLoader width="80%" height={18} style={{ marginBottom: 6 }} />
                    <SkeletonLoader width="60%" height={14} style={{ marginBottom: 6 }} />
                    <SkeletonLoader width="40%" height={14} />
                  </View>
                </View>
              </View>
            ))}
            <SkeletonLoader width="100%" height={48} style={{ borderRadius: 16, marginTop: 16 }} />
          </View>
        </ScrollView>

        {/* Header skeleton */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 44 + insets.top,
            paddingTop: insets.top,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ width: 38 }} />
          <SkeletonLoader width={120} height={20} style={{ borderRadius: 4 }} />
          <SkeletonLoader width={22} height={22} style={{ borderRadius: 11 }} />
        </View>
      </View>
    );
  }

  // no-op
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      {dominantColor && (
        <Animated.View
          style={[{
            position: "absolute",
            width: "110%",
            height: gradientHeight,
            alignSelf: "center",
            marginHorizontal: -16,
            marginTop: 0,
            zIndex: -99,
          }, gradientAnimatedStyle, gradientElasticStyle]}
        >
          <LinearGradient
            colors={[dominantColor, colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ width: "100%", height: "100%" }}
          />
        </Animated.View>
      )}
      <AnimatedHeader
        title={currentUser?.username || t("profile.title")}
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        closeRightButton={
          <Pressable
            onPress={() => {
              router.push(`/activity/${currentUser?.username}`);
            }}
          >
            <Notebook size={22} color={colors.icon} />
          </Pressable>
        }
        rightButton={
          <Pressable onPress={() => {
            router.push(`/stats`);
          }}>
            <ChartNoAxesCombined size={22} color={colors.icon} />
          </Pressable>
        }
        farRightButton={
          <Pressable onPress={() => {
            router.push(`/settings`);
          }}>
            <Settings size={22} color={colors.icon} />
          </Pressable>
        }
      />
      <AnimatedScrollView onScroll={scrollHandler} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 64 }}>
        <View style={{ paddingHorizontal: 16 }}>
          {/* Backdrop */}
          <View
            style={{
              marginTop: -insets.top,
              height: 275 + insets.top,
              paddingTop: insets.top + 70,
              marginHorizontal: -16,
            }}
          >
            <View
              style={{
                flex: 1,
                marginHorizontal: 16,
                borderRadius: 24,
                borderWidth: 2,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              {currentUser?.backdropMode === "image" &&
              currentUser?.backdropImage ? (
                <Image
                  source={{ uri: currentUser?.backdropImage }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: currentUser?.backdropColor || colors.accent,
                  }}
                />
              )}
            </View>
          </View>
          <View
            style={{
              alignItems: "center",
              alignSelf: "center",
              marginTop: -40,
              zIndex: 1,
            }}
          >
            <Avatar
              image={currentUser?.avatar || ""}
              size={80}
              borderWidth={4}
              borderColor={colors.background}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                justifyContent: "center",
                marginTop: 16,
              }}
            >
              <Text
                numberOfLines={1}
                ellipsizeMode="clip"
                style={[
                  typography.h1,
                  { color: colors.text, textAlign: "center", maxWidth: 250 },
                ]}
                onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}
              >
                {currentUser?.displayName}
              </Text>
              {currentUser?.plan === "plus" && <PlusBadge />}
            </View>
            <Text style={[typography.body, { color: colors.secondaryText, textAlign: "center" }]}>{currentUser?.username}</Text>
            <Text style={[typography.body, { color: colors.secondaryText, textAlign: "center" }]}>{t("profile.memberSince")} {dayjs.utc(currentUser?.createdAt).format("DD/MM/YYYY")}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 16, paddingHorizontal: 16, marginTop: 24, justifyContent: "center", alignItems: "center" }}>
          <PillButton
            icon={<Ionicons name="pencil" size={16} color={colors.secondaryText} />}
            title={t("profile.edit")}
            onPress={() => {
              router.push(`/profile/${currentUser?.id}/edit`);
            }}
          />
          <PillButton
            icon={<Ionicons name="swap-vertical" size={16} color={colors.secondaryText} />}
            title={t("profile.reorder")}
            disabled={topBooks?.length === 0}
            onPress={() => {
              router.push(`/profile/${currentUser?.id}/reorder`);
            }}
          />
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: 24, gap: 24 }}>
          {topBooks && (
            <View>
              <Text
                style={[
                  typography.categoryTitle,
                  { color: colors.text, marginBottom: 12 },
                ]}
              >
                {t("profile.favorites")}
              </Text>
              {topBooks.length > 0 ? (
                  <View style={{ marginHorizontal: -16 }}>
                  <FlatList
                    data={topBooks}
                    horizontal
                    renderItem={({ item }) => (
                      <BookCard
                        book={item}
                        size="compact-small"
                        showRating={false}
                        showAuthor={false}
                        showTitle={false}
                        onPress={() => {
                          router.push(`/book/${item.id}`);
                        }}
                      />
                    )}
                    ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                    scrollEnabled={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.sliderContent}
                  />
                </View>
              ) : (
                <Text style={[typography.body, { color: colors.secondaryText, textAlign: "center" }]}>{t("profile.noFavorites")}</Text>
              )}
            </View>
          )}
          {userListsPages && userListsPages.pages?.length ? (
            <View>
              <Text
                style={[
                  typography.categoryTitle,
                  { color: colors.text, marginBottom: 12 },
                ]}
              >
                {t("profile.lists")}
              </Text>
              {userListsPages.pages.flatMap((page) => page.data).slice(0, 2).length > 0 ? (
                <FlatList
                  data={(userListsPages.pages.flatMap((page) => page.data) ?? []).slice(0, 2)}
                  renderItem={({ item }) => (
                    <CollectionListElement
                      list={item}
                      onPress={() => {
                        router.push(`/list/${item.id}`);
                      }}
                    />
                  )}
                  ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={[typography.body, { color: colors.secondaryText, textAlign: "center" }]}>{t("profile.noLists")}</Text>
              )}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.actionButton, marginTop: 16 },
                  { opacity: userListsPages.pages.flatMap((page) => page.data).slice(0, 2).length === 0 ? 0.5 : 1 },
                ]}
                onPress={() => {
                  router.push("/me/lists");
                }}
                disabled={userListsPages.pages.flatMap((page) => page.data).slice(0, 2).length === 0}
              >
                <Text style={[typography.caption, { color: colors.text }]}>
                  {t("profile.seeAllLists")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </AnimatedScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContent: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },
});
