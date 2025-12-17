import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useList, useUpdateList, useUpdateBackdropImage } from "@/hooks/queries/lists";
import { useUserStore } from "@/stores/userStore";
import Badge from "@/components/ui/Badge";
import { X, Plus, Check, Globe, Lock, Trophy, Users, Palette, Camera } from "lucide-react-native";
import { toast } from "sonner-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import PlusBadge from "@/components/ui/PlusBadge";
import { Image } from "expo-image";

export default function ListEdit() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  // Data
  const { data: list } = useList(listId as string);
  const { mutateAsync: updateList } = useUpdateList();
  const { mutateAsync: updateBackdropImage } = useUpdateBackdropImage();
  const [isSaving, setIsSaving] = useState(false);
  const currentUser = useUserStore((state) => state.currentUser);
  const isPlus = currentUser?.plan === "plus";

  const presetColors = [
    "#7C3AED", // violet
    "#3B82F6", // blue
    "#10B981", // green
    "#EF4444", // red
    "#F59E0B", // amber
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#06B6D4", // cyan
    "#0EA5E9", // sky
    "#F97316", // orange
  ];

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [ranked, setRanked] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [backdropMode, setBackdropMode] = useState<"color" | "image">("color");
  const [backdropColor, setBackdropColor] = useState<string>("#7C3AED");

  // Query hook loads data

  // Initialize form with list data
  useEffect(() => {
    if (list) {
      setName(list.name || "");
      setDescription(list.description || "");
      setTags(list.tags || []);
      setIsPublic(list.isPublic || false);
      setRanked(list.ranked || false);
      setBackdropMode(list.backdropMode || "color");
      setBackdropColor(list.backdropColor || "#7C3AED");
    }
  }, [list]);

  // Track changes
  useEffect(() => {
    if (list) {
      const nameChanged = name !== (list.name || "");
      const descriptionChanged = description !== (list.description || "");
      const tagsChanged =
        JSON.stringify(tags.sort()) !==
        JSON.stringify((list.tags || []).sort());
      const isPublicChanged = isPublic !== (list.isPublic || false);
      const rankedChanged = ranked !== (list.ranked || false);
      const backdropColorChanged = (backdropColor || null) !== (list.backdropColor || null);
      const modeChanged = (backdropMode === "image") !== !!list.backdropImage;
      setHasChanges(
        nameChanged || descriptionChanged || tagsChanged || isPublicChanged || rankedChanged || backdropColorChanged || modeChanged || !!selectedImage
      );
    }
  }, [name, description, tags, isPublic, ranked, list, selectedImage, backdropColor, backdropMode]);

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        "Modifications non sauvegardées",
        "Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Quitter",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handlePickImage = async () => {
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
      setSelectedImage(result.assets[0]);
      setBackdropMode("image");
    }
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      Haptics.selectionAsync();
      setTags([...tags, trimmedTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    Haptics.selectionAsync();
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t("toast.listNameRequired"));
      return;
    }

    try {
      setIsSaving(true);

      // Backdrop handling
      if (backdropMode === "image") {
        if (!isPlus) {
          toast(t("toast.backdropReserved"));
        } else if (selectedImage) {
          await updateBackdropImage({ listId: listId as string, image: selectedImage });
        }
      }

      const payload: any = {
        name: name.trim(),
        description: description.trim() || null,
        backdropMode: backdropMode,
        backdropColor: backdropColor,
        // When switching to color mode, explicitly clear the image on backend
        ...(backdropMode === "color" ? { backdropImage: null } : {}),
        tags: tags.length > 0 ? tags : null,
        isPublic: isPublic,
        ranked: ranked,
      };

      await updateList({ listId: listId as string, updated: payload });

      toast(t("toast.listUpdated"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.back();
  } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(t("toast.errorUpdatingList"));
    } finally {
      setIsSaving(false);
    }
  };

  //

  const togglePublic = () => {
    Haptics.selectionAsync();
    setIsPublic(!isPublic);
  };

  const toggleRanked = () => {
    Haptics.selectionAsync();
    setRanked(!ranked);
  };

  if (!list) {
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
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.tabBarBorder }}>
        <Pressable
          onPress={handleBack}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.backButtonBackground,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
              elevation: 1,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.text }]}>
          {t("list.editModal.title")}
        </Text>
        <Pressable
          onPress={handleSave}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.primary,
              opacity: hasChanges ? 1 : 0.5,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
              elevation: 1,
            },
          ]}
          disabled={!hasChanges || isSaving}
        >
          <Check size={24} color={colors.buttonText} strokeWidth={2.5} />
        </Pressable>
      </View>

        <View style={{ flex: 1 }} collapsable={false}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120}]}
          showsVerticalScrollIndicator={false}
        >
          {/* Backdrop Mode Toggle */}
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Palette size={18} color={colors.text} />
                <Text style={[typography.body, styles.modeToggleText, { color: colors.text }]}>{t("list.editModal.color")}</Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.modeToggleButton,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: isPlus ? 1 : 0.6 },
                backdropMode === "image" && { borderColor: isPlus ? colors.primary : colors.border },
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Camera size={18} color={colors.text} />
                <Text style={[typography.body, styles.modeToggleText, { color: colors.text }]}>{t("list.editModal.backdrop")}</Text>
                {!isPlus && <PlusBadge />}
              </View>
            </Pressable>
          </View>

          {/* Backdrop Preview */}
          <Pressable onPress={backdropMode === "image" ? handlePickImage : undefined}>
            <View
              style={[
                styles.backdrop,
                {
                  borderRadius: 24,
                  borderWidth: 2,
                  borderColor: colors.border,
                  overflow: "hidden",
                }
              ]}
            >
              {backdropMode === "image" ? (
                selectedImage?.uri || list.backdropImage ? (
                  <Image
                    source={{ uri: selectedImage?.uri || list.backdropImage || undefined }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : (
                  <View style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: colors.card,
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                    <Camera size={32} color={colors.secondaryText} />
                    <Text style={[typography.body, { color: colors.secondaryText, marginTop: 8 }]}>
                      {t("list.editModal.chooseBackdrop")}
                    </Text>
                  </View>
                )
              ) : (
                <View style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: backdropColor || list.backdropColor || "#7C3AED",
                }}>
                </View>
              )}
            </View>
          </Pressable>

          {/* Color Swatches */}
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
                    { backgroundColor: c, borderColor: (backdropColor || list.backdropColor || "#7C3AED") === c ? colors.primary : "transparent" },
                  ]}
                />
              ))}
            </View>
          )}

            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <Text
                style={[typography.h3, styles.label, { color: colors.text }]}
              >
                {t("list.editModal.name")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  typography.body,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={name}
                onChangeText={setName}
                maxLength={100}
                autoCapitalize="sentences"
                returnKeyType="next"
              />
            </View>

            {/* Description Field */}
            <View style={styles.fieldContainer}>
              <Text
                style={[typography.h3, styles.label, { color: colors.text }]}
              >
                {t("list.editModal.description")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.descriptionInput,
                  typography.body,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder={t("list.editModal.descriptionPlaceholder")}
                placeholderTextColor={colors.secondaryText}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
                autoCapitalize="sentences"
                returnKeyType="default"
              />
            </View>

            {/* Tags Field */}
            <View style={styles.fieldContainer}>
              <Text
                style={[typography.h3, styles.label, { color: colors.text }]}
              >
                {t("list.editModal.tags")}
              </Text>

              {/* Add Tag Input */}
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.tagInput,
                    typography.body,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder={t("list.editModal.tagsPlaceholder")}
                  placeholderTextColor={colors.secondaryText}
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={addTag}
                  maxLength={30}
                  autoCapitalize="none"
                  returnKeyType="done"
                />
                <Pressable
                  style={[
                    styles.addTagButton,
                    { opacity: newTag.trim() ? 1 : 0.5 },
                  ]}
                  onPress={addTag}
                  disabled={!newTag.trim()}
                >
                  <Plus size={20} color={colors.icon} strokeWidth={2.5} />
                </Pressable>
              </View>

              {/* Tags Display */}
              {tags.length > 0 && (
                <Animated.View
                  entering={FadeInDown.duration(300)}
                  style={styles.tagsContainer}
                >
                  {tags.map((tag, index) => (
                    <Animated.View
                      key={tag}
                      entering={FadeInDown.duration(300).delay(index * 50)}
                      style={styles.tagItem}
                    >
                      <Badge
                        text={tag}
                        color={colors.badgeText}
                        backgroundColor={colors.badgeBackground}
                        borderColor={colors.badgeBorder}
                      />
                      <Pressable
                        style={styles.removeTagButton}
                        onPress={() => removeTag(tag)}
                      >
                        <X size={14} color={colors.secondaryText} />
                      </Pressable>
                    </Animated.View>
                  ))}
                </Animated.View>
              )}
            </View>

            {/* Visibility and Ranking Options */}
            <View style={styles.fieldContainer}>
              <Text
                style={[typography.h3, styles.label, { color: colors.text }]}
              >
                {t("list.editModal.settings")}
              </Text>
              
              <View style={styles.toggleContainer}>
                {/* Public/Private Toggle */}
                <Pressable
                  style={[
                    styles.toggleButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={togglePublic}
                >
                  <View style={styles.toggleContent}>
                    {isPublic ? (
                      <Globe size={20} color={colors.text} />
                    ) : (
                      <Lock size={20} color={colors.text} />
                    )}
                    <View style={styles.toggleTextContainer}>
                      <Text
                        style={[
                          typography.body,
                          styles.toggleTitle,
                          { color: colors.text },
                        ]}
                      >
                        {isPublic ? t("list.editModal.public") : t("list.editModal.private")}
                      </Text>
                      <Text
                        style={[
                          typography.caption,
                          styles.toggleDescription,
                          { color: colors.secondaryText },
                        ]}
                      >
                        {isPublic 
                          ? t("list.editModal.publicDescription")
                          : t("list.editModal.privateDescription")
                        }
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {/* Ranked Toggle */}
                <Pressable
                  style={[
                    styles.toggleButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={toggleRanked}
                >
                  <View style={styles.toggleContent}>
                    {ranked ? (
                      <Trophy size={20} color={colors.text} />
                    ) : (
                      <Users size={20} color={colors.text} />
                    )}
                    <View style={styles.toggleTextContainer}>
                      <Text
                        style={[
                          typography.body,
                          styles.toggleTitle,
                          { color: colors.text },
                        ]}
                      >
                        {ranked ? t("list.editModal.ranked") : t("list.editModal.collection")}
                      </Text>
                      <Text
                        style={[
                          typography.caption,
                          styles.toggleDescription,
                          { color: colors.secondaryText },
                        ]}
                      >
                        {ranked 
                          ? t("list.editModal.rankedDescription")
                          : t("list.editModal.collectionDescription")
                        }
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            </View>
        </ScrollView>
        </View>
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
    paddingBottom: 120, // Account for button container
  },
  formContainer: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    paddingTop: 16,
  },
  toggleContainer: {
    gap: 12,
  },
  toggleButton: {
    height: 72,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  toggleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontWeight: "600",
    fontSize: 16,
  },
  toggleDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  tagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  removeTagButton: {
    padding: 2,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
  },
  backdrop: {
    height: 215,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  cameraIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cameraText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  modeToggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  modeToggleButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 22,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  modeToggleText: {
    fontWeight: "600",
  },
  swatchesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: -8,
    marginBottom: 16,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
});
