import React, { useRef, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { View, Text, StyleSheet, FlatList, Alert, Pressable } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, Extrapolate, withTiming } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import BookListElement from "@/components/BookListElement";
import BookCard from "@/components/BookCard";
import { Book } from "@/types/book";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import SwitchLayoutButton from "@/components/SwitchLayoutButton";
import { LinearGradient } from "expo-linear-gradient";
import { toast } from "sonner-native";
import ExpandableDescription from "@/components/ExpandableDescription";
import BadgeSlider from "@/components/BadgeSlider";
import { useList, useDeleteList, useLikeList, useUnlikeList, useSaveList, useUnsaveList } from "@/hooks/queries/lists";
import { Heart, Bookmark } from "lucide-react-native";
import { useUserStore } from "@/stores/userStore";
import { Ionicons } from "@expo/vector-icons";
import { Ellipsis } from "lucide-react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import ListActionsBottomSheet from "@/components/ListActionsBottomSheet";
import Avatar from "@/components/ui/Avatar";
import PlusBadge from "@/components/ui/PlusBadge";
import PillButton from "@/components/ui/PillButton";
import { useUIStore } from "@/stores/uiStore";
import SkeletonLoader from "@/components/skeleton-loader/SkeletonLoader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getPalette } from "@somesoap/react-native-image-palette";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Book>);

interface ListHeaderProps {
  list: any;
  insets: { top: number; bottom: number; left: number; right: number };
  dominantColor: string | null;
  gradientHeight: number;
  gradientAnimatedStyle: any;
  gradientElasticStyle: any;
  onTitleLayout: (event: any) => void;
  onOwnerPress: () => void;
  isEditable: boolean;
  isOwnList: boolean;
  onReorderPress: () => void;
  onEditPress: () => void;
  onDeletePress: () => void;
  onActionsPress: () => void;
  onSwitchLayout: () => void;
  onLikePress: () => void;
  onSavePress: () => void;
  currentLayout: "grid" | "list";
  colors: any;
  typography: any;
  t: any;
}

