import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  Image,
  TextInput,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSearchAnimation } from "../../contexts/SearchAnimationContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import { Book } from "@/types";
import BookListElement from "@/components/BookListElement";
import { LinearGradient } from 'expo-linear-gradient';
import { hexToRgba } from "@/utils/colors";

const { width, height } = Dimensions.get("window");

// Helper function to convert hex color to rgba
// function hexToRgba(hex: string, alpha: number): string {
//   let r = 0, g = 0, b = 0;
//   if (hex.length === 4) {
//     r = parseInt(hex[1] + hex[1], 16);
//     g = parseInt(hex[2] + hex[2], 16);
//     b = parseInt(hex[3] + hex[3], 16);
//   } else if (hex.length === 7) {
//     r = parseInt(hex[1] + hex[2], 16);
//     g = parseInt(hex[3] + hex[4], 16);
//     b = parseInt(hex[5] + hex[6], 16);
//   }
//   return `rgba(${r},${g},${b},${alpha})`;
// }

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    searchBarHeight,
    searchBarWidth,
    searchBarY,
    searchBarX,
    isSearchExpanded,
  } = useSearchAnimation();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");

  // Manga search
  const [bookSearch, setBookSearch] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchText.length > 0) {
      setIsLoading(true);
    } else {
      setBookSearch([]);
    }
  }, [searchText]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`https://0a2c-89-221-127-193.ngrok-free.app/api/search?q=${searchText}&type=books&limit=10&offset=0`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const booksData: Book[] = await response.json();
        setBookSearch(booksData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching books:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isLoading]);

  // Animation values
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const borderRadius = useSharedValue(25);
  const opacity = useSharedValue(0);
  useEffect(() => {
    // Initial position setup
    translateY.value = searchBarY.value;
    translateX.value = searchBarX.value;
    scaleX.value = 1;
    scaleY.value = 0;

    // Animate to final position
    isSearchExpanded.value = 1;
    translateY.value = withSpring(40);
    translateX.value = withSpring(20);
    scaleX.value = withSpring(1);
    scaleY.value = withSpring(1, {
      damping: 15,
      stiffness: 90,
    });
    borderRadius.value = withSpring(25);
    opacity.value = withTiming(1, { duration: 300 });

    // Cleanup
    return () => {
      isSearchExpanded.value = 0;
    };
  }, []);
  const animatedSearchContainerStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      left: translateX.value - 5,
      right: translateX.value - 5,
      height:
        searchBarHeight.value +
        (height - (searchBarHeight.value + 100)) * scaleY.value,
      borderRadius: borderRadius.value,
      transform: [{ scale: scaleX.value }],
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        {
          translateY: interpolate(scaleY.value, [0, 1], [0, height * 0.1]),
        },
      ],
    };
  });

  return (
    <View
      style={[
        styles.container,
        { marginTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <Animated.View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.background, borderColor: colors.border },
          animatedSearchContainerStyle,
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={[styles.searchContent, { borderColor: colors.border }]}>
            <Ionicons
              name="search"
              size={20}
              color={colors.secondaryText}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Commencez votre recherche"
              placeholderTextColor={colors.secondaryText}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchText("")}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.secondaryText}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.scrollViewContainer}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
              {bookSearch.map((book) => (
                <BookListElement
                  key={book.id}
                  book={book}
                  onPress={() => router.push(`/discover`)}
                />
              ))}
            </ScrollView>
            <LinearGradient
              colors={[hexToRgba(colors.background, 1), hexToRgba(colors.background, 0)]}
              style={styles.fadeTop}
              pointerEvents="none"
            />
            <LinearGradient
              colors={[hexToRgba(colors.background, 0), hexToRgba(colors.background, 1)]}
              style={styles.fadeBottom}
              pointerEvents="none"
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: "column",
    height: 52,
    borderRadius: 25,
    borderWidth: 1,
    shadowColor:
      Platform.OS === "android" ? "rgba(0, 0, 0, 0.589)" : "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
  searchContent: {
    flex: 1,
    backgroundColor: "rgba(109, 109, 109, 0.156)",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 8,
    zIndex: 1,
  },
  clearButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    fontWeight: "400",
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    borderBottomEndRadius: 25,
    borderBottomStartRadius: 25,
  },
  filterInput: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 14,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    paddingVertical: 15,
    marginTop: 20,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollViewContainer: {
    position: 'relative',
    flex: 1,
  },
  scrollViewContent: {
    paddingVertical: 20,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40, // Adjust height as needed
    zIndex: 2,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40, // Adjust height as needed
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    zIndex: 2,
  },
});
