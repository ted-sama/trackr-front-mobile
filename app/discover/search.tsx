import React, { useEffect } from 'react';
import { Text, View, TextInput, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { useSearchAnimation } from '../../contexts/SearchAnimationContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

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

  // Animation values
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const borderRadius = useSharedValue(25);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Calculer les transformations initiales
    translateY.value = searchBarY.value;
    translateX.value = searchBarX.value;
    scaleX.value = searchBarWidth.value / width;
    scaleY.value = searchBarHeight.value / 52;
    
    // Animer vers la position finale
    isSearchExpanded.value = 1;
    translateY.value = withSpring(0);
    translateX.value = withSpring(0);
    scaleX.value = withSpring(1);
    scaleY.value = withSpring(1);
    borderRadius.value = withSpring(25);
    opacity.value = withTiming(1, { duration: 200 });

    // Cleanup
    return () => {
      isSearchExpanded.value = 0;
    };
  }, []);

  const animatedSearchContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { scaleX: scaleX.value },
        { scaleY: scaleY.value },
      ],
      borderRadius: borderRadius.value,
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.background, borderColor: colors.border },
          animatedSearchContainerStyle,
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <TextInput
          placeholder="Rechercher un manga..."
          placeholderTextColor={colors.secondaryText}
          style={[styles.input, { color: colors.text }]}
          autoFocus={true}
        />
      </Animated.View>

      <Animated.View style={[styles.content, animatedContentStyle]}>
        <TextInput
          placeholder="Filtrer par genre"
          placeholderTextColor={colors.secondaryText}
          style={[styles.filterInput, { color: colors.text, backgroundColor: colors.background }]}
        />
        <TextInput
          placeholder="Année de sortie"
          placeholderTextColor={colors.secondaryText}
          style={[styles.filterInput, { color: colors.text, backgroundColor: colors.background }]}
        />

        <Pressable style={[styles.searchButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.searchButtonText}>Rechercher</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 12,
    margin: 20,
    marginTop: 40,
    shadowColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.589)' : 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '400',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 112, // searchContainer height + margins
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 15,
    marginTop: 20,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});