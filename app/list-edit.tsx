import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ImageBackground,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import { useListStore } from "@/stores/listStore";
import { useUserStore } from "@/stores/userStore";
import Button from "@/components/ui/Button";
import SecondaryButton from "@/components/ui/SecondaryButton";
import Badge from "@/components/ui/Badge";
import { X, Plus, Check, Globe, Lock, Trophy, Users, Palette, Camera } from "lucide-react-native";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";


const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function ListEdit() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();

  // Store
  const list = useListStore(
    (state) =>
      state.listsById[listId as string] || state.myListsById[listId as string]
  );
  const updateList = useListStore((state) => state.updateList);
  const fetchList = useListStore((state) => state.fetchList);
  const isLoading = useListStore((state) => state.isLoading);
  const updateBackdropImage = useListStore((state) => state.updateBackdropImage);
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

  // Load list data
  useEffect(() => {
    if (listId && !list) {
      fetchList(listId as string);
    }
  }, [listId, list, fetchList]);

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
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Le nom de la liste est requis",
      });
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Backdrop handling
      if (backdropMode === "image") {
        if (!isPlus) {
          Toast.show({
            type: "info",
            text1: "Réservé au plan Plus",
            text2: "L'illustration de bannière est disponible avec le plan Plus.",
          });
        } else if (selectedImage) {
          await updateBackdropImage(listId, selectedImage);
        }
      }

      const payload: any = {
        name: name.trim(),
        description: description.trim() || null,
        backdropMode: backdropMode,
        backdropColor: backdropColor,
        backdropImage: backdropMode === "image" ? selectedImage?.uri : null,
        tags: tags.length > 0 ? tags : null,
        isPublic: isPublic,
        ranked: ranked,
      };

      console.log(payload)

      await updateList(listId, payload);

      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Liste mise à jour avec succès",
      });

      router.back();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de mettre à jour la liste",
      });
    }
  };

  const handleReset = () => {
    if (list) {
      setName(list.name || "");
      setDescription(list.description || "");
      setTags(list.tags || []);
      setIsPublic(list.isPublic || false);
      setRanked(list.ranked || false);
      setBackdropColor(list.backdropColor || "#7C3AED");
      setBackdropMode(list.backdropImage ? "image" : "color");
      setSelectedImage(null);
    }
  };

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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style="light" />
      <View style={{ padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
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
          Modifier la liste
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.backButton,
            { backgroundColor: colors.primary, opacity: hasChanges ? 1 : 0.5 },
          ]}
          disabled={!hasChanges || isLoading}
        >
          <Check size={24} color={colors.buttonText} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

        <View style={{ flex: 1 }} collapsable={false}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120}]}
          showsVerticalScrollIndicator={false}
        >
          {/* Backdrop Mode Toggle */}
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Palette size={18} color={colors.text} />
                <Text style={[typography.body, styles.modeToggleText, { color: colors.text }]}>Couleur</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeToggleButton,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: isPlus ? 1 : 0.6 },
                backdropMode === "image" && { borderColor: isPlus ? colors.primary : colors.border },
              ]}
              onPress={() => {
                if (!isPlus) {
                  Toast.show({
                    type: "info",
                    text1: "Réservé au plan Plus",
                    text2: "L'illustration de bannière est disponible avec le plan Plus.",
                  });
                  return;
                }
                Haptics.selectionAsync();
                setBackdropMode("image");
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Camera size={18} color={colors.text} />
                <Text style={[typography.body, styles.modeToggleText, { color: colors.text }]}>Illustration</Text>
                {!isPlus && <Lock size={16} color={colors.secondaryText} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* Backdrop Preview */}
          {backdropMode === "image" ? (
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
              <ImageBackground
                source={{ uri: selectedImage?.uri || list.backdropImage || undefined }}
                style={[styles.backdrop, { backgroundColor: colors.card }]}
                imageStyle={{ borderRadius: 16 }}
              >
                <LinearGradient
                  colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.5)"]}
                  style={styles.backdropOverlay}
                >
                  <View style={styles.cameraIconContainer}>
                    <Camera size={24} color="white" />
                    <Text style={[typography.body, styles.cameraText]}>Changer la bannière</Text>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          ) : (
            <View style={[styles.backdrop, { backgroundColor: backdropColor || list.backdropColor || "#7C3AED" }] }>
              <LinearGradient
                colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.5)"]}
                style={styles.backdropOverlay}
              >
                <View style={styles.cameraIconContainer}>
                  <Palette size={24} color="white" />
                  <Text style={[typography.body, styles.cameraText]}>Choisir une couleur</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Color Swatches */}
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
                Nom de la liste
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
                placeholder="Entrez le nom de la liste"
                placeholderTextColor={colors.secondaryText}
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
                Description
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
                placeholder="Décrivez votre liste (optionnel)"
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
                Tags
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
                  placeholder="Ajouter un tag"
                  placeholderTextColor={colors.secondaryText}
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={addTag}
                  maxLength={30}
                  autoCapitalize="none"
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[
                    styles.addTagButton,
                    { opacity: newTag.trim() ? 1 : 0.5 },
                  ]}
                  onPress={addTag}
                  disabled={!newTag.trim()}
                >
                  <Plus size={20} color={colors.icon} strokeWidth={2.5} />
                </TouchableOpacity>
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
                      <TouchableOpacity
                        style={styles.removeTagButton}
                        onPress={() => removeTag(tag)}
                      >
                        <X size={14} color={colors.secondaryText} />
                      </TouchableOpacity>
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
                Options
              </Text>
              
              <View style={styles.toggleContainer}>
                {/* Public/Private Toggle */}
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={togglePublic}
                  activeOpacity={0.7}
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
                        {isPublic ? "Publique" : "Privée"}
                      </Text>
                      <Text
                        style={[
                          typography.caption,
                          styles.toggleDescription,
                          { color: colors.secondaryText },
                        ]}
                      >
                        {isPublic 
                          ? "Visible par tous les utilisateurs"
                          : "Visible seulement par vous"
                        }
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Ranked Toggle */}
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={toggleRanked}
                  activeOpacity={0.7}
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
                        {ranked ? "Classement" : "Collection"}
                      </Text>
                      <Text
                        style={[
                          typography.caption,
                          styles.toggleDescription,
                          { color: colors.secondaryText },
                        ]}
                      >
                        {ranked 
                          ? "Liste avec ordre de préférence"
                          : "Collection simple sans classement"
                        }
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
        </ScrollView>
        </View>
    </SafeAreaView>
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
    height: 275,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
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
    borderRadius: 12,
    paddingHorizontal: 12,
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
