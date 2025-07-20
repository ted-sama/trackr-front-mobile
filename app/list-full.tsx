import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Platform,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Pressable,
  Animated as RNAnimated,
} from "react-native";
import { Image } from "expo-image";
import { LegendList, LegendListRef } from "@legendapp/list";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  withTiming,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import BookListElement from "@/components/BookListElement";
import BookCard from "@/components/BookCard";
import { Book } from "@/types/book";
import { List } from "@/types/list";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import SwitchLayoutButton from "@/components/SwitchLayoutButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import ExpandableDescription from "@/components/ExpandableDescription";
import BadgeSlider from "@/components/BadgeSlider";
import { useListStore } from "@/stores/listStore";
import MaskedView from "@react-native-masked-view/masked-view";
import { Ionicons } from "@expo/vector-icons";

// AsyncStorage key for layout preference
const LAYOUT_STORAGE_KEY = "@MyApp:layoutPreference";
// Default layout preference
const DEFAULT_LAYOUT = "list";

const AnimatedList = Animated.createAnimatedComponent(FlatList<Book>);

export default function ListFull() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const [titleY, setTitleY] = useState<number>(0);
  const scrollRef = useRef<FlatList<Book> | null>(null);
  const [currentLayout, setCurrentLayout] = useState<"grid" | "list">(
    DEFAULT_LAYOUT as "grid" | "list"
  );

  const {
    addTrackedBook: addTrackedBookToStore,
    removeTrackedBook: removeTrackedBookFromStore,
  } = useTrackedBooksStore();

  const list = useListStore(
    (state) =>
      state.listsById[id as string] || state.myListsById[id as string] || null
  );
  const fetchList = useListStore((state) => state.fetchList);
  const isLoading = useListStore((state) => state.isLoading);
  const isEditable = useListStore((state) => state.isOwner);
  const deleteListFromStore = useListStore((state) => state.deleteList);

  // Animation refs for buttons
  const scaleAnimOrder = useRef(new RNAnimated.Value(1)).current;
  const scaleAnimEdit = useRef(new RNAnimated.Value(1)).current;
  const scaleAnimDelete = useRef(new RNAnimated.Value(1)).current;

  // Charger la liste initialement et quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchList(id as string);
      }
    }, [id, fetchList])
  );

  // Load layout preference
  useEffect(() => {
    const loadLayoutPreference = async () => {
      const storedLayout = (await AsyncStorage.getItem(LAYOUT_STORAGE_KEY)) as
        | "grid"
        | "list";
      if (storedLayout) setCurrentLayout(storedLayout);
    };
    loadLayoutPreference();
  }, []);

  // Save layout preference
  useEffect(() => {
    AsyncStorage.setItem(LAYOUT_STORAGE_KEY, currentLayout);
  }, [currentLayout]);

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
                type: "success",
                text1: "Liste supprimée",
                text2: `La liste "${list.name}" a été supprimée avec succès.`,
              });
              router.back();
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Erreur",
                text2: "Impossible de supprimer la liste.",
              });
              console.error("Failed to delete list:", error);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // Animation handlers for buttons
  const handlePressInOrder = () => {
    RNAnimated.spring(scaleAnimOrder, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOutOrder = () => {
    RNAnimated.spring(scaleAnimOrder, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePressInEdit = () => {
    RNAnimated.spring(scaleAnimEdit, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOutEdit = () => {
    RNAnimated.spring(scaleAnimEdit, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePressInDelete = () => {
    RNAnimated.spring(scaleAnimDelete, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOutDelete = () => {
    RNAnimated.spring(scaleAnimDelete, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const switchLayout = () => {
    setCurrentLayout(currentLayout === "grid" ? "list" : "grid");
  };

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
                {list.backdropImage ? (
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
                      backgroundColor: colors.accent,
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
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: colors.accent,
                      borderRadius: 16,
                    }}
                  />
                  <Text
                    style={[
                      typography.username,
                      { color: colors.secondaryText },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {list.owner.username}
                  </Text>
                </View>
              </View>
              {isEditable(list.id) && (
                <View style={{ marginTop: 16 }}>
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    <RNAnimated.View style={{ transform: [{ scale: scaleAnimOrder }] }}>
                      <Pressable
                        style={[
                          styles.actionButton,
                          { backgroundColor: colors.card, borderColor: colors.border }
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: "/list-order",
                            params: {
                              listId: list.id.toString(),
                            },
                          })
                        }
                        onPressIn={handlePressInOrder}
                        onPressOut={handlePressOutOrder}
                      >
                        <Ionicons
                          name="swap-vertical"
                          size={16}
                          color={colors.secondaryText}
                        />
                        <Text
                          style={[
                            styles.actionButtonText,
                            typography.caption,
                            { color: colors.secondaryText },
                          ]}
                        >
                          Ordonner
                        </Text>
                      </Pressable>
                    </RNAnimated.View>
                    
                    <RNAnimated.View style={{ transform: [{ scale: scaleAnimEdit }] }}>
                      <Pressable
                        style={[
                          styles.actionButton,
                          { backgroundColor: colors.card, borderColor: colors.border }
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: "/list-edit",
                            params: {
                              listId: list.id.toString(),
                            },
                          })
                        }
                        onPressIn={handlePressInEdit}
                        onPressOut={handlePressOutEdit}
                      >
                        <Ionicons
                          name="pencil"
                          size={16}
                          color={colors.secondaryText}
                        />
                        <Text
                          style={[
                            styles.actionButtonText,
                            typography.caption,
                            { color: colors.secondaryText },
                          ]}
                        >
                          Modifier
                        </Text>
                      </Pressable>
                    </RNAnimated.View>

                    <RNAnimated.View style={{ transform: [{ scale: scaleAnimDelete }] }}>
                      <Pressable
                        style={[
                          styles.actionButton,
                          { backgroundColor: colors.card, borderColor: colors.error }
                        ]}
                        onPress={handleDeleteList}
                        onPressIn={handlePressInDelete}
                        onPressOut={handlePressOutDelete}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={colors.error}
                        />
                        <Text
                          style={[
                            styles.actionButtonText,
                            typography.caption,
                            { color: colors.error },
                          ]}
                        >
                          Supprimer
                        </Text>
                      </Pressable>
                    </RNAnimated.View>
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
                <SwitchLayoutButton
                  onPress={switchLayout}
                  currentView={currentLayout}
                />
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
                  showTrackingStatus={true}
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
                showTrackingStatus={true}
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
                style={{
                  color: colors.secondaryText,
                  textAlign: "center",
                  marginTop: 32,
                }}
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionButtonText: {
    fontWeight: '500',
  },
});
