import { getBook, getBooks } from "@/api";
import React, { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Book, Category } from "@/types";
import {
  Text,
  StyleSheet,
  View,
  Image,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import TrackingIconButton from "@/components/TrackingIconButton";
import { useTypography } from "@/hooks/useTypography";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import CategorySlider from "@/components/CategorySlider";
import { BlurView } from 'expo-blur';
// @ts-ignore no type declarations for masked-view
import MaskedView from '@react-native-masked-view/masked-view';
import { Canvas, Rect, RadialGradient, vec } from "@shopify/react-native-skia";
import { DeviceMotion } from "expo-sensors";
import SkeletonLoader from "@/components/skeleton-loader/SkeletonLoader";

// Constants for animation
const COLLAPSED_HEIGHT = 60; // Adjust based on font size/line height for ~3 lines
const EXPANDED_HEIGHT = 1000; // Use a large enough value for any description size
const ANIMATION_DURATION = 300; // ms

export default function BookScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false); // State for description expansion
  const [dummyRecommendations, setDummyRecommendations] = useState<Category | null>(null);
  // Animation setup for button
  const translateY = useSharedValue(150);
  const scale = useSharedValue(0.1);
  const pressScale = useSharedValue(1);

  // Animation setup for description height
  const descriptionMaxHeight = useSharedValue(COLLAPSED_HEIGHT);

  // Add animated values for social buttons
  const reviewsOpacity = useSharedValue(1);
  const listsOpacity = useSharedValue(1);
  const reviewsScale = useSharedValue(1);
  const listsScale = useSharedValue(1);

  // Add animated styles for social buttons
  const reviewsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: reviewsOpacity.value,
      transform: [{ scale: reviewsScale.value }],
    };
  });

  const listsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: listsOpacity.value,
      transform: [{ scale: listsScale.value }],
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    };
  });

  // Animated style for description container
  const animatedDescriptionStyle = useAnimatedStyle(() => {
    return {
      maxHeight: descriptionMaxHeight.value,
      overflow: "hidden", // Apply overflow hidden here
    };
  });

  // Style for press animation
  const animatedPressStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pressScale.value }],
    };
  });

  const typeMap = {
    manga: "Manga",
    novel: "Roman",
    light_novel: "Light Novel",
    web_novel: "Web Novel",
    comic: "Comic",
    other: "Autre",
  };

  // Toggle function for description expansion
  const toggleDescription = () => {
    const targetHeight = isDescriptionExpanded
      ? COLLAPSED_HEIGHT
      : EXPANDED_HEIGHT;
    descriptionMaxHeight.value = withTiming(targetHeight, {
      duration: ANIMATION_DURATION,
      easing: Easing.inOut(Easing.ease), // Use a suitable easing function
    });
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  // Reflection effect setup with native Image and Skia overlay
  const IMAGE_WIDTH = 202.5;
  const IMAGE_HEIGHT = 303.75;
  const GRADIENT_RADIUS = 80;
  const [tiltPos, setTiltPos] = useState<{ x: number; y: number }>({ x: IMAGE_WIDTH / 2, y: IMAGE_HEIGHT / 2 });

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const book = await getBook({ id: id as string });
        setBook(book);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRecommendations = async () => {
      const recommendations = await getBooks();
      setDummyRecommendations({
        id: "recommendations",
        title: "Recommendations",
        books: recommendations.items,
      });
    };

    fetchBook();
    fetchRecommendations();
  }, [id]);

  useEffect(() => {
    DeviceMotion.setUpdateInterval(50);
    const subscription = DeviceMotion.addListener((motion) => {
      const { beta = 0, gamma = 0 } = motion.rotation ?? {};
      const normX = (gamma / (Math.PI / 2) + 1) / 2;
      const normY = (beta / (Math.PI / 2) + 1) / 2;
      setTiltPos({ x: normX * IMAGE_WIDTH, y: normY * IMAGE_HEIGHT });
    });
    return () => subscription.remove();
  }, []);

  // Trigger animation on mount
  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.exp),
    });
    scale.value = withTiming(1, {
      // Animate scale to 100%
      duration: 750,
      easing: Easing.out(Easing.exp),
    });
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Une erreur est survenue</Text>
      </View>
    );
  }

  const separator = () => {
    return (
      <Text
        style={{
          fontWeight: "900",
          marginHorizontal: 4,
          color: colors.secondaryText,
        }}
      >
        ·
      </Text>
    );
  };
  const dates = () => {
    if (book?.release_year && book?.end_year) {
      return `${book?.release_year} - ${book?.end_year}`;
    } else if (
      book?.release_year &&
      !book?.end_year &&
      book?.status === "ongoing"
    ) {
      return `${book?.release_year} - en cours`;
    }
    return book?.release_year;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "right", "left"]}
    >
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
        <View style={styles.shadowContainer}>
          <View style={styles.imageContainer}>
             {
              isLoading ? (
                <SkeletonLoader width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />
              ) : (
                <Image source={{ uri: book?.cover_image }} style={styles.imageContent} />
              )
             }
            <Canvas style={styles.overlayCanvas}> 
              <Rect x={0} y={0} width={IMAGE_WIDTH} height={IMAGE_HEIGHT}>
                <RadialGradient
                  c={vec(tiltPos.x, tiltPos.y)}
                  r={GRADIENT_RADIUS}
                  colors={["rgba(255, 255, 255, 0.2)", "rgba(255,255,255,0)"]}
                  positions={[0, 1]}
                />
              </Rect>
            </Canvas>
          </View>
        </View>
        <View style={styles.detailsContainer}>
          {/* Title, author, type, dates and tracking button */}
          <View style={styles.titleTextContainer}>
            <View style={{ flex: 3 }}>
              {isLoading ? (
                <SkeletonLoader width={'100%'} height={40} />
              ) : (
                <Text
                  style={[styles.title, typography.h1, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
              >
                {book?.title}
              </Text>
              )}
              <Text
                style={[
                  styles.author,
                  typography.caption,
                  { color: colors.secondaryText },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {book?.author}
              </Text>
              <View style={[styles.infosContainer]}>
                <Text
                  style={[typography.caption, { color: colors.secondaryText }]}
                  numberOfLines={1}
                >
                  {typeMap[book?.type as keyof typeof typeMap]}
                </Text>
                {separator()}
                <Text
                  style={[typography.caption, { color: colors.secondaryText }]}
                  numberOfLines={1}
                >
                  {dates()}
                </Text>
              </View>
            </View>
            <View style={styles.trackingContainer}>
              <TrackingIconButton
                size={32}
                isTracking={book?.tracking!}
                onPress={() => {}}
              />
            </View>
          </View>
          {/* Description */}
          {book?.description && (
            <View>
              <Animated.View
                style={[styles.descriptionContainer, animatedDescriptionStyle]}
              >
                <Text style={[typography.body, { color: colors.text }]}>
                  {book?.description}
                </Text>
                {!isDescriptionExpanded && (
                  <LinearGradient
                    // Use background color with varying alpha (Hex8 format)
                    colors={[
                      `${colors.background}00`,
                      `${colors.background}B3`,
                      colors.background,
                    ]}
                    locations={[0, 0.5, 1]} // Adjust fade start/intensity
                    style={styles.fadeOverlay}
                    pointerEvents="none" // Allow touches to pass through
                  />
                )}
              </Animated.View>
              {/* Toggle Button */}
              <Pressable
                onPress={toggleDescription}
                style={styles.toggleButton}
              >
                <Text
                  style={[
                    typography.body,
                    styles.toggleButtonText,
                    { color: colors.primary },
                  ]}
                >
                  {isDescriptionExpanded ? "Réduire" : "Lire la suite"}
                </Text>
              </Pressable>
            </View>
          )}
          {/* Ratings / Socials */}
          <View
            style={[styles.ratingsContainer, { borderColor: colors.border }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <Ionicons name="star" size={24} color={colors.primary} />
              <Text
                style={[
                  typography.categoryTitle,
                  { color: colors.text, marginLeft: 4 },
                ]}
              >
                {book?.rating} {separator()} 1004 trackings
              </Text>
            </View>
            <View style={styles.socialsContainer}>
              <Pressable
                onPressIn={() => {
                  reviewsOpacity.value = withTiming(0.7, { duration: 100 });
                  reviewsScale.value = withTiming(0.95, { duration: 100 });
                }}
                onPressOut={() => {
                  reviewsOpacity.value = withTiming(1, { duration: 100 });
                  reviewsScale.value = withTiming(1, { duration: 100 });
                }}
                onPress={() => console.log('Reviews pressed')}
                style={{ flex: 1 }}
              >
                <Animated.View style={[styles.socialAction, { backgroundColor: colors.card }, reviewsAnimatedStyle]}>
                  <Ionicons name="chatbox-ellipses-outline" size={24} color={colors.text} />
                  <Text style={[typography.socialButton, { color: colors.text, marginTop: 16 }]}>Reviews</Text>
                </Animated.View>
              </Pressable>

              <Pressable
                onPressIn={() => {
                  listsOpacity.value = withTiming(0.7, { duration: 100 });
                  listsScale.value = withTiming(0.95, { duration: 100 });
                }}
                onPressOut={() => {
                  listsOpacity.value = withTiming(1, { duration: 100 });
                  listsScale.value = withTiming(1, { duration: 100 });
                }}
                onPress={() => console.log('Lists pressed')}
                style={{ flex: 1 }}
              >
                <Animated.View style={[styles.socialAction, { backgroundColor: colors.card }, listsAnimatedStyle]}>
                  <Ionicons name="list" size={24} color={colors.text} />
                  <Text style={[typography.socialButton, { color: colors.text, marginTop: 16 }]}>Listes</Text>
                </Animated.View>
              </Pressable>
            </View>
          </View>
          {/* Recommendations */}
          <View style={[styles.recommendationsContainer, { borderColor: colors.border }]}>
            <Text style={[typography.categoryTitle, { color: colors.text }]}>
              Les utilisateurs suivent aussi
            </Text>
            {dummyRecommendations && (
              <View style={{ marginHorizontal: -16 }}>
                <CategorySlider category={dummyRecommendations} isBottomSheetVisible={false} header={false} />
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Blur gradient mask under the button (100% blur bottom → 0% blur top) */}
      <View pointerEvents="none" style={[
        styles.blurGradientContainer,
        { bottom: 0, height: insets.bottom + 16 + 40 },
      ]}>
        <MaskedView
          style={StyleSheet.absoluteFillObject}
          maskElement={
            <LinearGradient
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              colors={[ '#fff', 'transparent' ]}
              style={StyleSheet.absoluteFillObject}
            />
          }
        >
          <BlurView intensity={100} tint={currentTheme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFillObject} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
        </MaskedView>
      </View>

      {/* Animated Button Container (Handles slide-up and initial scale) */}
      <Animated.View
        style={[
          styles.buttonContainer,
          { bottom: insets.bottom + 16 },
          animatedButtonStyle,
        ]}
      >
        {/* Animated Wrapper for Pressable (Handles press scale) */}
        <Animated.View style={[animatedPressStyle]}>
          <Pressable
            style={[styles.button]}
            onPress={() => router.push({pathname: "/book/tracking-settings", params: {bookId: book?.id}})}
            onPressIn={() => {
              pressScale.value = withTiming(0.97, { duration: 100 });
            }}
            onPressOut={() => {
              pressScale.value = withTiming(1, { duration: 100 });
            }}
          >
            <LinearGradient
              colors={[colors.primary, "#8A2BE2"]}
              style={[
                styles.gradient,
                { borderRadius: styles.button.borderRadius },
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.buttonText, typography.button]}>
                Gérer le suivi
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  detailsContainer: {
    marginTop: 16, // Add some margin if needed between image and details
    paddingBottom: 128,
  },
  shadowContainer: {
    width: 202.5,
    height: 303.75,
    alignSelf: "center",
    borderRadius: 6,
    shadowColor:
      Platform.OS === "android" ? "rgba(0, 0, 0, 0.589)" : "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
    marginTop: 16,
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    overflow: "hidden",
  },
  imageContent: {
    width: 202.5,
    height: 303.75,
    borderRadius: 6,
    resizeMode: "cover",
  },
  overlayCanvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 202.5,
    height: 303.75,
    borderRadius: 6,
    overflow: "hidden",
  },
  title: {
    marginBottom: 4,
  },
  titleTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  author: {
    marginBottom: 4,
  },
  trackingContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  infosContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  // Styles for the animated button
  buttonContainer: {
    position: "absolute",
    left: 16, // Match container padding
    right: 16, // Match container padding
    // bottom is set dynamically using insets
  },
  button: {
    // Remove padding, Pressable now only defines shape/shadow/overflow
    // paddingVertical: 14,
    // paddingHorizontal: 24,
    borderRadius: 25,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    shadowColor:
      Platform.OS === "android" ? "rgba(0, 0, 0, 0.589)" : "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden", // Keep this to clip gradient to borderRadius
  },
  gradient: {
    // Remove absolute fill, gradient now defines inner layout + padding
    // ...StyleSheet.absoluteFillObject,
    paddingVertical: 14, // Keep padding here
    paddingHorizontal: 24, // Keep padding here
    alignSelf: "stretch", // Add this to make gradient stretch
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    backgroundColor: "transparent",
  },
  descriptionContainer: {
    marginTop: 16,
    position: "relative", // Needed for absolute positioning of the overlay
    // overflow: 'hidden', // Moved to animated style
  },
  fadeOverlay: {
    // Style for the fade effect
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 30, // Adjust height as needed for the fade effect
  },
  toggleButton: {
    marginTop: 8,
    alignSelf: "flex-start", // Align to left or center as needed
  },
  toggleButtonText: {
    textDecorationLine: "underline",
  },
  ratingsContainer: {
    borderTopWidth: 1,
    flexDirection: "column",
    marginTop: 24,
    paddingTop: 24,
  },
  socialsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  socialAction: {
    flex: 1,
    padding: 12,
    backgroundColor: "red",
    borderRadius: 10,
    shadowColor:
      Platform.OS === "android" ? "rgba(0, 0, 0, 0.589)" : "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  recommendationsContainer: {
    borderTopWidth: 1,
    flexDirection: "column",
    marginTop: 24,
    paddingTop: 24,
  },
  blurGradientContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  gradientMask: {
    ...StyleSheet.absoluteFillObject,
  },
});
