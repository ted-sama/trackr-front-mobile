import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Book } from "@/types"; // Category and BookTracking might be removed if not used directly
import {
  Text,
  Text,
  StyleSheet,
  View,
  Image,
  // Platform, // Removed
  Pressable,
  ScrollView as DefaultScrollView,
  // FlatList, // Removed
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
  // Easing, // Removed
  // withSpring, // Removed
  useAnimatedScrollHandler,
  // interpolate, // Removed (handled by AnimatedHeader)
  // Extrapolate, // Removed (handled by AnimatedHeader)
  FadeIn,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
// import { LinearGradient } from "expo-linear-gradient"; // Kept commented if needed later
import Ionicons from "@expo/vector-icons/Ionicons";
import CategorySlider from "@/components/CategorySlider";
// import { BlurView } from 'expo-blur'; // Kept commented if needed later
// import MaskedView from '@react-native-masked-view/masked-view'; // Kept commented if needed later
import SkeletonLoader from "@/components/skeleton-loader/SkeletonLoader";
import Badge from "@/components/ui/Badge";
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import Toast from "react-native-toast-message";
// Removed useTrackedBooksStore, will use useTrackingStore
import { Ellipsis } from "lucide-react-native"; // Minus, Plus might be removed if not used
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import BookActionsBottomSheet from "@/components/BookActionsBottomSheet";
import * as Haptics from "expo-haptics";
import { TrackingTabBar } from "@/components/book/TrackingTabBar";
import SetChapterBottomSheet from "@/components/book/SetChapterBottomSheet";
import ExpandableDescription from "@/components/ExpandableDescription";
import BadgeSlider from "@/components/BadgeSlider";
import { useBookStore } from "../../store/bookStore"; // Adjusted path
import { useTrackingStore } from "../../store/trackingStore"; // Adjusted path

// Constants for animation
const HEADER_THRESHOLD = 320; // Threshold for header animation

// Rename ScrollView to AnimatedScrollView for Animated API usage
const AnimatedScrollView = Animated.createAnimatedComponent(DefaultScrollView);

export default function BookScreen() {
  const { id: bookIdParam } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const [bottomSheetView, setBottomSheetView] = useState<"actions" | "status_editor">("actions");
  const { isBottomSheetVisible, setBottomSheetVisible } = useBottomSheet();
  const typography = useTypography();
  const insets = useSafeAreaInsets();

  const {
    currentBook: book,
    isLoadingBookDetail,
    errorBookDetail,
    recommendations,
    isLoadingRecommendations,
    errorRecommendations,
    fetchBookDetail,
    fetchRecommendations: fetchRecs, // Renamed to avoid conflict
    clearCurrentBook,
    clearRecommendations: clearRecs, // Renamed to avoid conflict
  } = useBookStore();

  const {
    isBookTracked,
    getTrackedBookStatus,
    addTrackedBook,
    removeTrackedBook,
    isUpdating,
    updateError,
  } = useTrackingStore();


  // Bottom sheet ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const setChapterBottomSheetRef = useRef<BottomSheetModal>(null);
  // Animation setup for button (translateY, scale, pressScale and their styles seem unused)
  // const translateY = useSharedValue(150); // Removed
  // const scale = useSharedValue(0.1); // Removed
  // const pressScale = useSharedValue(1); // Removed

  // Shared value for scroll position
  const scrollY = useSharedValue(0);

  // State to store title Y position
  const [titleY, setTitleY] = useState(0);

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

   // Fonction pour présenter le bottom sheet
   const handlePresentModalPress = useCallback((view: "actions" | "status_editor") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBottomSheetView(view);
    setBottomSheetVisible(true);
    bottomSheetModalRef.current?.present();
  }, [setBottomSheetVisible]);

  const handlePresentChapterModalPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBottomSheetVisible(true);
    setChapterBottomSheetRef.current?.present();
  }, [setBottomSheetVisible]);

  const IMAGE_WIDTH = 202.5;
  const IMAGE_HEIGHT = 303.75;

  const trackingStatus = book ? getTrackedBookStatus(book.id) : null;

  useEffect(() => {
    if (bookIdParam) {
      fetchBookDetail(bookIdParam);
      fetchRecs(bookIdParam); // Assuming fetchRecs uses bookIdParam
    }
    return () => {
      clearCurrentBook();
      clearRecs();
    };
  }, [bookIdParam, fetchBookDetail, fetchRecs, clearCurrentBook, clearRecs]);


  // Loading and error states from the store
  if (isLoadingBookDetail) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]} edges={["right", "left"]}>
        <SkeletonLoader width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />
        {/* Add more skeleton components for text details if desired */}
      </SafeAreaView>
    );
  }

  if (errorBookDetail) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]} edges={["right", "left"]}>
        <Text style={{ color: colors.text }}>{errorBookDetail}</Text>
      </SafeAreaView>
    );
  }
  
  if (!book) {
    // This case might occur if not loading and no error, but book is null (e.g., after clearing)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]} edges={["right", "left"]}>
        <Text style={{ color: colors.text }}>Livre non trouvé.</Text>
      </SafeAreaView>
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

  const onTrackingToggle = async () => {
    if (!book) return;
    const bookId = book.id; // Already a number

    // Show loading state for this specific book
    const specificBookIsUpdating = isUpdating[bookId]; 
    if (specificBookIsUpdating) return; // Prevent multiple clicks

    try {
      if (isBookTracked(bookId)) {
        await removeTrackedBook(bookId);
        Toast.show({
          text1: 'Livre retiré de votre bibliothèque',
          type: 'info',
        });
      } else {
        await addTrackedBook(book); // addTrackedBook from store expects the Book object
        Toast.show({
          text1: 'Livre ajouté à votre bibliothèque',
          type: 'info',
        });
      }
    } catch (err) {
      // Errors are handled by the store and reflected in updateError[bookId]
      const specificError = updateError[bookId];
      console.warn(`Failed to toggle tracking for book ${bookId}:`, err, specificError);
      Toast.show({
        type: 'error',
        text1: 'Erreur de suivi',
        text2: specificError || `Impossible de mettre à jour le suivi.`
      });
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["right", "left"]}
    >
      {/* Bottom Sheet Modal */}
      {book && (
        <>
          <BookActionsBottomSheet book={book} ref={bottomSheetModalRef} onDismiss={() => setBottomSheetVisible(false)} view={bottomSheetView} backdropDismiss />
          <SetChapterBottomSheet book={book} ref={setChapterBottomSheetRef} onDismiss={() => setBottomSheetVisible(false)} backdropDismiss />
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
            {/* isLoadingBookDetail is handled globally now, so direct SkeletonLoader here might be based on `!book` */}
            {!book ? (
              <SkeletonLoader width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />
            ) : (
              <Image source={{ uri: book.cover_image }} style={styles.imageContent} />
            )}
          </View>
        </View>
        <View style={styles.detailsContainer}>
          {/* Title, author, type, dates and tracking button */}
          <View
            style={styles.titleTextContainer}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              setTitleY(layout.y); 
            }}
          >
            <View style={{ flex: 3 }}>
              {!book ? (
                <SkeletonLoader width={'90%'} height={40} />
              ) : (
                <Text
                  style={[styles.title, typography.h1, { color: colors.text }]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {book.title}
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
            <View style={styles.actionsContainer}>
              <Pressable onPress={() => handlePresentModalPress("actions")}>
                <Ellipsis size={32} color={colors.icon} strokeWidth={2} />
              </Pressable>
              {book && ( // Ensure book is not null before rendering TrackingIconButton
                <TrackingIconButton
                  size={32}
                  isTracking={isBookTracked(book.id)}
                  isLoading={isUpdating[book.id]} // Pass loading state for this specific book
                  onPress={onTrackingToggle}
                />
              )}
            </View>
          </View>
          {/* Badge */}
          {book?.genres && book?.tags && (
            <View style={styles.badgeContainer}>
              <BadgeSlider data={[...(book.genres || []), ...(book.tags || [])]} />
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
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <Ionicons name="star" size={24} color={colors.primary} />
              <Text
                style={[
                  typography.categoryTitle,
                  { color: colors.text, marginLeft: 4 },
                ]}
              >
                {book?.rating} {separator()} 1004 trackings {/* Placeholder for tracking count */}
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
            {isLoadingRecommendations && <ActivityIndicator color={colors.primary} style={{ marginTop: 10}} />}
            {errorRecommendations && <Text style={{color: colors.destructive, marginTop: 10}}>{errorRecommendations}</Text>}
            {recommendations && recommendations.length > 0 && (
              <View style={{ marginHorizontal: -16 }}>
                {/* Assuming recommendations is an array of Book, and CategorySlider can handle Book[] or a Category with Book[] */}
                {/* If recommendations is Category[], map through it. If it's a single Category object with books, pass it directly. */}
                {/* Based on bookStore, recommendations is Book[], so we might need a wrapper Category or adjust CategorySlider */}
                {/* For now, assuming CategorySlider can take a { title: "Recommendations", books: recommendations } like structure */}
                <CategorySlider category={{ id: 'recs', title: 'Recommandations', books: recommendations }} isBottomSheetVisible={false} header={false} />
              </View>
            )}
          </View>
        </View>
      </AnimatedScrollView>

      {/* Animated Button Container (Handles slide-up and initial scale) */}
      {trackingStatus && !isBottomSheetVisible && book && ( // Ensure book is not null for TrackingTabBar
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
          <TrackingTabBar
            status={trackingStatus.status}
            currentChapter={trackingStatus.current_chapter} // Ensure these fields are available on trackingStatus
            onManagePress={() => handlePresentChapterModalPress()}
            onStatusPress={() => handlePresentModalPress("status_editor")}
          />
        </Animated.View>
      )}

      {/* Custom animated header */}
      <AnimatedHeader
        title={book?.title ?? ''}
        scrollY={scrollY}
        collapseThreshold={HEADER_THRESHOLD}
        onBack={() => router.back()}
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
      Platform.OS === "android" ? "rgba(0, 0, 0, 0.589)" : "rgba(0, 0, 0, 0.18)",
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
  headerContainerBase: { // Renamed base style for layout
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // height and paddingTop are set inline
    // No background/border here
  },
  headerAnimatedBackground: { // Style for the view containing animated background/border
    overflow: 'hidden', // Clip the BlurView/gradient
  },
  headerVisibleContent: { // Contains always-visible and animated visible elements
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, // Padding for left/right spacing
    // paddingTop applied inline
  },
  headerTitle: {
    flex: 1, // Take available space
    textAlign: 'center', // Center text horizontally
    marginHorizontal: 8, // Add some space between title and potential icons/placeholders
  },
  backButton: {
    padding: 8, // Hit area
    // Positioned by flexbox in headerVisibleContent
    // Background color and borderRadius removed, handled by Animated.View inside
    // Ensure content (icon) is centered if needed, padding handles size
    justifyContent: 'center',
    alignItems: 'center',
    // Minimum size based on padding + icon size (approx)
    minWidth: 22 + 16,
    minHeight: 22 + 16,
    overflow: 'hidden', // Clip the background Animated.View to the Pressable bounds
  },
  backButtonBackground: {
    borderRadius: 25, // Keep the rounding here
  },
});
