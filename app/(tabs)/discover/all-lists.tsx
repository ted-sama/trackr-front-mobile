import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import CollectionListElement from "@/components/CollectionListElement";
import { List } from "@/types/list";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLists } from "@/hooks/queries/lists";
import { ActivityIndicator, FlatList } from "react-native";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<List>);

interface AllListsHeaderProps {
  insets: { top: number; bottom: number; left: number; right: number };
  onTitleLayout: (event: any) => void;
  listsCount: number;
  colors: any;
  typography: any;
  t: any;
}

const AllListsHeader = React.memo(
  ({
    insets,
    onTitleLayout,
    listsCount,
    colors,
    typography,
    t,
  }: AllListsHeaderProps) => {
    return (
      <View
        style={{
          marginTop: -insets.top,
          paddingTop: insets.top + 80,
        }}
      >
        {/* Title */}
        <View style={styles.header} onLayout={onTitleLayout}>
          <View style={styles.titleContainer}>
            <Text
              style={[typography.h1, { color: colors.text, maxWidth: "80%" }]}
              accessibilityRole="header"
              accessibilityLabel="All Lists"
              numberOfLines={1}
            >
              {t("collection.allLists.title")}
            </Text>
            <Text style={[typography.caption, { color: colors.secondaryText }]}>
              {listsCount} {t("common.list")}
              {listsCount > 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </View>
    );
  }
);

AllListsHeader.displayName = "AllListsHeader";

export default function AllLists() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const [titleY, setTitleY] = useState<number>(0);

  // Fetch all public lists
  const { data: lists, isLoading, error } = useLists();

  const handleBack = () => {
    router.back();
  };

  // Filter only public lists
  const publicLists = React.useMemo(() => {
    if (!lists) return [];
    return lists.filter((list) => list.isPublic);
  }, [lists]);

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <Text
        style={[typography.h3, { color: colors.error, textAlign: "center" }]}
      >
        {t("common.error")}
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.secondaryText, textAlign: "center", marginTop: 8 },
        ]}
      >
        {t("collection.allLists.errorLoading")}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text
        style={[
          typography.body,
          {
            color: colors.secondaryText,
            textAlign: "center",
            marginTop: 32,
          },
        ]}
      >
        {t("collection.allLists.noLists")}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <AnimatedHeader
          title={t("collection.allLists.title")}
          scrollY={scrollY}
          collapseThreshold={titleY > 0 ? titleY : undefined}
          onBack={handleBack}
        />
        {renderLoading()}
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <AnimatedHeader
          title={t("collection.allLists.title")}
          scrollY={scrollY}
          collapseThreshold={titleY > 0 ? titleY : undefined}
          onBack={handleBack}
        />
        {renderError()}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <AnimatedHeader
        title={t("collection.allLists.title")}
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        onBack={handleBack}
      />
      <AnimatedFlatList
        data={publicLists}
        keyExtractor={(item) => String(item.id)}
        style={{ paddingTop: insets.top }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 64,
          flexGrow: 1,
        }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        ListHeaderComponent={
          <AllListsHeader
            insets={insets}
            onTitleLayout={(e) => setTitleY(e.nativeEvent.layout.y)}
            listsCount={publicLists.length}
            colors={colors}
            typography={typography}
            t={t}
          />
        }
        stickyHeaderIndices={[]}
        ListHeaderComponentStyle={{ marginBottom: 0 }}
        renderItem={({ item }) => (
          <CollectionListElement
            list={item}
            onPress={() => {
              router.push(`/list/${item.id}`);
            }}
            size="default"
            showDescription={true}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListEmptyComponent={renderEmptyState()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  titleContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: 100,
  },
});

