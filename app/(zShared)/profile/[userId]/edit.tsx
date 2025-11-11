import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";
import { Camera, Check, Lock, Palette } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useUserStore } from "@/stores/userStore";
import { TextField } from "@/components/ui/TextField";
import Avatar from "@/components/ui/Avatar";
import {
  useUpdateMe,
  useUpdateUserAvatarImage,
  useUpdateUserBackdropImage,
  useDeleteUserAvatar,
} from "@/hooks/queries/users";
import { Image } from "expo-image";
import PlusBadge from "@/components/ui/PlusBadge";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

export default function ProfileEditModal() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const currentUser = useUserStore((s) => s.currentUser);
  const isPlus = currentUser?.plan === "plus";
  const refreshCurrentUser = useUserStore((s) => s.fetchCurrentUser);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const { mutateAsync: updateMe } = useUpdateMe();
  const { mutateAsync: uploadAvatar, isPending: isUploadingAvatar } =
    useUpdateUserAvatarImage();
  const { mutateAsync: uploadBackdrop, isPending: isUploadingBackdrop } =
    useUpdateUserBackdropImage();
  const { mutateAsync: deleteAvatar } = useDeleteUserAvatar();

  const presetColors = useMemo(
    () => [
      "#7C3AED",
      "#3B82F6",
      "#10B981",
      "#EF4444",
      "#F59E0B",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
      "#0EA5E9",
      "#F97316",
    ],
    []
  );

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [backdropMode, setBackdropMode] = useState<"color" | "image">("color");
  const [backdropColor, setBackdropColor] = useState<string>("#7C3AED");
  const [selectedBackdropImage, setSelectedBackdropImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [selectedAvatarImage, setSelectedAvatarImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isAvatarDeleted, setIsAvatarDeleted] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({
    username: "",
  });

  const validateUsername = () => {
    if (!username.trim()) {
      return t("auth.errors.requiredField");
    }
    if (username.trim().length < 3) {
      return t("auth.errors.usernameTooShort");
    }
    if (username.trim().length > 30) {
      return t("auth.errors.usernameTooLong");
    }
    if (username.trim().includes(" ")) {
      return t("auth.errors.usernameContainsSpace");
    }
    return "";
  };

  useEffect(() => {
    if (!currentUser) return;
    setDisplayName(currentUser.displayName || "");
    setUsername(currentUser.username || "");
    setBackdropMode(currentUser.backdropMode || "color");
    setBackdropColor(currentUser.backdropColor || "#7C3AED");
    setIsAvatarDeleted(false);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const displayNameChanged = displayName !== (currentUser.displayName || "");
    const usernameChanged = username !== (currentUser.username || "");
    const modeChanged = backdropMode !== (currentUser.backdropMode || "color");
    const colorChanged =
      (backdropColor || null) !== (currentUser.backdropColor || null);
    const pendingMedia = !!selectedBackdropImage || !!selectedAvatarImage;
    const avatarRemoved = isAvatarDeleted && !!currentUser?.avatar;
    setHasChanges(
      displayNameChanged ||
        usernameChanged ||
        modeChanged ||
        colorChanged ||
        pendingMedia ||
        avatarRemoved
    );
  }, [
    displayName,
    username,
    backdropMode,
    backdropColor,
    selectedBackdropImage,
    selectedAvatarImage,
    isAvatarDeleted,
    currentUser,
  ]);

  const handleBack = () => {
    if (hasChanges) {
      toast(t("toast.changesNotSaved"));
    }
    router.back();
  };

  const handlePickAvatar = async () => {
    Haptics.selectionAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled) {
      setIsAvatarDeleted(false);
      setSelectedAvatarImage(result.assets[0]);
    }
  };

  const handlePickBackdrop = async () => {
    if (!isPlus) {
      toast(t("toast.backdropReserved"));
      return;
    }
    Haptics.selectionAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.8,
    });
    if (!result.canceled) {
      setSelectedBackdropImage(result.assets[0]);
      setBackdropMode("image");
    }
  };

  const handleDeleteAvatar = () => {
    Haptics.selectionAsync();
    if (!selectedAvatarImage && !currentUser?.avatar) {
      return;
    }
    setSelectedAvatarImage(null);
    setIsAvatarDeleted(true);
  };

  const handleSave = async () => {
    const usernameError = validateUsername();
    setErrors({
      username: usernameError,
    });
    if (usernameError) {
      return;
    }

    try {
      setIsSaving(true);

      // Upload avatar if changed
      if (isAvatarDeleted && !selectedAvatarImage) {
        await deleteAvatar();
      }

      if (selectedAvatarImage) {
        await uploadAvatar(selectedAvatarImage);
      }

      // Upload backdrop if image mode and selected
      if (backdropMode === "image" && selectedBackdropImage) {
        if (!isPlus) {
          toast(t("toast.backdropReserved"));
        } else {
          await uploadBackdrop(selectedBackdropImage);
        }
      }

      // Update rest of fields
      const updated = {
        displayName: displayName.trim(),
        username: username.trim(),
        backdropMode,
        backdropColor:
          backdropMode === "color"
            ? backdropColor
            : currentUser?.backdropColor || "#7C3AED",
        backdropImage:
          backdropMode === "image"
            ? selectedBackdropImage?.uri || currentUser?.backdropImage
            : undefined,
      };

      await updateMe(updated);
      await refreshCurrentUser();

      toast(t("toast.profileUpdated"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(t("toast.errorUpdatingProfile"));
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <Text style={[typography.body, { color: colors.secondaryText }]}>
            Chargement...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: colors.tabBarBorder,
        }}
      >
        <Pressable
          onPress={handleBack}
          style={[
            styles.backButton,
            { backgroundColor: colors.backButtonBackground },
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.text }]}>
          {t("profile.editModal.title")}
        </Text>
        <Pressable
          onPress={handleSave}
          style={[
            styles.backButton,
            { backgroundColor: colors.primary, opacity: hasChanges ? 1 : 0.5 },
          ]}
          disabled={
            !hasChanges || isSaving || isUploadingAvatar || isUploadingBackdrop
          }
        >
          <Check size={24} color={colors.buttonText} strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Backdrop mode toggle */}
        <View style={styles.modeToggleRow}>
          <Pressable
            style={[
              styles.modeToggleButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              backdropMode === "color" && { borderColor: colors.primary },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setBackdropMode("color");
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Palette size={18} color={colors.text} />
              <Text
                style={[
                  typography.body,
                  styles.modeToggleText,
                  { color: colors.text },
                ]}
              >
                {t("profile.editModal.color")}
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={[
              styles.modeToggleButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: isPlus ? 1 : 0.6,
              },
              backdropMode === "image" && {
                borderColor: isPlus ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              if (!isPlus) {
                toast(t("toast.backdropReserved"));
                return;
              }
              Haptics.selectionAsync();
              setBackdropMode("image");
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Camera size={18} color={colors.text} />
              <Text
                style={[
                  typography.body,
                  styles.modeToggleText,
                  { color: colors.text },
                ]}
              >
                {t("profile.editModal.backdrop")}
              </Text>
              {!isPlus && <PlusBadge />}
            </View>
          </Pressable>
        </View>

        {/* Backdrop + Avatar preview styled as final */}
        <View style={styles.headerPreview}>
          <View
            style={{
              borderRadius: 24,
              borderWidth: 2,
              borderColor: colors.border,
              overflow: "hidden",
            }}
          >
            {backdropMode === "image" ? (
              <Pressable onPress={handlePickBackdrop}>
                <ImageBackground
                  source={{
                    uri:
                      selectedBackdropImage?.uri ||
                      currentUser.backdropImage ||
                      undefined,
                  }}
                  style={[
                    styles.headerBackdrop,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <LinearGradient
                    colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.5)"]}
                    style={styles.backdropOverlay}
                  >
                    <View style={styles.cameraIconContainer}>
                      <Camera size={24} color="white" />
                      <Text style={[typography.body, styles.cameraText]}>{t("profile.editModal.chooseBackdrop")}</Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </Pressable>
            ) : (
              <View
                style={[
                  styles.headerBackdrop,
                  {
                    backgroundColor:
                      backdropColor || currentUser.backdropColor || "#7C3AED",
                  },
                ]}
              ></View>
            )}
          </View>

          <Pressable
            onPress={handlePickAvatar}
            style={styles.avatarWrap}
          >
            <Avatar
              image={
                selectedAvatarImage?.uri ||
                (isAvatarDeleted ? undefined : currentUser.avatar || undefined)
              }
              size={96}
              borderWidth={4}
              borderColor={colors.background}
            />
            <View
              style={[
                styles.avatarCameraBtn,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="camera" size={14} color={colors.buttonText} />
            </View>
          </Pressable>
        </View>

        {/* Delete avatar */}
        {selectedAvatarImage && (
          <Pressable
            onPress={handleDeleteAvatar}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 16,
              marginBottom: 16,
            }}
          >
            <Ionicons name="trash" size={24} color={colors.error} />
            <Text style={[typography.bodyBold, { color: colors.error }]}>
              {t("profile.editModal.deleteAvatar")}
            </Text>
          </Pressable>
        )}

        {/* Color swatches */}
        {backdropMode === "color" && (
          <View style={styles.swatchesContainer}>
            {presetColors.map((c) => (
              <Pressable
                key={c}
                onPress={() => {
                  Haptics.selectionAsync();
                  setBackdropColor(c);
                }}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: c,
                    borderColor:
                      (backdropColor ||
                        currentUser.backdropColor ||
                        "#7C3AED") === c
                        ? colors.primary
                        : "transparent",
                  },
                ]}
              />
            ))}
          </View>
        )}

        <View style={{ gap: 16 }}>
          {/* Display name */}
        <TextField
          label={t("profile.editModal.displayName")}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={32}
          returnKeyType="done"
          placeholder={t("profile.editModal.displayNamePlaceholder")}
        />

        {/* Username */}
        <TextField
          label={t("profile.editModal.username")}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={32}
          returnKeyType="done"
          placeholder={t("profile.editModal.usernamePlaceholder")}
          error={errors.username}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 120,
  },
  toggleButton: {
    height: 72,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  headerPreview: {
    marginTop: 8,
    marginBottom: 48,
  },
  headerBackdrop: { height: 215, justifyContent: "flex-end" },
  changeBannerCta: { position: "absolute", right: 16, bottom: 16 },
  bannerCtaInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  backdrop: {
    height: 225,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 24,
  },
  backdropOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  cameraText: { color: "white", marginLeft: 8, fontWeight: "600" },
  modeToggleRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  modeToggleButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 22,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  modeToggleText: { fontWeight: "600" },
  swatchesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  avatarWrap: {
    position: "absolute",
    alignSelf: "center",
    bottom: -36,
  },
  avatarCameraBtn: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