const ListHeader = React.memo(({
  list,
  insets,
  dominantColor,
  gradientHeight,
  gradientAnimatedStyle,
  gradientElasticStyle,
  onTitleLayout,
  onOwnerPress,
  isEditable,
  isOwnList,
  onReorderPress,
  onEditPress,
  onDeletePress,
  onActionsPress,
  onSwitchLayout,
  onLikePress,
  onSavePress,
  currentLayout,
  colors,
  typography,
  t,
}: ListHeaderProps) => {
  const likeScale = useSharedValue(1);
  const saveScale = useSharedValue(1);

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const saveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));

  const handleLikePressIn = () => {
    likeScale.value = withTiming(0.95, { duration: 100 });
  };

  const handleLikePressOut = () => {
    likeScale.value = withTiming(1, { duration: 100 });
  };

  const handleSavePressIn = () => {
    saveScale.value = withTiming(0.95, { duration: 100 });
  };

  const handleSavePressOut = () => {
    saveScale.value = withTiming(1, { duration: 100 });
  };

  return (
    <View>
      {/* Gradient */}
      {dominantColor && (
        <Animated.View
          style={[{
            position: "absolute",
            width: "110%",
            height: gradientHeight,
            alignSelf: "center",
            marginHorizontal: -16,
            marginTop: -insets.top,
            zIndex: 0,
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
      {/* Backdrop */}
      <View
        style={{
          marginTop: -insets.top,
          height: 275 + insets.top,
          paddingTop: insets.top + 70,
          zIndex: 1,
        }}
      >
        <View
          style={{
            flex: 1,
            borderRadius: 24,
            borderWidth: 2,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          {list.backdropMode === "image" && list.backdropImage ? (
            <Image
              source={{ uri: list.backdropImage }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
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
      </View>
      <View
        style={{
          marginTop: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable onPress={onOwnerPress}>
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
        {/* Like and Save counters - right aligned */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {list.isPublic && !isOwnList ? (
            <>
              <Animated.View style={likeAnimatedStyle}>
                <Pressable
                  onPress={onLikePress}
                  onPressIn={handleLikePressIn}
                  onPressOut={handleLikePressOut}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Heart
                    size={14}
                    strokeWidth={2}
                    color={list.isLikedByMe ? colors.accent : colors.icon}
                    fill={list.isLikedByMe ? colors.accent : "transparent"}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: list.isLikedByMe ? colors.accent : colors.secondaryText,
                      fontWeight: "600",
                    }}
                  >
                    {list.likesCount || 0}
                  </Text>
                </Pressable>
              </Animated.View>
              <Animated.View style={saveAnimatedStyle}>
                <Pressable
                  onPress={onSavePress}
                  onPressIn={handleSavePressIn}
                  onPressOut={handleSavePressOut}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Bookmark
                    size={14}
                    strokeWidth={2}
                    color={list.isSavedByMe ? colors.accent : colors.icon}
                    fill={list.isSavedByMe ? colors.accent : "transparent"}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: list.isSavedByMe ? colors.accent : colors.secondaryText,
                      fontWeight: "600",
                    }}
                  >
                    {list.savesCount || 0}
                  </Text>
                </Pressable>
              </Animated.View>
            </>
          ) : isEditable ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Heart
                  size={14}
                  strokeWidth={2}
                  color={colors.icon}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.secondaryText,
                    fontWeight: "600",
                  }}
                >
                  {list.likesCount || 0}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Bookmark
                  size={14}
                  strokeWidth={2}
                  color={colors.icon}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.secondaryText,
                    fontWeight: "600",
                  }}
                >
                  {list.savesCount || 0}
                </Text>
              </View>
            </>
          ) : null}
        </View>
      </View>
      {isEditable && (
        <View style={{ marginTop: 16 }}>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <PillButton
              title={t("list.reorder")}
              onPress={onReorderPress}
              icon={<Ionicons name="swap-vertical" size={16} color={colors.secondaryText} />}
            />
            <PillButton
              title={t("list.edit")}
              onPress={onEditPress}
              icon={<Ionicons name="pencil" size={16} color={colors.secondaryText} />}
            />
            <PillButton
              title={t("list.delete")}
              onPress={onDeletePress}
              style="destructive"
              icon={<Ionicons name="trash-outline" size={16} color={colors.error} />}
            />
          </View>
        </View>
      )}
      <View
        style={styles.header}
        onLayout={onTitleLayout}
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
          <Pressable onPress={onActionsPress}>
            <Ellipsis size={32} color={colors.icon} strokeWidth={2} />
          </Pressable>
          <SwitchLayoutButton
            onPress={onSwitchLayout}
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
  );
});

ListHeader.displayName = 'ListHeader';

export default function ListFullScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const [titleY, setTitleY] = useState<number>(0);
  const listActionsBottomSheetRef = useRef<BottomSheetModal>(null);
  const currentLayout = useUIStore(state => state.listLayout);
  const setLayout = useUIStore(state => state.setListLayout);
  const insets = useSafeAreaInsets();

  const { data: list, refetch, isLoading } = useList(listId);
  const { mutateAsync: deleteListFromStore } = useDeleteList();
  const { mutateAsync: likeList } = useLikeList();
  const { mutateAsync: unlikeList } = useUnlikeList();
  const { mutateAsync: saveList } = useSaveList();
  const { mutateAsync: unsaveList } = useUnsaveList();
  const { currentUser } = useUserStore();
  const isEditable = (listId: string) => Boolean(list && currentUser && list.owner?.id === currentUser.id);
  const isOwnList = Boolean(list && currentUser && list.owner?.id === currentUser.id);

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

  // Extract dominant color from backdrop image (only for image mode)
  useEffect(() => {
    if (list?.backdropMode === "image" && list?.backdropImage) {
      getPalette(list.backdropImage).then(palette => {
        setDominantColor(palette.vibrant);
      });
    } else {
      setDominantColor(null);
    }
  }, [list?.backdropImage, list?.backdropMode]);

  // Animate gradient opacity when dominant color is available
  useEffect(() => {
    if (dominantColor) {
      gradientOpacity.value = withTiming(0.45, { duration: 100 });
    } else {
      gradientOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [dominantColor]);

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
              toast(t("toast.listDeleted"));
              router.back();
            } catch (error) {
              toast.error(t("toast.errorDeletingList"));
              console.error("Failed to delete list:", error);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // Local button animation handlers removed; handled inside PillButton

  // Like handler - directly on page
  const handleLike = async () => {
    if (!list) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (list.isLikedByMe) {
        await unlikeList(list.id);
        toast.success(t("toast.listUnliked"));
      } else {
        await likeList(list.id);
        toast.success(t("toast.listLiked"));
      }
      // Force refetch to update UI
      await refetch();
    } catch (error) {
      console.error("Error liking/unliking list:", error);
      toast.error(t("toast.errorLikingList"));
    }
  };

  // Save handler - directly on page
  const handleSave = async () => {
    if (!list) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (list.isSavedByMe) {
        await unsaveList(list.id);
        toast.success(t("toast.listUnsaved"));
      } else {
        await saveList(list.id);
        toast.success(t("toast.listSaved"));
      }
      // Force refetch to update UI
      await refetch();
    } catch (error) {
      console.error("Error saving/unsaving list:", error);
      toast.error(t("toast.errorSavingList"));
    }
  };

  const switchLayout = () => {
    setLayout(currentLayout === "grid" ? "list" : "grid");
  };

  const handlePresentModalPress = useCallback((view: "actions") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    listActionsBottomSheetRef.current?.present();
  }, []);


  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {/* Backdrop skeleton */}
          <View style={{ width: "110%", height: 275, marginHorizontal: -16, marginBottom: 16 }}>
            <SkeletonLoader width="100%" height="100%" />
          </View>

          {/* Owner info skeleton */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 }}>
            <SkeletonLoader width={28} height={28} style={{ borderRadius: 14 }} />
            <SkeletonLoader width={120} height={14} />
          </View>

          {/* Title and actions skeleton */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 32, marginBottom: 16 }}>
            <SkeletonLoader width="60%" height={32} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <SkeletonLoader width={32} height={32} style={{ borderRadius: 16 }} />
              <SkeletonLoader width={32} height={32} style={{ borderRadius: 16 }} />
            </View>
          </View>

          {/* Description skeleton */}
          <View style={{ marginBottom: 32 }}>
            <SkeletonLoader width="100%" height={14} style={{ marginBottom: 6 }} />
            <SkeletonLoader width="100%" height={14} style={{ marginBottom: 6 }} />
            <SkeletonLoader width="70%" height={14} />
          </View>

          {/* Tags skeleton */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 32 }}>
            <SkeletonLoader width={80} height={28} style={{ borderRadius: 14 }} />
            <SkeletonLoader width={100} height={28} style={{ borderRadius: 14 }} />
            <SkeletonLoader width={90} height={28} style={{ borderRadius: 14 }} />
          </View>

          {/* Book items skeleton */}
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <SkeletonLoader width={60} height={90} style={{ borderRadius: 4 }} />
              <View style={{ flex: 1, justifyContent: "space-between" }}>
                <View>
                  <SkeletonLoader width="80%" height={18} style={{ marginBottom: 6 }} />
                  <SkeletonLoader width="60%" height={14} style={{ marginBottom: 4 }} />
                  <SkeletonLoader width="40%" height={14} />
                </View>
              </View>
            </View>
          ))}
        </View>

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
          <SkeletonLoader width={38} height={38} style={{ borderRadius: 19 }} />
          <SkeletonLoader width={120} height={20} style={{ borderRadius: 4 }} />
          <View style={{ width: 38 }} />
        </View>
      </View>
    );
  }

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
        <AnimatedFlatList
          data={list.books.items || []}
          keyExtractor={(item) => item.id.toString()}
          key={currentLayout}
          numColumns={currentLayout === "grid" ? 3 : 1}
          style={{ paddingTop: insets.top }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 64,
            flexGrow: 1,
          }}
          columnWrapperStyle={currentLayout === "grid" ? { gap: 4 } : undefined}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
          ListHeaderComponent={
            <ListHeader
              list={list}
              insets={insets}
              dominantColor={dominantColor}
              gradientHeight={gradientHeight}
              gradientAnimatedStyle={gradientAnimatedStyle}
              gradientElasticStyle={gradientElasticStyle}
              onTitleLayout={(e) => setTitleY(e.nativeEvent.layout.y)}
              onOwnerPress={() => router.push(`/profile/${list.owner.username}`)}
              isEditable={isEditable(list.id)}
              isOwnList={isOwnList}
              onReorderPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/list/${listId}/reorder`);
              }}
              onEditPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/list/${listId}/edit`);
              }}
              onDeletePress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleDeleteList();
              }}
              onActionsPress={() => handlePresentModalPress("actions")}
              onSwitchLayout={switchLayout}
              onLikePress={handleLike}
              onSavePress={handleSave}
              currentLayout={currentLayout}
              colors={colors}
              typography={typography}
              t={t}
            />
          }
          stickyHeaderIndices={[]}
          ListHeaderComponentStyle={{ marginBottom: 0 }}
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
            (list.books.items || []).length === 0 ? (
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.secondaryText,
                    textAlign: "center",
                    marginTop: 32,
                  }
                ]}
              >
                Aucun livre trouvé dans cette liste.
              </Text>
            ) : null
          }
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
