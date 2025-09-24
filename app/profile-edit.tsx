import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
//
import { Camera, Check, Lock, Palette } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useUserStore } from "@/stores/userStore";
import { TextField } from "@/components/ui/TextField";
import Avatar from "@/components/ui/Avatar";
//
import {
  useUpdateMe,
  useUpdateUserAvatarImage,
  useUpdateUserBackdropImage,
} from "@/hooks/queries/users";
import { Image } from "expo-image";

export default function ProfileEdit() {
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const currentUser = useUserStore((s) => s.currentUser);
  const isPlus = currentUser?.plan === "plus";

  const { mutateAsync: updateMe } = useUpdateMe();
  const { mutateAsync: uploadAvatar, isPending: isUploadingAvatar } =
    useUpdateUserAvatarImage();
  const { mutateAsync: uploadBackdrop, isPending: isUploadingBackdrop } =
    useUpdateUserBackdropImage();

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
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setDisplayName(currentUser.displayName || "");
    setUsername(currentUser.username || "");
    setBackdropMode(currentUser.backdropMode || "color");
    setBackdropColor(currentUser.backdropColor || "#7C3AED");
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const displayNameChanged = displayName !== (currentUser.displayName || "");
    const usernameChanged = username !== (currentUser.username || "");
    const modeChanged = backdropMode !== (currentUser.backdropMode || "color");
    const colorChanged =
      (backdropColor || null) !== (currentUser.backdropColor || null);
    const pendingMedia = !!selectedBackdropImage || !!selectedAvatarImage;
    setHasChanges(
      displayNameChanged || usernameChanged || modeChanged || colorChanged || pendingMedia
    );
  }, [
    displayName,
    username,
    backdropMode,
    backdropColor,
    selectedBackdropImage,
    selectedAvatarImage,
    currentUser,
  ]);

  const handleBack = () => {
    if (hasChanges) {
      Toast.show({ type: "info", text1: "Modifications non sauvegardées" });
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
    if (!result.canceled) setSelectedAvatarImage(result.assets[0]);
  };

  const handlePickBackdrop = async () => {
    if (!isPlus) {
      Toast.show({
        type: "info",
        text1: "Réservé au plan Plus",
        text2: "L'illustration de bannière est disponible avec le plan Plus.",
      });
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

  const handleSave = async () => {
    if (!username.trim()) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Le nom d'utilisateur est requis",
      });
      return;
    }

    try {
      setIsSaving(true);

      // Upload avatar if changed
      if (selectedAvatarImage) {
        await uploadAvatar(selectedAvatarImage);
      }

      // Upload backdrop if image mode and selected
      if (backdropMode === "image" && selectedBackdropImage) {
        if (!isPlus) {
          Toast.show({
            type: "info",
            text1: "Réservé au plan Plus",
            text2:
              "L'illustration de bannière est disponible avec le plan Plus.",
          });
        } else {
          await uploadBackdrop(selectedBackdropImage);
        }
      }

      // Update rest of fields
      await updateMe({
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
      });

      Toast.show({
        type: "info",
        text1: "Profil mis à jour",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de mettre à jour le profil",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <View
        style={{
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={[
            styles.backButton,
            { backgroundColor: colors.backButtonBackground },
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.text }]}>
          Modifier le profil
        </Text>
        <TouchableOpacity
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
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Backdrop mode toggle */}
        <View style={styles.modeToggleRow}>
          <TouchableOpacity
            style={[
              styles.modeToggleButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              backdropMode === "color" && { borderColor: colors.primary },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setBackdropMode("color");
            }}
            activeOpacity={0.7}
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
                Couleur
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
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
                Toast.show({
                  type: "info",
                  text1: "Réservé au plan Plus",
                  text2:
                    "L'illustration de bannière est disponible avec le plan Plus.",
                });
                return;
              }
              Haptics.selectionAsync();
              setBackdropMode("image");
            }}
            activeOpacity={0.7}
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
                Illustration
              </Text>
              {!isPlus && <Lock size={16} color={colors.secondaryText} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Backdrop + Avatar preview styled as final */}
        <View style={styles.headerPreview}>
          {backdropMode === "image" ? (
            <TouchableOpacity onPress={handlePickBackdrop} activeOpacity={0.9}>
              <Image
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
              ></Image>
            </TouchableOpacity>
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

          <TouchableOpacity
            onPress={handlePickAvatar}
            activeOpacity={0.9}
            style={styles.avatarWrap}
          >
            <Avatar
              image={selectedAvatarImage?.uri || currentUser.avatar || ""}
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
          </TouchableOpacity>
        </View>

        {/* Color swatches */}
        {backdropMode === "color" && (
          <View style={styles.swatchesContainer}>
            {presetColors.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => {
                  Haptics.selectionAsync();
                  setBackdropColor(c);
                }}
                activeOpacity={0.8}
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

        {/* Display name */}
        <TextField
          label="Nom d'affichage"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={32}
          returnKeyType="done"
          placeholder="Entrez votre nom d'utilisateur"
        />

        {/* Username */}
        <TextField
          label="Nom d'utilisateur"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={32}
          returnKeyType="done"
          placeholder="Entrez votre nom d'utilisateur"
        />
      </ScrollView>
    </View>
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
    marginHorizontal: -16,
    width: "110%",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 48,
  },
  headerBackdrop: { height: 260, justifyContent: "flex-end" },
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
    borderRadius: 12,
    paddingHorizontal: 12,
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
