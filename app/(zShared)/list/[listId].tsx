import React, { useRef, useState, useEffect, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { View, Text, StyleSheet, FlatList, Alert, Pressable } from "react-native";
import { Image } from "expo-image";
// import { LegendList, LegendListRef } from "@legendapp/list";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import Animated, { useSharedValue, useAnimatedScrollHandler } from "react-native-reanimated";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import BookListElement from "@/components/BookListElement";
import BookCard from "@/components/BookCard";
import { Book } from "@/types/book";
// import { List } from "@/types/list";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
// import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import SwitchLayoutButton from "@/components/SwitchLayoutButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import ExpandableDescription from "@/components/ExpandableDescription";
import BadgeSlider from "@/components/BadgeSlider";
import { useList, useDeleteList } from "@/hooks/queries/lists";
import { useUserStore } from "@/stores/userStore";
import MaskedView from "@react-native-masked-view/masked-view";
import { Ionicons } from "@expo/vector-icons";
import { Ellipsis } from "lucide-react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import ListActionsBottomSheet from "@/components/ListActionsBottomSheet";
import Avatar from "@/components/ui/Avatar";
import PlusBadge from "@/components/ui/PlusBadge";
import PillButton from "@/components/ui/PillButton";
import { useUIStore } from "@/stores/uiStore";

const AnimatedList = Animated.createAnimatedComponent(FlatList<Book>);

export default function ListFull() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  // const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const [titleY, setTitleY] = useState<number>(0);
  const scrollRef = useRef<FlatList<Book> | null>(null);
  const listActionsBottomSheetRef = useRef<BottomSheetModal>(null);
  const currentLayout = useUIStore(state => state.listLayout);
  const setLayout = useUIStore(state => state.setListLayout);

  const { data: list, refetch } = useList(listId);
  const { mutateAsync: deleteListFromStore } = useDeleteList();
  const { currentUser } = useUserStore();
  const isEditable = (listId: string) => Boolean(list && currentUser && list.owner?.id === currentUser.id);

  // Animation refs for buttons (kept if used elsewhere)

  // Charger la liste initialement et quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      if (listId) {
        refetch();
      }
      return () => {};
    }, [listId, refetch])
  );

  const handleBack = () => {
    router.back();
  };

  const handleDeleteList = () => {
    if (!list) return;

    Alert.alert(
      "Supprimer la liste",
      `Êtes-vous sûr de vouloir supprimer la liste "${list.name}" ? Cette action est irréversible.`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          onPress: async () => {
            if (!list) return;
            try {
              await deleteListFromStore(list.id);
              Toast.show({
                type: "info",
                text1: "Liste supprimée",
              });
              router.back();
            } catch (error) {
              Toast.show({
                type: "info",
                text1: "Une erreur est survenue",
              });
              console.error("Failed to delete list:", error);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // Local button animation handlers removed; handled inside PillButton

  const switchLayout = () => {
    setLayout(currentLayout === "grid" ? "list" : "grid");
  };

  const handlePresentModalPress = useCallback((view: "actions") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    listActionsBottomSheetRef.current?.present();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <AnimatedHeader
        title={list?.name || "Liste"}
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        onBack={handleBack}
      />
      {list && (
        <AnimatedList
          ref={scrollRef}
          data={list.books.items || []}
          key={currentLayout}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 64,
            flexGrow: 1,
          }}
          numColumns={currentLayout === "grid" ? 3 : 1}
          onScroll={scrollHandler}
          ListHeaderComponent={
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
                {list.backdropMode === "image" && list.backdropImage ? (
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
                      source={{ uri: list.backdropImage }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  </MaskedView>
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: list.backdropColor || colors.accent,
                    }}
                  />
                )}
              </View>
              <View
                style={{
                  marginTop: 16,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Pressable onPress={() => router.push(`/profile/${list.owner.username}`)}>
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
                    <Avatar image={list.owner.avatar || ""} size={28} />
                    <Text
                      style={[
                        typography.username,
                        { color: colors.secondaryText },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {list.owner.displayName}
                    </Text>
                    {list.owner.plan === "plus" && (
                      <PlusBadge />
                    )}
                  </View>
                </Pressable>
              </View>
              {isEditable(list.id) && (
                <View style={{ marginTop: 16 }}>
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    <PillButton
                      title="Ordonner"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push({
                          pathname: "/list-order",
                          params: { listId: list.id.toString() },
                        });
                      }}
                      icon={<Ionicons name="swap-vertical" size={16} color={colors.secondaryText} />}
                    />
                    <PillButton
                      title="Modifier"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push({
                          pathname: "/list-edit",
                          params: { listId: list.id.toString() },
                        });
                      }}
                      icon={<Ionicons name="pencil" size={16} color={colors.secondaryText} />}
                    />
                    <PillButton
                      title="Supprimer"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleDeleteList();
                      }}
                      style="destructive"
                      icon={<Ionicons name="trash-outline" size={16} color={colors.error} />}
                    />
                  </View>
                </View>
              )}
              <View
                style={styles.header}
                onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}
              >
                <Text
                  style={[
                    typography.h1,
                    { color: colors.text, maxWidth: "80%" },
                  ]}
                  accessibilityRole="header"
                  accessibilityLabel={list.name}
                  numberOfLines={1}
                >
                  {list.name}
                </Text>
                <View style={styles.actionsContainer}>
                  <Pressable onPress={() => handlePresentModalPress("actions")}>
                    <Ellipsis size={32} color={colors.icon} strokeWidth={2} />
                  </Pressable>
                  <SwitchLayoutButton
                    onPress={switchLayout}
                    currentView={currentLayout}
                  />
                </View>
              </View>
              {list.description && (
                <View style={{ marginBottom: 32 }}>
                  <ExpandableDescription
                    text={list.description}
                    textStyle={{ color: colors.secondaryText }}
                  />
                </View>
              )}
              {list.tags && (
                <View style={styles.badgeContainer}>
                  <BadgeSlider data={list.tags} />
                </View>
              )}
            </View>
          }
          renderItem={({ item }) =>
            currentLayout === "grid" ? (
              <View style={{ width: "33%" }}>
                <BookCard
                  book={item}
                  onPress={() => router.push(`/book/${item.id}`)}
                  size="compact"
                  showAuthor={true}
                  showTrackingStatus={false}
                  showTrackingButton={false}
                  showRating={false}
                  rank={list.ranked && list.books.items ? list.books.items.findIndex(b => b.id === item.id) + 1 : undefined}
                  currentListId={list.id}
                  isFromListPage={true}
                />
              </View>
            ) : (
              <BookListElement
                book={item}
                onPress={() => router.push(`/book/${item.id}`)}
                rank={list.ranked && list.books.items ? list.books.items.findIndex(b => b.id === item.id) + 1 : undefined}
                showAuthor={true}
                showTrackingStatus={false}
                showTrackingButton={false}
                currentListId={list.id}
                isFromListPage={true}
              />
            )
          }
          ItemSeparatorComponent={
            currentLayout === "grid"
              ? () => <View style={{ height: 26 }} />
              : () => <View style={{ height: 12 }} />
          }
          ListEmptyComponent={
            list.books.items.length === 0 ? (
              <Text
                style={
                  [
                    typography.body,
                  {color: colors.secondaryText,
                  textAlign: "center",
                  marginTop: 32,}
                ]}
              >
                Aucun livre trouvé dans cette liste.
              </Text>
            ) : null
          }
          columnWrapperStyle={currentLayout === "grid" ? { gap: 4 } : undefined}
          onEndReached={() => {}}
          onEndReachedThreshold={0.2}
          ListFooterComponent={null}
          showsVerticalScrollIndicator={true}
          accessibilityRole="list"
        />
      )}
      {list && (
        <ListActionsBottomSheet
          ref={listActionsBottomSheetRef}
          list={list}
          index={0}
          backdropDismiss
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
  },
  badgeContainer: {
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  actionButtonText: {
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  plusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    color: "white",
  },
});
