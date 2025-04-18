import React, { useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Dimensions } from 'react-native';
import { Category, Book } from '../types';
import { Ionicons } from '@expo/vector-icons';
import BookCard from './BookCard';
import { useTheme } from '../contexts/ThemeContext';
import { router } from 'expo-router';
import { useTypography } from '@/hooks/useTypography';

interface CategorySliderProps {
  category: Category;
  onSeeAllPress?: (categoryId: string) => void;
  isBottomSheetVisible?: boolean;
  header?: boolean;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.33;
const ITEM_MARGIN_RIGHT = 12;
const CONTAINER_PADDING_LEFT = 16;
const ITEM_WIDTH = CARD_WIDTH + ITEM_MARGIN_RIGHT;

const CategorySlider = ({ category, onSeeAllPress, isBottomSheetVisible = false, header = true }: CategorySliderProps) => {
  const { colors } = useTheme();
  const typography = useTypography();
  
  // Ensure books is always an array
  const books = Array.isArray(category?.books) ? category.books : [];

  return (
    <View style={styles.categoryContainer}>
      {header && (
        <View style={styles.categoryHeader}>
        <Text style={[styles.categoryTitle, typography.categoryTitle, { color: colors.text }]}>
          {category.title}
        </Text>
        <TouchableWithoutFeedback
          onPress={() => onSeeAllPress 
            ? onSeeAllPress(category.id) 
            : console.log(`Voir tout: ${category.title}`)}
        >
          <View style={styles.seeAllButtonContainer}>
            <Text style={[styles.seeAllButtonText, { color: colors.accent }]}>
              Voir tout
            </Text>
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color={colors.accent} 
              style={styles.buttonIcon} 
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
      )}
      <FlatList
        data={books}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => <BookCard book={item} onPress={() => router.push({pathname: "/book/[id]", params: {id: item.id}})} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sliderContent}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        snapToAlignment="start"
        scrollEnabled={!isBottomSheetVisible}
        snapToOffsets={books.map((_, index) => {
          return index * ITEM_WIDTH + CONTAINER_PADDING_LEFT - 12; // -12px to show the previous item
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  categoryContainer: {
    marginTop: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  buttonIcon: {
    fontSize: 14,
  },
  sliderContent: {
    paddingLeft: 16,
  },
});

export default React.memo(CategorySlider);