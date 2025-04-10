import React from 'react';
import { Text, View, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const opacity = useSharedValue(0); // Pour l'animation d'entrée

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 }); // Fade in
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: colors.background }, animatedStyle]}
    >
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.secondaryText}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Destination"
          placeholderTextColor={colors.secondaryText}
          style={[styles.input, { color: colors.text }]}
          autoFocus={true}
        />
      </View>

      <TextInput
        placeholder="Dates"
        placeholderTextColor={colors.secondaryText}
        style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
      />
      <TextInput
        placeholder="Nombre d'invités"
        placeholderTextColor={colors.secondaryText}
        style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
      />

      <Pressable style={[styles.searchButton, { backgroundColor: colors.primary }]}>
        <Ionicons name="search" size={20} color="#fff" />
        <Text style={styles.searchButtonText}>Rechercher</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 12,
    width: '100%',
    shadowColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.589)' : 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 14,
    fontWeight: '400',
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 15,
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
    marginLeft: 10,
  },
});