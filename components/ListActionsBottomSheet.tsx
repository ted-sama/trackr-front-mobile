/* eslint-disable react/display-name */
import React, { forwardRef, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Share, Alert } from "react-native";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { List } from "@/types/list";
import { ShareIcon, Flag } from "lucide-react-native";
import { useList } from "@/hooks/queries/lists";
import { useUserStore } from "@/stores/userStore";
import { useTranslation } from "react-i18next";

export interface ListActionsBottomSheetProps {
  list: List;
  onDismiss?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ActionButtonProps {
  action: {
    label: string;
    icon: React.ReactNode;
    onPress?: () => void;
  };
  typography: any;
  colors: any;
}

const ActionButton = ({ action, typography, colors }: ActionButtonProps) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(128, 128, 128, ${pressed.value * 0.15})`,
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 100 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 200 });
      }}
      onPress={action.onPress}
      style={[styles.actionButton, animatedStyle]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {action.icon}
        <Text style={[typography.h3, { color: colors.text }]}>
          {action.label}
        </Text>
      </View>
    </AnimatedPressable>
  );
};

const ListActionsBottomSheet = forwardRef<TrueSheet, ListActionsBottomSheetProps>(
  ({ list: listProp, onDismiss }, ref) => {
    const { colors } = useTheme();
    const typography = useTypography();
    const { t } = useTranslation();
    const currentUser = useUserStore((state) => state.currentUser);

    // Use the live data from React Query cache instead of the prop
    const { data: liveList } = useList(listProp.id);
    const list = liveList ?? listProp;

    const isOwnList = currentUser?.id === list.owner?.id;

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
        const sheetRef = typeof ref === "object" ? ref?.current : null;
        sheetRef?.dismiss();
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
              const sheetRef = typeof ref === "object" ? ref?.current : null;
              sheetRef?.dismiss();
            },
          },
        ]
      );
    };

    const separator = () => (
      <Text style={{ fontWeight: "900", marginHorizontal: 4, color: colors.secondaryText }}>·</Text>
    );

    const actions = [
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
      <TrueSheet
        ref={ref}
        detents={["auto"]}
        cornerRadius={30}
        backgroundColor={colors.background}
        grabber={false}
        onDidDismiss={handleDismiss}
      >
        <View style={styles.bottomSheetContent}>
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
                <ActionButton
                  key={idx}
                  action={action}
                  typography={typography}
                  colors={colors}
                />
              ))}
            </View>
          </View>
        </View>
      </TrueSheet>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheetContent: {
    padding: 24,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  bottomSheetActions: {
    flexDirection: "column",
    gap: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
});

export default ListActionsBottomSheet;
