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
import MaskedView from "@react-native-masked-view/masked-view";
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
import { useState } from "react";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import PillButton from "@/components/ui/PillButton";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Settings } from "lucide-react-native";
import { useTranslation } from "react-i18next";

export default function Profile() {
  const { currentUser } = useUserStore();
  const { data: topBooks } = useUserTop();
  const { data: userListsPages } = useUserLists();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const [titleY, setTitleY] = useState<number>(0);
  const { t } = useTranslation();
  const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

  // no-op
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <AnimatedHeader
        title={currentUser?.username || t("profile.title")}
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        rightButton={
          <Pressable onPress={() => {
            router.push(`/settings`);
          }}>
            <Settings size={22} color={colors.icon} />
          </Pressable>
        }
      />
      <AnimatedScrollView onScroll={scrollHandler} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: 64 }}>
        <View>
          <View
            style={{
              position: "relative",
              width: "110%",
              height: 275,
              alignSelf: "center",
              marginHorizontal: -16,
              zIndex: -99,
            }}
          >
            {currentUser?.backdropMode === "image" &&
            currentUser?.backdropImage ? (
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
                  source={{ uri: currentUser?.backdropImage }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </MaskedView>
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
          <View
            style={{
              alignItems: "center",
              alignSelf: "center",
              paddingHorizontal: 16,
              marginTop: -40,
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
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 16, paddingHorizontal: 16, marginTop: 24, justifyContent: "center", alignItems: "center" }}>
          <PillButton
            icon={<Ionicons name="pencil" size={16} color={colors.secondaryText} />}
            title={t("profile.edit")}
            onPress={() => {
              router.push(`/me/edit`);
            }}
          />
          <PillButton
            icon={<Ionicons name="swap-vertical" size={16} color={colors.secondaryText} />}
            title={t("profile.reorder")}
            disabled={topBooks?.length === 0}
            onPress={() => {
              router.push(`/me/reorder`);
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
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.actionButton, marginTop: 16 },
                ]}
                onPress={() => {
                  router.push("/me/lists");
                }}
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
