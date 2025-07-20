import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Book } from "@/types/book";
import { Category } from "@/types/category";
import { BookTracking } from "@/types/reading-status";
import {
  Text,
  StyleSheet,
  View,
  Platform,
  Pressable,
  ScrollView as DefaultScrollView,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
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
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import CategorySlider from "@/components/CategorySlider";
import { BlurView } from "expo-blur";
import MaskedView from "@react-native-masked-view/masked-view";
import SkeletonLoader from "@/components/skeleton-loader/SkeletonLoader";
import Badge from "@/components/ui/Badge";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import Toast from "react-native-toast-message";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import { Ellipsis, Minus, Plus, ChartPie } from "lucide-react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import BookActionsBottomSheet from "@/components/BookActionsBottomSheet";
import * as Haptics from "expo-haptics";
import { TrackingTabBar } from "@/components/book/TrackingTabBar";
import SetChapterBottomSheet from "@/components/book/SetChapterBottomSheet";
import ExpandableDescription from "@/components/ExpandableDescription";
import BadgeSlider from "@/components/BadgeSlider";
import { useBookDetailStore, BookDetailState } from "@/stores/bookDetailStore";
import RatingStars from "@/components/ui/RatingStars";
// Constants for animation
const HEADER_THRESHOLD = 320; // Threshold for header animation

// Rename ScrollView to AnimatedScrollView for Animated API usage
const AnimatedScrollView = Animated.createAnimatedComponent(DefaultScrollView);

export default function BookScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const [bottomSheetView, setBottomSheetView] = useState<
    "actions" | "status_editor" | "rating_editor"
  >("actions");
  const book = useBookDetailStore(
    (state: BookDetailState) => state.bookById[id as string] || null
  );
  const isLoading = useBookDetailStore(
    (state: BookDetailState) => state.isLoading
  );
  const error = useBookDetailStore((state: BookDetailState) => state.error);
  const fetchBook = useBookDetailStore(
    (state: BookDetailState) => state.fetchBook
  );
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const [dummyRecommendations, setDummyRecommendations] =
    useState<Category | null>(null);

  // Get the full BookTracking object
  const getTrackedBookStatus = useTrackedBooksStore(
    (state) => state.getTrackedBookStatus
  );
  const bookTracking = book ? getTrackedBookStatus(book.id) : null;

  // Bottom sheet ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const setChapterBottomSheetRef = useRef<BottomSheetModal>(null);
  // Animation setup for button
  const translateY = useSharedValue(150); // Initial off-screen position
  const scale = useSharedValue(0.1); // Initial small scale
  const pressScale = useSharedValue(1);

  // Shared value for scroll position
  const scrollY = useSharedValue(0);

  // State to store title Y position
  const [titleY, setTitleY] = useState(0);

  // Animation setup for description height

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

  // Style for press animation
  const animatedPressStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pressScale.value }],
    };
  });

  // Animated style for the header container (controls overall opacity including border/background)
  const animatedHeaderContainerStyle = useAnimatedStyle(() => {
    // Ensure titleY has been measured before calculating range
    const effectiveTitleY = titleY || HEADER_THRESHOLD; // Fallback if titleY is 0
    const opacity = interpolate(
      scrollY.value,
      [0, effectiveTitleY - 10], // Start fading from scroll 0, fully visible before title gone
      [0, 1], // Opacity from 0 to 1
      Extrapolate.CLAMP
    );

    return {
      opacity: opacity,
    };
  });

  // Animated style for the header title text
  const animatedHeaderTitleStyle = useAnimatedStyle(() => {
    const effectiveTitleY = titleY || HEADER_THRESHOLD;
    const opacity = interpolate(
      scrollY.value,
      [effectiveTitleY, effectiveTitleY + 40], // Start fading in *after* title is gone
      [0, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity: opacity,
    };
  });

  // Animated style for the back button background opacity (fades out as header fades in)
  const animatedBackButtonBackgroundOpacityStyle = useAnimatedStyle(() => {
    const effectiveTitleY = titleY || HEADER_THRESHOLD;
    const opacity = interpolate(
      scrollY.value,
      [0, effectiveTitleY - 10],
      [1, 0], // Inverse opacity: 1 (visible) -> 0 (invisible)
      Extrapolate.CLAMP
    );
    return {
      opacity: opacity,
    };
  });

  // Scroll handler to update scrollY
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const typeMap = {
    manga: "Manga",
    novel: "Roman",
    light_novel: "Light Novel",
    web_novel: "Web Novel",
    comic: "Comic",
    other: "Autre",
  };

  // Présenter le bottom sheet d'actions
  const handlePresentModalPress = useCallback(
    (view: "actions" | "status_editor" | "rating_editor") => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setBottomSheetView(view);
      bottomSheetModalRef.current?.present();
    },
    []
  );

  const handlePresentChapterModalPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChapterBottomSheetRef.current?.present();
  }, []);

  const IMAGE_WIDTH = 202.5;
  const IMAGE_HEIGHT = 303.75;

  const {
    addTrackedBook: addTrackedBookToStore,
    removeTrackedBook: removeTrackedBookFromStore,
    isBookTracked,
  } = useTrackedBooksStore();

  // State to control button rendering for animation
  const [isButtonRendered, setIsButtonRendered] = useState(false);

  useEffect(() => {
    if (id) {
        fetchBook(id as string);
    }
}, [id, fetchBook]);


  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
    if (book?.releaseYear && book?.endYear) {
      return `${book?.releaseYear} - ${book?.endYear}`;
    } else if (
      book?.releaseYear &&
      !book?.endYear &&
      book?.status === "ongoing"
    ) {
      return `${book?.releaseYear} - en cours`;
    }
    return book?.releaseYear;
  };

  const onTrackingToggle = async () => {
    if (!book) return;
    const currentBookIdStr = book.id.toString();

    if (isBookTracked(book.id)) {
      try {
        await removeTrackedBookFromStore(book.id);
        Toast.show({
          text1: "Livre retiré de votre bibliothèque",
          type: "info",
        });
      } catch (error) {
        console.warn(
          `Failed to remove book ${currentBookIdStr} from tracking:`,
          error
        );
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Impossible de retirer le livre.",
        });
      }
    } else {
      try {
        await addTrackedBookToStore(book);
        Toast.show({
          text1: "Livre ajouté à votre bibliothèque",
          type: "info",
        });
      } catch (error) {
        console.warn(
          `Failed to add book ${currentBookIdStr} to tracking:`,
          error
        );
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: `Impossible d'ajouter le livre.`,
        });
      }
    }
  };

  const handleRatingCardPress = () => {
    if (bookTracking) {
      handlePresentModalPress("rating_editor");
    } else {
      handlePresentModalPress("actions");
    }
  };

  const handleSummaryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/book/summary',
      params: {
        bookId: book?.id.toString(),
        bookTitle: book?.title
      }
    });
  };

  // TODO MAYBE: Implement chatbot
  const handleChatPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/book/chat',
      params: {
        bookId: book?.id.toString(),
        bookTitle: book?.title
      }
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["right", "left"]}
    >
      {/* Bottom Sheet Modal */}
      {book && (
        <>
          <BookActionsBottomSheet
            book={book}
            ref={bottomSheetModalRef}
            view={bottomSheetView}
            backdropDismiss
          />
          <SetChapterBottomSheet
            book={book}
            ref={setChapterBottomSheetRef}
            backdropDismiss
          />
        </>
      )}
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <AnimatedScrollView
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={styles.shadowContainer}>
          <View style={styles.imageContainer}>
            {isLoading ? (
              <SkeletonLoader width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />
            ) : (
              <Image
                source={{ uri: book?.coverImage }}
                style={styles.imageContent}
              />
            )}
          </View>
        </View>
        <View style={styles.detailsContainer}>
          {/* Title, author, type, dates and tracking button */}
          <View
            style={styles.titleTextContainer}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              // Use pageY if relative to screen, or y if relative to parent ScrollView
              setTitleY(layout.y); // Store the Y position relative to ScrollView
            }}
          >
            <View style={{ flex: 3 }}>
              {isLoading ? (
                <SkeletonLoader width={"90%"} height={40} />
              ) : (
                <Text
                  style={[styles.title, typography.h1, { color: colors.text }]}
                  numberOfLines={2}
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
                  {book?.type ? typeMap[book.type as keyof typeof typeMap] : ''}
                </Text>
                {separator()}
                <Text
                  style={[typography.caption, { color: colors.secondaryText }]}
                  numberOfLines={1}
                >
                  {dates()}
                </Text>
                {book?.chapters && (
                  <>
                    {separator()}
                    <Text style={[typography.caption, { color: colors.secondaryText }]}>
                      {book?.chapters} chapitres
                    </Text>
                  </>
                )}
              </View>
            </View>
            <View style={styles.actionsContainer}>
              <Pressable onPress={() => handlePresentModalPress("actions")}>
                <Ellipsis size={32} color={colors.icon} strokeWidth={2} />
              </Pressable>
              <TrackingIconButton
                size={32}
                isTracking={isBookTracked(book?.id!)}
                onPress={onTrackingToggle}
              />
            </View>
          </View>
          {/* Badge */}
          {book?.genres && book?.tags && (
            <View style={styles.badgeContainer}>
              <BadgeSlider
                data={[...(book.genres || []), ...(book.tags || [])]}
              />
            </View>
          )}
          {/* Description */}
          {book?.description && (
            <View>
              <ExpandableDescription text={book.description} />
            </View>
          )}
          {/* Ratings / Socials */}
          <View
            style={[styles.ratingsContainer, { borderColor: colors.border }]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="star" size={24} color={colors.primary} />
                <Text
                  style={[
                    typography.categoryTitle,
                    { color: colors.text, marginLeft: 4 },
                  ]}
                >
                  {book?.rating ? book?.rating : "N/A"}
                </Text>
              </View>
              {separator()}
              <Text
                style={[typography.caption, { color: colors.secondaryText }]}
              >
                {book?.ratingCount}{" "}
                {book?.ratingCount
                  ? book?.ratingCount > 1
                    ? "notes"
                    : "note"
                  : "note"}
              </Text>
            </View>
            <View style={styles.socialsContainer}>
              <Pressable
                onPressIn={() => {
                  reviewsOpacity.value = withTiming(0.7, { duration: 220 });
                  reviewsScale.value = withTiming(0.98, { duration: 220 });
                }}
                onPressOut={() => {
                  reviewsOpacity.value = withTiming(1, { duration: 220 });
                  reviewsScale.value = withTiming(1, { duration: 220 });
                }}
                onPress={handleRatingCardPress}
                style={{ flex: 1 }}
              >
                <Animated.View
                  style={[
                    styles.socialAction,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                    reviewsAnimatedStyle,
                  ]}
                >
                  {bookTracking?.rating && bookTracking?.rating > 0 ? (
                    <View>
                      <Text
                        style={[
                          typography.socialButton,
                          { color: colors.text, marginBottom: 6 },
                        ]}
                      >
                        Vous avez noté ce livre
                      </Text>
                      {bookTracking?.rating && (
                        <RatingStars
                          rating={bookTracking.rating}
                          size={14}
                          color={colors.text}
                        />
                      )}
                    </View>
                  ) : (
                    <Text
                      style={[
                        typography.socialButton,
                        { color: colors.secondaryText },
                      ]}
                    >
                      Ajoutez ce livre, suivez-le et notez-le
                    </Text>
                  )}
                </Animated.View>
              </Pressable>
            </View>
          </View>
          {/* Recommendations */}
          <View
            style={[
              styles.recommendationsContainer,
              { borderColor: colors.border },
            ]}
          >
            <Text style={[typography.categoryTitle, { color: colors.text }]}>
              Les utilisateurs suivent aussi
            </Text>
            {dummyRecommendations && (
              <View style={{ marginHorizontal: -16 }}>
                <CategorySlider
                  category={dummyRecommendations}
                  isBottomSheetVisible={false}
                  header={false}
                />
              </View>
            )}
          </View>
        </View>
      </AnimatedScrollView>

      {/* Animated Button Container (Handles slide-up and initial scale) */}
      {bookTracking && (
        <>
          {/* Blur gradient mask under the button (100% blur bottom → 0% blur top) */}
          <View
            pointerEvents="none"
            style={[
              styles.blurGradientContainer,
              { bottom: 0, height: insets.bottom + 16 + 40 },
            ]}
          >
            <MaskedView
              style={StyleSheet.absoluteFillObject}
              maskElement={
                <LinearGradient
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  colors={["#fff", "transparent"]}
                  style={StyleSheet.absoluteFillObject}
                />
              }
            >
              <BlurView
                intensity={100}
                tint={currentTheme === "dark" ? "dark" : "light"}
                style={StyleSheet.absoluteFillObject}
              />
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: "rgba(0,0,0,0.6)" },
                ]}
              />
            </MaskedView>
          </View>

          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
          >
            <TrackingTabBar
              status={bookTracking.status}
              currentChapter={bookTracking.currentChapter}
              onManagePress={() => handlePresentChapterModalPress()}
              onStatusPress={() => handlePresentModalPress("status_editor")}
              onRecapPress={() => router.push({
                pathname: '/book/recap',
                params: {
                  bookId: book?.id.toString(),
                  bookTitle: book?.title
                }
              })}
            />  
          </Animated.View>
        </>
      )}

      {/* Custom animated header */}
      <AnimatedHeader
        title={book?.title ?? ""}
        scrollY={scrollY}
        collapseThreshold={HEADER_THRESHOLD}
        onBack={() => router.back()}
        rightButton={bookTracking ? (
          <Pressable onPress={handleSummaryPress}>
            <ChartPie size={22} color={colors.icon} />
          </Pressable>
        ) : undefined}
      />
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
      Platform.OS === "android"
        ? "rgba(0, 0, 0, 0.589)"
        : "rgba(0, 0, 0, 0.18)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
    marginTop: 72,
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
  title: {
    marginRight: 32,
    marginBottom: 4,
  },
  titleTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  author: {
    marginBottom: 4,
  },
  actionsContainer: {
    height: 32,
    flexDirection: "row",
    gap: 12,
  },
  trackingContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  infosContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
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
    borderRadius: 16,
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
  gradientMask: {
    ...StyleSheet.absoluteFillObject,
  },
  // Header Styles
  headerContainerBase: {
    // Renamed base style for layout
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    // height and paddingTop are set inline
    // No background/border here
  },
  headerAnimatedBackground: {
    // Style for the view containing animated background/border
    overflow: "hidden", // Clip the BlurView/gradient
  },
  headerVisibleContent: {
    // Contains always-visible and animated visible elements
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, // Padding for left/right spacing
    // paddingTop applied inline
  },
  headerTitle: {
    flex: 1, // Take available space
    textAlign: "center", // Center text horizontally
    marginHorizontal: 8, // Add some space between title and potential icons/placeholders
  },
  backButton: {
    padding: 8, // Hit area
    // Positioned by flexbox in headerVisibleContent
    // Background color and borderRadius removed, handled by Animated.View inside
    // Ensure content (icon) is centered if needed, padding handles size
    justifyContent: "center",
    alignItems: "center",
    // Minimum size based on padding + icon size (approx)
    minWidth: 22 + 16,
    minHeight: 22 + 16,
    overflow: "hidden", // Clip the background Animated.View to the Pressable bounds
  },
  backButtonBackground: {
    borderRadius: 25, // Keep the rounding here
  },
  blurGradientContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
  },
});
