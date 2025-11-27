/* eslint-disable react/display-name */
import React, { forwardRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import Animated, {
  withTiming,
  withSpring,
  EntryAnimationsValues,
  ExitAnimationsValues,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { List } from "@/types/list";
import { ShareIcon, Flag, Heart, Bookmark } from "lucide-react-native";
import { useLikeList, useUnlikeList, useSaveList, useUnsaveList, useList } from "@/hooks/queries/lists";
import { useUserStore } from "@/stores/userStore";
import { useTranslation } from "react-i18next";
import { toast } from "sonner-native";

export interface ListActionsBottomSheetProps {
  list: List;
  snapPoints?: string[];
  index?: number;
  onDismiss?: () => void;
  backdropDismiss?: boolean;
}

// Custom morphing animations (same style as BookActionsBottomSheet)
function morphIn(values: EntryAnimationsValues) {
  "worklet";
  const initialValues = {
    opacity: 0,
    transform: [{ scale: 0.8 }],
    borderRadius: values.targetBorderRadius ?? 25,
  };
  const animations = {
    opacity: withTiming(1, { duration: 300 }),
    transform: [{ scale: withSpring(1, { damping: 500, stiffness: 900 }) }],
    borderRadius: withTiming(0, { duration: 300 }),
  };
  return { initialValues, animations };
}
function morphOut(values: ExitAnimationsValues) {
  "worklet";
  const initialValues = {
    opacity: 1,
    transform: [{ scale: 1 }],
    borderRadius: values.currentBorderRadius,
  };
  const animations = {
    opacity: withTiming(0, { duration: 200 }),
    transform: [{ scale: withSpring(0.8, { damping: 12, stiffness: 100 }) }],
    borderRadius: withTiming(values.currentBorderRadius, { duration: 200 }),
  };
  return { initialValues, animations };
}

const ListActionsBottomSheet = forwardRef<BottomSheetModal, ListActionsBottomSheetProps>(
  ({ list: listProp, snapPoints, index, onDismiss, backdropDismiss }, ref) => {
    const { colors } = useTheme();
    const typography = useTypography();
    const { t } = useTranslation();
    const currentUser = useUserStore((state) => state.currentUser);

    // Use the live data from React Query cache instead of the prop
    const { data: liveList, refetch } = useList(listProp.id);
    const list = liveList ?? listProp;

    const isOwnList = currentUser?.id === list.owner?.id;

    const { mutateAsync: like } = useLikeList();
    const { mutateAsync: unlike } = useUnlikeList();
    const { mutateAsync: save } = useSaveList();
    const { mutateAsync: unsave } = useUnsaveList();

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior={backdropDismiss ? "close" : "none"}
        />
      ),
      [backdropDismiss]
    );

    const handleDismiss = () => {
      if (onDismiss) onDismiss();
    };

    const handleShare = async () => {
      try {
        const owner = list.owner?.username || "";
        const message = `Découvre la liste "${list.name}" (${list.books?.total ?? 0} éléments) par ${owner}`;
        await Share.share({ message });
    } catch {
        // no-op
      } finally {
        // @ts-expect-error bottom sheet ref
        ref?.current?.dismiss();
      }
    };

    const handleReport = async () => {
      Alert.alert(
        "Signaler la liste",
        `Voulez-vous signaler la liste "${list.name}" ?`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Signaler",
            style: "destructive",
            onPress: () => {
              Alert.alert("Merci", "Votre signalement a été envoyé.");
              // @ts-expect-error bottom sheet ref
              ref?.current?.dismiss();
            },
          },
        ]
      );
    };

    const handleLike = async () => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (list.isLikedByMe) {
          await unlike(list.id);
          toast.success(t("toast.listUnliked"));
        } else {
          await like(list.id);
          toast.success(t("toast.listLiked"));
        }
        // Force refetch to ensure UI updates
        await refetch();
      } catch (error) {
        console.error("Error liking/unliking list:", error);
        toast.error(list.isLikedByMe ? t("toast.errorLikingList") : t("toast.errorUnlikingList"));
      }
    };

    const handleSave = async () => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (list.isSavedByMe) {
          await unsave(list.id);
          toast.success(t("toast.listUnsaved"));
        } else {
          await save(list.id);
          toast.success(t("toast.listSaved"));
        }
        // Force refetch to ensure UI updates
        await refetch();
      } catch (error) {
        console.error("Error saving/unsaving list:", error);
        toast.error(list.isSavedByMe ? t("toast.errorSavingListToCollection") : t("toast.errorUnsavingList"));
      }
    };

    const separator = () => (
      <Text style={{ fontWeight: "900", marginHorizontal: 4, color: colors.secondaryText }}>·</Text>
    );

    const actions = [
      // Like/Unlike action - only for public lists that are not owned by current user
      ...(list.isPublic && !isOwnList
        ? [
            {
              label: list.isLikedByMe ? t("list.unlike") : t("list.like"),
              icon: (
                <Heart
                  size={16}
                  strokeWidth={2.75}
                  color={list.isLikedByMe ? colors.primary : colors.text}
                  fill={list.isLikedByMe ? colors.primary : "transparent"}
                />
              ),
              onPress: handleLike,
            },
          ]
        : []),
      // Save/Unsave action - only for public lists that are not owned by current user
      ...(list.isPublic && !isOwnList
        ? [
            {
              label: list.isSavedByMe ? t("list.unsave") : t("list.save"),
              icon: (
                <Bookmark
                  size={16}
                  strokeWidth={2.75}
                  color={list.isSavedByMe ? colors.primary : colors.text}
                  fill={list.isSavedByMe ? colors.primary : "transparent"}
                />
              ),
              onPress: handleSave,
            },
          ]
        : []),
      // Share action - always available
      {
        label: "Partager",
        icon: <ShareIcon size={16} strokeWidth={2.75} color={colors.text} />,
        onPress: handleShare,
      },
      // Report action - only for lists not owned by current user
      ...(!isOwnList
        ? [
            {
              label: "Signaler",
              icon: <Flag size={16} strokeWidth={2.75} color={colors.text} />,
              onPress: handleReport,
            },
          ]
        : []),
    ];

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        index={index}
        onDismiss={handleDismiss}
        backgroundStyle={{
          backgroundColor: colors.background,
          borderCurve: "continuous",
          borderRadius: 30,
        }}
        handleComponent={null}
        backdropComponent={renderBackdrop}
        keyboardBlurBehavior="restore"
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Animated.View entering={morphIn} exiting={morphOut}>
            <View>
              <View style={styles.bottomSheetHeader}>
                <View style={{ flexShrink: 1 }}>
                  <Text style={[typography.h3, { color: colors.text }]} numberOfLines={2}>
                    {list.name}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={[typography.caption, { color: colors.secondaryText }]}>
                      Par {list.owner.username}
                    </Text>
                    {separator()}
                    <Text style={[typography.caption, { color: colors.secondaryText }]}>
                      {list.books.total} {list.books.total > 1 ? "éléments" : "élément"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.bottomSheetActions}>
                {actions.map((action, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.actionButton, { backgroundColor: colors.actionButton }]}
                    onPress={action.onPress}
                  >
                    {action.icon}
                    <Text style={[typography.caption, { color: colors.text }]}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheetContent: {
    padding: 24,
    paddingBottom: 64,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  bottomSheetActions: {
    flexDirection: "column",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },
});

export default ListActionsBottomSheet;
