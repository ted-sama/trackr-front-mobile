import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import CategorySlider from '../components/CategorySlider';
import { CATEGORIES } from '../data/manga';
import { useTheme } from '../contexts/ThemeContext';
import { useBottomSheet } from '../contexts/BottomSheetContext';

// Composant principal pour la page Discover
export default function Discover() {
  const { colors, currentTheme } = useTheme();
  const { isBottomSheetVisible } = useBottomSheet();
  
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={['right', 'left']}
    >
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isBottomSheetVisible}
      >
        {CATEGORIES.map((category) => (
          <CategorySlider 
            key={category.id} 
            category={category}
            isBottomSheetVisible={isBottomSheetVisible} 
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20,
  },
}); 