import React, { useEffect } from "react";
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

export default function Index() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useUserStore();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const { getTrackedBooks } = useTrackedBooksStore();
  const { data: mostTracked } = useMostTrackedCategory();
  const { data: topRated } = useTopRatedCategory();
  const lastRead = getTrackedBooks().filter(book => book.trackingStatus?.currentChapter && book.trackingStatus?.lastReadAt !== null).sort((a, b) => {
    if (a.trackingStatus?.lastReadAt && b.trackingStatus?.lastReadAt) {
      return new Date(b.trackingStatus.lastReadAt).getTime() - new Date(a.trackingStatus.lastReadAt).getTime();
    }
    return 0;
  }).slice(0, 3);

  useEffect(() => {
    // Data fetched via React Query hooks
  }, []);

  return (
    <SafeAreaView
      edges={["right", "left"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <View style={[styles.header, { paddingTop: 24 + insets.top, paddingHorizontal: 16 }]}>
        <Pressable onPress={() => router.push("/profile")}>
          <Avatar image={currentUser?.avatar || ""} size={32} />
        </Pressable>
        <Text
          style={[typography.h1, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Bonjour, {currentUser?.displayName}
        </Text>
      </View>
      <ScrollView
        style={{ flex: 1 }}
      >
      <View style={styles.content}>
        <View style={styles.lastReadContainer}>
          <Text style={[typography.categoryTitle, { color: colors.text, marginBottom: 16 }]}>Dernières lectures</Text>
          {lastRead.length > 0 ? (
            <FlatList
              data={lastRead}
              renderItem={({ item }) => <BookListElement book={item} compact showTrackingStatus onPress={() => {router.push(`/book/${item.id}`)}} />}
              ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
              scrollEnabled={false}
            />
          ) : (
            <Text style={[typography.body, { color: colors.secondaryText, textAlign: "center" }]}>Commencez à lire pour voir vos dernières lectures</Text>
          )}
        </View>
        <View style={{ marginHorizontal: -16 }}>
          {mostTracked && (
            <CategorySlider category={mostTracked} seeMore={false} ranked />
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
  header: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    paddingBottom: 16,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
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
