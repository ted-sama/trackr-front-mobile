import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { router } from "expo-router";
import { useUserStore } from "@/stores/userStore";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import BookListElement from "@/components/BookListElement";

export default function Index() {
  const { currentUser } = useUserStore();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const { getTrackedBooks } = useTrackedBooksStore();

  const lastRead = getTrackedBooks().filter(book => book.trackingStatus?.currentChapter && book.trackingStatus?.lastReadAt !== null).sort((a, b) => {
    if (a.trackingStatus?.lastReadAt && b.trackingStatus?.lastReadAt) {
      return new Date(b.trackingStatus.lastReadAt).getTime() - new Date(a.trackingStatus.lastReadAt).getTime();
    }
    return 0;
  }).slice(0, 3);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <View style={styles.content}>
        <Text
          style={[styles.welcomeText, typography.h1, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Bonjour, {currentUser?.username}
        </Text>
        <View style={styles.lastReadContainer}>
          <Text style={[typography.categoryTitle, { color: colors.text, marginBottom: 16 }]}>Dernières lectures</Text>
          <FlatList
            data={lastRead}
            renderItem={({ item }) => <BookListElement book={item} compact showTrackingStatus onPress={() => {router.push({ pathname: '/book/[id]', params: { id: item.id.toString(), sharedBoundId: `bookCover-${item.id}` } })}} />}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            scrollEnabled={false}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  welcomeText: {
    marginBottom: 30,
  },
  lastReadContainer: {
    flexDirection: "column",
  }
});
