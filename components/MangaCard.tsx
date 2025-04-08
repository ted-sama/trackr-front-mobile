import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Manga } from "../types";
import { useTheme } from "../contexts/ThemeContext";

interface MangaCardProps {
  manga: Manga;
  onPress?: (manga: Manga) => void;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.33;

const MangaCard = ({ manga, onPress }: MangaCardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isTracking, setIsTracking] = useState(manga.tracking);
  const { colors } = useTheme();

  // Référence au bottom sheet modal
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // Options for the bottom sheet tracking actions
  const bottomSheetTrackingOptions = [
    {
      id: "reading",
      title: "Mettre en cours de lecture",
      icon: "add-circle-outline" as const,
    },
    {
      id: "add-to-list",
      title: "Ajouter à une liste",
      icon: "remove-circle-outline" as const,
    },
    {
      id: "stopped",
      title: "Mettre en arrêt",
      icon: "stop-circle-outline" as const,
    },
  ];

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Fonction pour présenter le bottom sheet
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleTrackingToggle = () => {
    // Ouvrir le bottom sheet au lieu de modifier directement l'état
    handlePresentModalPress();

    // On garde le console log temporairement, la logique sera déplacée dans le bottom sheet
    console.log(
      manga.tracking
        ? `${manga.title} ajouté au suivi`
        : `${manga.title} retiré du suivi`
    );
    // Here you would typically also update the tracking status in your backend or state management
  };

  // Composant personnalisé pour le backdrop avec animation d'opacité
  const CustomBackdrop = ({
    animatedIndex,
    style,
  }: BottomSheetBackdropProps) => {
    const { colors } = useTheme();

    // Style animé pour l'opacité basé sur la position du bottom sheet
    const animatedStyle = useAnimatedStyle(() => {
      // Interpoler l'opacité entre 0 et 0.5 en fonction de l'index animé
      // -1 = fermé, 0 ou plus = ouvert à différentes positions de snap
      const opacity = interpolate(
        animatedIndex.value,
        [-1, 0],
        [0, 0.5],
        Extrapolation.CLAMP
      );

      return {
        backgroundColor: "black",
        opacity,
      };
    });

    return (
      <Animated.View
        style={[
          style,
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
          animatedStyle,
        ]}
        onTouchEnd={() => bottomSheetModalRef.current?.close()}
      />
    );
  };

  return (
    <>
      <TouchableWithoutFeedback
        onPress={() =>
          onPress
            ? onPress(manga)
            : console.log(`Manga sélectionné: ${manga.title}`)
        }
      >
        <View style={styles.mangaCard}>
          <View
            style={[styles.imageContainer, { backgroundColor: colors.card }]}
          >
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            )}
            <Image
              source={{ uri: manga.coverImage }}
              style={styles.mangaCover}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {!isLoading && !hasError && (
              <TouchableWithoutFeedback onPress={handleTrackingToggle}>
                <View style={styles.trackButton}>
                  <View
                    style={[
                      styles.trackButtonIcon,
                      {
                        backgroundColor: isTracking
                          ? colors.accent
                          : "#1616167b",
                      },
                    ]}
                  />
                  {isTracking ? (
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={24}
                      color="#FFF"
                    />
                  ) : (
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color="#FFF"
                    />
                  )}
                </View>
              </TouchableWithoutFeedback>
            )}
            {hasError && (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: colors.card },
                ]}
              >
                <Ionicons
                  name="image-outline"
                  size={24}
                  color={colors.border}
                />
                <Text style={[styles.errorText, { color: colors.border }]}>
                  Image non disponible
                </Text>
              </View>
            )}
          </View>

          <View style={styles.mangaInfo}>
            <Text
              style={[styles.mangaTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {manga.title}
            </Text>
            <Text
              style={[styles.mangaAuthor, { color: colors.secondaryText }]}
              numberOfLines={1}
            >
              {manga.author}
            </Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={colors.text} />
              <Text
                style={[styles.ratingText, { color: colors.secondaryText }]}
              >
                {manga.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
      {/* Bottom Sheet Modal */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        backgroundStyle={{ backgroundColor: colors.card }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
        backdropComponent={CustomBackdrop}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Image
              source={{ uri: manga.coverImage }}
              style={{
                width: 60,
                height: 60 * 1.5,
                borderRadius: 6,
                marginBottom: 10,
              }}
            />
            <View>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                {manga.title}
              </Text>
              <Text
                style={{
                  color: colors.secondaryText,
                  fontSize: 14,
                  marginTop: 4,
                }}
              >
                {manga.author}
              </Text>
              <View style={[styles.ratingContainer, { marginTop: 4 }]}>
                <Ionicons name="star" size={14} color={colors.text} />
                <Text
                  style={[styles.ratingText, { color: colors.secondaryText }]}
                >
                  {manga.rating.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.bottomSheetActions}>
            {bottomSheetTrackingOptions.map((option) => (
              <TouchableWithoutFeedback
                key={option.id}
                onPress={() => {
                  console.log(`Action: ${option.title}`);
                  bottomSheetModalRef.current?.close();
                }}
              >
                <View
                  style={styles.bottomSheetActionButton}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={colors.text}
                    style={{
                      marginRight: 8,
                    }}
                  />
                  <Text style={{ color: colors.text }}>{option.title}</Text>
                </View>
              </TouchableWithoutFeedback>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
};

const styles = StyleSheet.create({
  mangaCard: {
    width: CARD_WIDTH,
    marginRight: 12,
    overflow: "hidden",
  },
  bottomSheetContent: {
    padding: 16,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    gap: 10,
  },
  bottomSheetActions: {
    flexDirection: "column",
    gap: 10,
    marginTop: 16,
  },
  bottomSheetActionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 6,
  },
  imageContainer: {
    width: "100%",
    height: CARD_WIDTH * 1.5,
    borderRadius: 6,
    position: "relative",
  },
  mangaCover: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    resizeMode: "cover",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  errorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  trackButton: {
    position: "absolute",
    top: 4,
    right: 4,
    padding: 4,
  },
  trackButtonIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 12,
  },
  mangaInfo: {
    paddingTop: 8,
  },
  mangaTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  mangaAuthor: {
    fontSize: 12,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
});

export default React.memo(MangaCard);
