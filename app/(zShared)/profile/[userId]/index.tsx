import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/stores/userStore";
import {
  View,
  ScrollView,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import Avatar from "@/components/ui/Avatar";
import PlusBadge from "@/components/ui/PlusBadge";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import BookCard from "@/components/BookCard";
import { useUser, useUserLists, useUserTop } from "@/hooks/queries/users";
import CollectionListElement from "@/components/CollectionListElement";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import PillButton from "@/components/ui/PillButton";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { data: user, refetch: refetchUser } = useUser(userId);
  const { data: topBooks } = useUserTop(userId);
  const { data: userLists } = useUserLists(userId);
  const { currentUser } = useUserStore();
  const isMe = user?.id === currentUser?.id;
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const scrollY = useSharedValue(0);
  const { t } = useTranslation();
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const [titleY, setTitleY] = useState<number>(0);

  const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      refetchUser();
    }, [userId, refetchUser])
  );

  // Animated style for elastic backdrop effect
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    const BACKDROP_HEIGHT = 275;
    const scale = interpolate(
      scrollY.value,
      [-BACKDROP_HEIGHT, 0],
      [2, 1],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
      scrollY.value,
      [-BACKDROP_HEIGHT, 0],
      [-BACKDROP_HEIGHT / 2, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
    };
  });

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <AnimatedHeader
        title={user?.username || t("profile.title")}
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        onBack={() => router.back()}
      />
      <AnimatedScrollView onScroll={scrollHandler} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: 64 }}>
        <View>
          <Animated.View
            style={[{
              position: "relative",
              width: "110%",
              height: 275,
              alignSelf: "center",
              marginHorizontal: -16,
              zIndex: -99,
            }, backdropAnimatedStyle]}
          >
            {user?.backdropMode === "image" &&
            user?.backdropImage ? (
              <MaskedView
                style={{ flex: 1 }}
                maskElement={
                  <LinearGradient
                    colors={["rgba(0,0,0,1)", "rgba(0,0,0,0)"]}
                    style={{ flex: 1 }}
                  />
                }
              >
                <Image
                  source={{ uri: user?.backdropImage }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </MaskedView>
            ) : (
              <View
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: user?.backdropColor || colors.accent,
                }}
              />
            )}
          </Animated.View>
          <View
            style={{
              alignItems: "center",
              alignSelf: "center",
              paddingHorizontal: 16,
              marginTop: -40,
            }}
          >
            <Avatar
              image={user?.avatar || ""}
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
                {user?.displayName}
              </Text>
              {user?.plan === "plus" && <PlusBadge />}
            </View>
          </View>
        </View>
        {isMe && (
        <View style={{ flexDirection: "row", gap: 16, paddingHorizontal: 16, marginTop: 24, justifyContent: "center", alignItems: "center" }}>
          <PillButton
            icon={<Ionicons name="pencil" size={16} color={colors.secondaryText} />}
            title={t("profile.edit")}
            onPress={() => {
              router.push(`/profile/${userId}/edit`);
              }}
            />
            <PillButton
              icon={<Ionicons name="swap-vertical" size={16} color={colors.secondaryText} />}
              title={t("profile.reorder")}
              onPress={() => {
                router.push(`/profile/${userId}/reorder`);
              }}
            />
          </View>
        )}
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
            </View>
          )}
          {userLists && (
            <View>
              <Text
                style={[
                  typography.categoryTitle,
                  { color: colors.text, marginBottom: 12 },
                ]}
              >
                {t("profile.lists")}
              </Text>
              <FlatList
                data={userLists.pages.flatMap(page => page.data).slice(0, 2)}
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
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.actionButton, marginTop: 16 },
                ]}
                onPress={() => {
                  router.push(`/profile/${userId}/lists`);
                }}
              >
                <Text style={[typography.caption, { color: colors.text }]}>
                  {t("profile.seeAllLists")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
