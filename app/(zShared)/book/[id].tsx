import React, { useCallback, useEffect, useRef, useState } from "react";
import { getPalette } from "@somesoap/react-native-image-palette";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Book } from "@/types/book";
import { BookTracking } from "@/types/reading-status";
import {
  Text,
  StyleSheet,
  View,
  Platform,
  Pressable,
  ScrollView as DefaultScrollView,
  FlatList,
  Linking,
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
import { toast } from "sonner-native";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import { Ellipsis, Minus, Plus, ChartPie, Sparkles, MessageCircle, Heart, Circle, ExternalLink } from "lucide-react-native";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import {
  BookActionsBottomSheet,
  StatusEditorBottomSheet,
  RatingEditorBottomSheet,
  ListEditorBottomSheet,
} from "@/components/book-actions";
import CreateListBottomSheet from "@/components/CreateListBottomSheet";
import * as Haptics from "expo-haptics";
import { TrackingTabBar } from "@/components/book/TrackingTabBar";
import SetChapterBottomSheet from "@/components/book/SetChapterBottomSheet";
import ExpandableDescription from "@/components/ExpandableDescription";
import { useBook, useBooksBySameAuthorCategory } from "@/hooks/queries/books";
import { useMyBookReview } from "@/hooks/queries/reviews";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queries/keys";
import { useAuth } from "@/contexts/AuthContext";
import RatingStars from "@/components/ui/RatingStars";
import DotSeparator from "@/components/ui/DotSeparator";
import { useLocalization } from "@/hooks/useLocalization";
import { getLocalizedDescription } from "@/utils/description";
import { useTranslation } from "react-i18next";
import { useUserTop } from "@/hooks/queries/users";
import ConfettiCelebration, { ConfettiCelebrationMethods } from "@/components/ui/ConfettiCelebration";
import { ReviewsSection, WriteReviewBottomSheet } from "@/components/reviews";
// Constants for animation
const HEADER_THRESHOLD = 320; // Threshold for header animation
const DEFAULT_COVER_COLOR = '#6B7280'; // Grey color for missing covers

// Helper functions for external links
const getExternalUrl = (dataSource: string | undefined, externalId: number | undefined): string | null => {
  if (!externalId) return null;
  switch (dataSource) {
    case 'myanimelist':
      return `https://myanimelist.net/manga/${externalId}`;
    case 'anilist':
      return `https://anilist.co/manga/${externalId}`;
    case 'gcd':
      return `https://www.comics.org/series/${externalId}/`;
    default:
      return null;
  }
};

const getExternalLabel = (dataSource: string | undefined): string | null => {
  switch (dataSource) {
    case 'myanimelist':
      return 'MAL';
    case 'anilist':
      return 'AniList';
    case 'gcd':
      return 'GCD';
    default:
      return null;
  }
};

// Rename ScrollView to AnimatedScrollView for Animated API usage
const AnimatedScrollView = Animated.createAnimatedComponent(DefaultScrollView);

export default function BookScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const [dominantColor, setDominantColor] = useState<string | null>(null);
  const { data: book, isLoading, error } = useBook(id as string);
  const { data: booksBySameAuthor } = useBooksBySameAuthorCategory(id as string);
  const { data: favoriteBooks } = useUserTop();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { isFrench } = useLocalization();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Get user's existing review for this book (if any)
  const { data: myReview } = useMyBookReview(isAuthenticated && book ? book.id.toString() : undefined);

  // Get the full BookTracking object
  const getTrackedBookStatus = useTrackedBooksStore(
    (state) => state.getTrackedBookStatus
  );
  const bookTracking = book ? getTrackedBookStatus(book.id) : null;

  const isInFavorites = favoriteBooks?.some((favoriteBook) => favoriteBook.id === book?.id);

  // Bottom sheet refs
  const actionsSheetRef = useRef<TrueSheet>(null);
  const statusEditorSheetRef = useRef<TrueSheet>(null);
  const ratingEditorSheetRef = useRef<TrueSheet>(null);
  const listEditorSheetRef = useRef<TrueSheet>(null);
  const listCreatorSheetRef = useRef<TrueSheet>(null);
  const setChapterBottomSheetRef = useRef<TrueSheet>(null);
  const writeReviewSheetRef = useRef<TrueSheet>(null);
  // Confetti celebration ref
  const confettiRef = useRef<ConfettiCelebrationMethods>(null);
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

  // Gradient opacity animation
  const gradientOpacity = useSharedValue(0);
  
  const gradientAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: gradientOpacity.value,
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

  // Constants for gradient calculation (moved here before elastic style)
  const IMAGE_WIDTH = 202.5;
  const IMAGE_HEIGHT = 303.75;
  const gradientHeight = 200 + IMAGE_HEIGHT * 0.5;

  // Animated style for elastic gradient effect
  const gradientElasticStyle = useAnimatedStyle(() => {
    const GRADIENT_HEIGHT = gradientHeight;
    const scale = interpolate(
      scrollY.value,
      [-GRADIENT_HEIGHT, 0],
      [2, 1],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
      scrollY.value,
      [-GRADIENT_HEIGHT, 0],
      [-GRADIENT_HEIGHT / 2, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
    };
  });

  // Scroll handler to update scrollY
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Present bottom sheets
  const handlePresentActionsSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    actionsSheetRef.current?.present();
  }, []);

  const handlePresentStatusEditorSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    statusEditorSheetRef.current?.present();
  }, []);

  const handlePresentRatingEditorSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    ratingEditorSheetRef.current?.present();
  }, []);

  const handlePresentListEditorSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    listEditorSheetRef.current?.present();
  }, []);

  const handlePresentListCreatorSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    listCreatorSheetRef.current?.present();
  }, []);

  const handlePresentChapterModalPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChapterBottomSheetRef.current?.present();
  }, []);

  const handlePresentWriteReviewSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    writeReviewSheetRef.current?.present();
  }, []);

  const handleReviewSuccess = useCallback(() => {
    if (book) {
      // Force refetch all review queries for this book
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookReviewsBase(book.id.toString()),
        refetchType: 'all',
      });
      // Also invalidate user's own review query
      queryClient.invalidateQueries({
        queryKey: queryKeys.myBookReview(book.id.toString()),
      });
    }
  }, [book, queryClient]);

  const {
    addTrackedBook: addTrackedBookToStore,
    removeTrackedBook: removeTrackedBookFromStore,
    isBookTracked,
    updateTrackedBook,
  } = useTrackedBooksStore();

  // Callback when book is completed - triggers celebration
  const handleBookCompleted = useCallback(() => {
    confettiRef.current?.celebrate();
    toast.success(t("toast.bookCompleted"));
  }, [t]);

  const incrementCurrentChapter = useCallback(() => {
    if (bookTracking && book) {
      const newChapter = bookTracking.currentChapter ? bookTracking.currentChapter + 1 : 1;
      const isCompleting = book.chapters !== null && book.chapters !== undefined && newChapter >= book.chapters;
      const wasAlreadyCompleted = bookTracking.status === 'completed';
      
      // Build update data - also set status to completed if reaching last chapter
      const updateData: { currentChapter: number; status?: 'completed' } = { currentChapter: newChapter };
      if (isCompleting) {
        updateData.status = 'completed';
      }
      
      updateTrackedBook(book.id, updateData);
      toast(t("toast.incrementChapter", { number: newChapter }));
      
      // Trigger celebration if completing
      if (isCompleting && !wasAlreadyCompleted) {
        handleBookCompleted();
      }
    }
  }, [bookTracking, book, updateTrackedBook, t, handleBookCompleted]);

  // State to control button rendering for animation
  const [isButtonRendered, setIsButtonRendered] = useState(false);

  useEffect(() => {
    // No imperative fetch; hooks above handle fetching based on id
  }, [id]);


  const hasCover = Boolean(book?.coverImage);

  useEffect(() => {
    if (book?.coverImage) {
      getPalette(book.coverImage).then(palette => setDominantColor(palette.vibrant));
    } else if (book) {
      // Use grey color when no cover image
      setDominantColor(DEFAULT_COVER_COLOR);
    }
  }, [book?.coverImage, book]);

  // Compute gradient color
  const gradientTopColor = (() => {
    return dominantColor;
  })();

  // Animate gradient opacity when gradient color is available
  useEffect(() => {
    if (gradientTopColor) {
      gradientOpacity.value = withTiming(0.45, { duration: 100 });
    }
  }, [gradientTopColor]);


  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.text }}>Une erreur est survenue</Text>
      </View>
    );
  }

  const dates = () => {
    if (book?.releaseYear && book?.endYear) {
      return `${book?.releaseYear} - ${book?.endYear}`;
    } else if (
      book?.releaseYear &&
      !book?.endYear &&
      book?.status === "ongoing"
    ) {
      return `${book?.releaseYear} - ${t("book.publicationStatus.ongoing")}`;
    }
    return book?.releaseYear;
  };

  const onTrackingToggle = async () => {
    if (!book) return;
    const currentBookIdStr = book.id.toString();

    if (isBookTracked(book.id.toString())) {
      try {
        await removeTrackedBookFromStore(book.id.toString());
        toast(t("toast.removedFromTracking"));
      } catch (error) {
        console.warn(
          `Failed to remove book ${currentBookIdStr} from tracking:`,
          error
        );
        toast.error(t("toast.errorRemovingFromTracking"));
      }
    } else {
      try {
        await addTrackedBookToStore(book);
        toast(t("toast.addedToTracking"));
      } catch (error) {
        console.warn(
          `Failed to add book ${currentBookIdStr} to tracking:`,
          error
        );
        toast.error(t("toast.errorAddingToTracking"));
      }
    }
  };

  const handleRatingCardPress = () => {
    if (bookTracking) {
      handlePresentRatingEditorSheet();
    } else {
      handlePresentActionsSheet();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["right", "left"]}
      >
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <DefaultScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
          {/* Skeleton for cover image */}
          <View style={[styles.shadowContainer, { marginTop: 72 }]}>
            <View style={styles.imageContainer}>
              <SkeletonLoader width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />
            </View>
          </View>

          {/* Skeleton for title and info section */}
          <View style={styles.detailsContainer}>
            <View style={styles.titleTextContainer}>
              <View style={{ flex: 3 }}>
                {/* Title skeleton - 2 lines */}
                <SkeletonLoader 
                  width="90%" 
                  height={28} 
                  style={{ marginBottom: 8 }} 
                />
                <SkeletonLoader 
                  width="70%" 
                  height={28} 
                  style={{ marginBottom: 12 }} 
                />
                
                {/* Author skeleton */}
                <SkeletonLoader 
                  width="50%" 
                  height={14} 
                  style={{ marginBottom: 4 }} 
                />
                
                {/* Info row skeleton */}
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <SkeletonLoader width={60} height={14} />
                  <SkeletonLoader width={80} height={14} />
                  <SkeletonLoader width={90} height={14} />
                </View>
              </View>
              
              {/* Action buttons skeleton */}
              <View style={styles.actionsContainer}>
                <SkeletonLoader 
                  width={32} 
                  height={32} 
                  style={{ borderRadius: 16 }} 
                />
                <SkeletonLoader 
                  width={32} 
                  height={32} 
                  style={{ borderRadius: 16 }} 
                />
              </View>
            </View>

            {/* Tags skeleton */}
            <View style={[styles.tagsContainer, { marginTop: 8 }]}>
              <SkeletonLoader 
                width={80} 
                height={28} 
                style={{ borderRadius: 14 }} 
              />
              <SkeletonLoader 
                width={100} 
                height={28} 
                style={{ borderRadius: 14 }} 
              />
              <SkeletonLoader 
                width={90} 
                height={28} 
                style={{ borderRadius: 14 }} 
              />
            </View>

            {/* Description skeleton */}
            <View style={styles.descriptionContainer}>
              <SkeletonLoader 
                width="100%" 
                height={14} 
                style={{ marginBottom: 6 }} 
              />
              <SkeletonLoader 
                width="100%" 
                height={14} 
                style={{ marginBottom: 6 }} 
              />
              <SkeletonLoader 
                width="100%" 
                height={14} 
                style={{ marginBottom: 6 }} 
              />
              <SkeletonLoader 
                width="80%" 
                height={14} 
              />
            </View>

            {/* Ratings section skeleton */}
            <View style={[styles.ratingsContainer, { borderColor: colors.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 }}>
                <SkeletonLoader 
                  width={24} 
                  height={24} 
                  style={{ borderRadius: 12 }} 
                />
                <SkeletonLoader 
                  width={40} 
                  height={20} 
                  style={{ marginLeft: 4 }} 
                />
                <View style={{ width: 4 }} />
                <SkeletonLoader width={80} height={14} />
              </View>
              
              <View style={styles.socialsContainer}>
                <SkeletonLoader 
                  width="100%" 
                  height={60} 
                  style={{ borderRadius: 10 }} 
                />
              </View>
            </View>

            {/* Recommendations section skeleton */}
            <View style={[styles.recommendationsContainer, { borderColor: colors.border }]}>
              <SkeletonLoader 
                width={180} 
                height={20} 
                style={{ marginBottom: 16 }} 
              />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <SkeletonLoader 
                  width={120} 
                  height={180} 
                  style={{ borderRadius: 6 }} 
                />
                <SkeletonLoader 
                  width={120} 
                  height={180} 
                  style={{ borderRadius: 6 }} 
                />
              </View>
            </View>
          </View>
        </DefaultScrollView>

        {/* Custom animated header skeleton */}
        <View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 44 + insets.top,
              paddingTop: insets.top,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            },
          ]}
        >
          <SkeletonLoader 
            width={38} 
            height={38} 
            style={{ borderRadius: 19 }} 
          />
          <SkeletonLoader 
            width={150} 
            height={20} 
            style={{ borderRadius: 4 }} 
          />
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["right", "left"]}
    >
      {/* Bottom Sheet Modals */}
      {book && (
        <>
          <BookActionsBottomSheet
            ref={actionsSheetRef}
            book={book}
            onEditStatusPress={handlePresentStatusEditorSheet}
            onRatePress={handlePresentRatingEditorSheet}
            onAddToListPress={handlePresentListEditorSheet}
          />
          <StatusEditorBottomSheet
            ref={statusEditorSheetRef}
            book={book}
            onBookCompleted={handleBookCompleted}
          />
          <RatingEditorBottomSheet
            ref={ratingEditorSheetRef}
            book={book}
          />
          <ListEditorBottomSheet
            ref={listEditorSheetRef}
            book={book}
            onCreateListPress={handlePresentListCreatorSheet}
          />
          <CreateListBottomSheet
            ref={listCreatorSheetRef}
          />
          <SetChapterBottomSheet
            book={book}
            ref={setChapterBottomSheetRef}
            key={bookTracking?.currentChapter}
            onBookCompleted={handleBookCompleted}
          />
          <WriteReviewBottomSheet
            ref={writeReviewSheetRef}
            bookId={book.id.toString()}
            bookTitle={book.title}
            userRating={bookTracking?.rating}
            existingReview={myReview}
            onSuccess={handleReviewSuccess}
          />
        </>
      )}
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <AnimatedScrollView
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {gradientTopColor && (
        <Animated.View
          style={[{
            position: "relative",
            width: "110%",
            height: gradientHeight,
            alignSelf: "center",
            marginHorizontal: -16,
            marginTop: 0,
            zIndex: -99,
          }, gradientAnimatedStyle, gradientElasticStyle]}
        >
          <LinearGradient
            colors={[gradientTopColor, colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ width: "100%", height: "100%" }}
          />
        </Animated.View>
      )}
        <View style={[styles.shadowContainer, { marginTop: gradientTopColor ? -gradientHeight + 72 : 72 }]}>
          <View style={styles.imageContainer}>
            {hasCover ? (
              <Image
                source={{ uri: book?.coverImage }}
                style={styles.imageContent}
              />
            ) : (
              <View style={[styles.imageContent, styles.noCoverContainer, { backgroundColor: DEFAULT_COVER_COLOR }]}>
                <Ionicons name="book-outline" size={48} color="rgba(255,255,255,0.5)" />
              </View>
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
              <Text
                style={[styles.title, typography.h1, { color: colors.text }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {book?.title}
              </Text>
              <Text
                style={[
                  styles.author,
                  typography.caption,
                  { color: colors.secondaryText },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {book?.type === "comic"
                  ? book?.publishers?.map((pub) => pub.name).join(", ")
                  : book?.authors?.map((author) => author.name).join(", ")}
              </Text>
              <View style={[styles.infosContainer]}>
                <Text
                  style={[typography.caption, { color: colors.secondaryText }]}
                  numberOfLines={1}
                >
                  {t("common.bookTypes." + book?.type)}
                </Text>
                <DotSeparator />
                <Text
                  style={[typography.caption, { color: colors.secondaryText }]}
                  numberOfLines={1}
                >
                  {dates()}
                </Text>
                {book?.chapters && (
                  <>
                    <DotSeparator />
                    <Text style={[typography.caption, { color: colors.secondaryText }]}>
                      {book?.type === "comic"
                        ? `${book?.chapters} ${book?.chapters === 1 ? t("common.issue") : t("common.issues")}`
                        : `${book?.chapters} ${book?.chapters === 1 ? t("common.chapter") : t("common.chapters")}`}
                    </Text>
                  </>
                )}
              </View>
              {isInFavorites && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
                    <Heart size={14} fill={colors.favorite} color={colors.favorite} />
                    <Text style={[typography.caption, { color: colors.secondaryText }]}>
                      {t("book.inYourFavorites")}
                    </Text>
                  </View>
                )}
            </View>
            <View style={styles.actionsContainer}>
              <Pressable onPress={handlePresentActionsSheet}>
                <Ellipsis size={32} color={colors.icon} strokeWidth={2} />
              </Pressable>
              <TrackingIconButton
                size={32}
                isTracking={isBookTracked(book?.id!)}
                onPress={onTrackingToggle}
              />
            </View>
          </View>
          {/* Tags */}
          {book?.genres && (
            <View style={styles.tagsContainer}>
              {book.genres.map((tag) => (
                <Badge
                  key={tag}
                  text={tag}
                  color={colors.badgeText}
                  backgroundColor={colors.badgeBackground}
                  borderColor={colors.badgeBorder}
                />
              ))}
            </View>
          )}
          {/* Description */}
          {book && getLocalizedDescription(book, isFrench) && (
            <View style={styles.descriptionContainer}>
              {isFrench && (
                <View style={{ flex: 1, marginBottom: 6, flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Sparkles size={16} fill={colors.secondaryText} color={colors.secondaryText} />
                  <Text style={[typography.caption, { color: colors.secondaryText }]}>
                    {t("book.translatedByIA")}
                  </Text> 
                </View>
              )}
              <ExpandableDescription text={getLocalizedDescription(book, isFrench)!} />
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
                <Ionicons name="star" size={24} color={colors.accent} />
                <Text
                  style={[
                    typography.categoryTitle,
                    { color: colors.text, marginLeft: 4 },
                  ]}
                >
                  {book?.rating ? book?.rating : "N/A"}
                </Text>
              </View>
              <DotSeparator />
              <Text
                style={[typography.caption, { color: colors.secondaryText }]}
              >
                {book?.ratingCount}{" "}
                {book?.ratingCount
                  ? book?.ratingCount > 1
                    ? t("book.rating") + "s"
                    : t("book.rating")
                  : t("book.rating")}
              </Text>
              <DotSeparator />
              <Text
                style={[typography.caption, { color: colors.secondaryText }]}
              >
                {book?.trackingCount}{" "}
                {book?.trackingCount && book?.trackingCount > 1 ? t("book.tracking") + "s" : t("book.tracking")}
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
                        {t("book.youRatedIt")}
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
                      {t("book.rateIt")}
                    </Text>
                  )}
                </Animated.View>
              </Pressable>
            </View>
          </View>
          {/* Reviews Section */}
          {book && (
            <ReviewsSection 
              bookId={book.id.toString()} 
              isTracking={Boolean(bookTracking)}
              onWriteReviewPress={handlePresentWriteReviewSheet}
            />
          )}
          {/* Recommendations */}
          {booksBySameAuthor && booksBySameAuthor.books.length > 0 && (
            <View
              style={[
                styles.recommendationsContainer,
                { borderColor: colors.border },
              ]}
            >
              <Text style={[typography.categoryTitle, { color: colors.text }]}>
                {book?.type === "comic" ? t("book.byTheSamePublisher") : t("book.byTheSameAuthor")}
              </Text>
              <View style={{ marginHorizontal: -16 }}>
                <CategorySlider
                  category={booksBySameAuthor}
                  isBottomSheetVisible={false}
                  header={false}
                />
              </View>
            </View>
          )}
          {/* External Link */}
          {book?.dataSource && book?.externalId && getExternalUrl(book.dataSource, book.externalId) && (
            <View
              style={[
                styles.externalLinkContainer,
                { borderColor: colors.border },
              ]}
            >
              <Text style={[typography.caption, { color: colors.secondaryText }]}>
                {t("book.openIn")}
              </Text>
              <Pressable
                onPress={() => {
                  const url = getExternalUrl(book.dataSource, book.externalId);
                  if (url) Linking.openURL(url);
                }}
                style={[
                  styles.externalLinkButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[typography.socialButton, { color: colors.text }]}>
                  {getExternalLabel(book.dataSource)}
                </Text>
                <ExternalLink size={14} color={colors.secondaryText} />
              </Pressable>
            </View>
          )}
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
              bookType={book?.type ?? "manga"}
              status={bookTracking.status}
              currentChapter={bookTracking.currentChapter}
              onBookmarkPress={() => handlePresentChapterModalPress()}
              onMarkLastChapterAsReadPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                incrementCurrentChapter();
              }}
              markLastChapterAsReadDisabled={bookTracking.currentChapter !== null && bookTracking.currentChapter === book?.chapters}
              onStatusPress={handlePresentStatusEditorSheet}
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
        rightButtonIcon={bookTracking ? <MessageCircle size={24} fill={dominantColor ?? colors.background} color={dominantColor ?? colors.background} style={{ opacity: 0.85 }} /> : undefined}
        onRightButtonPress={bookTracking ? () => router.push(`/chat/${book?.id}`) : undefined}
      />

      {/* Confetti celebration overlay */}
      <ConfettiCelebration ref={confettiRef} />
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
  noCoverContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginRight: 32,
    marginBottom: 12,
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
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 48,
    gap: 4,
  },
  descriptionContainer: {
    marginTop: 8,
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
    borderRadius: 10,
    // Shadow iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    // Shadow Android
    elevation: 2,
  },
  recommendationsContainer: {
    borderTopWidth: 1,
    flexDirection: "column",
    marginTop: 24,
    paddingTop: 24,
  },
  externalLinkContainer: {
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 24,
  },
  externalLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
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
