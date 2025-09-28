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
import { router , useLocalSearchParams } from "expo-router";
import BookCard from "@/components/BookCard";
import { useUser, useUserLists, useUserTop } from "@/hooks/queries/users";
import CollectionListElement from "@/components/CollectionListElement";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import { useState } from "react";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import PillButton from "@/components/ui/PillButton";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { data: user } = useUser(userId);
  const { data: topBooks } = useUserTop(userId);
  const { data: userLists } = useUserLists(userId);
  const { currentUser } = useUserStore();
  const isMe = user?.id === currentUser?.id;
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const [titleY, setTitleY] = useState<number>(0);

  const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <AnimatedHeader
        title={user?.username || "Profil"}
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        onBack={() => router.back()}
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
            title="Modifier le profil"
            onPress={() => {
              router.push(`/profile/${userId}/edit`);
              }}
            />
            <PillButton
              icon={<Ionicons name="swap-vertical" size={16} color={colors.secondaryText} />}
              title="Réordonner les favoris"
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
                Favoris
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
                Listes
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
                  Voir toutes les listes
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
