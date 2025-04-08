import React, { useState } from "react";
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

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleTrackingToggle = () => {
    // Update local state
    setIsTracking(!isTracking);

    // Update manga object
    manga.tracking = !manga.tracking;
    console.log(
      manga.tracking
        ? `${manga.title} ajouté au suivi`
        : `${manga.title} retiré du suivi`
    );
    // Here you would typically also update the tracking status in your backend or state management
  };
  return (
    <TouchableWithoutFeedback
      onPress={() =>
        onPress
          ? onPress(manga)
          : console.log(`Manga sélectionné: ${manga.title}`)
      }
    >
      <View style={styles.mangaCard}>
        <View style={[styles.imageContainer, { backgroundColor: colors.card }]}>
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
                      backgroundColor: isTracking ? colors.accent : "#1616167b",
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
                  <Ionicons name="add-circle-outline" size={24} color="#FFF" />
                )}
              </View>
            </TouchableWithoutFeedback>
          )}
          {hasError && (
            <View
              style={[styles.errorContainer, { backgroundColor: colors.card }]}
            >
              <Ionicons name="image-outline" size={24} color={colors.border} />
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
            <Text style={[styles.ratingText, { color: colors.secondaryText }]}>
              {manga.rating.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  mangaCard: {
    width: CARD_WIDTH,
    marginRight: 12,
    overflow: "hidden",
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
