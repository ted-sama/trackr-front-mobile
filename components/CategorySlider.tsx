import React, { useRef } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet, Dimensions, Pressable } from 'react-native';
import { LegendList } from '@legendapp/list';
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
  onTrackingToggle?: (bookId: string, isTracking: boolean) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.33;
const ITEM_MARGIN_RIGHT = 12;
const CONTAINER_PADDING_LEFT = 16;
const ITEM_WIDTH = CARD_WIDTH + ITEM_MARGIN_RIGHT;

const CategorySlider = ({ category, onSeeAllPress, isBottomSheetVisible = false, header = true, onTrackingToggle }: CategorySliderProps) => {
  const { colors } = useTheme();
  const typography = useTypography();
  
  // Ensure books is always an array
  const books = Array.isArray(category?.books) ? category.books : [];

  return (
    <View style={styles.categoryContainer}>
      {header && (
        <View style={styles.categoryHeader}>
        <Text style={[styles.categoryTitle, typography.categoryTitle, { color: colors.text }]} numberOfLines={1}>
          {category.title}
        </Text>
        <TouchableWithoutFeedback
          onPress={() => onSeeAllPress 
            ? onSeeAllPress(category.id) 
            : console.log(`Voir tout: ${category.title}`)}
        >
          <Pressable style={styles.seeAllButtonContainer} onPress={() => router.push({pathname: "/category-full", params: {id: category.id}})}>
            <Text style={[styles.seeAllButtonText, { color: colors.accent }]} numberOfLines={1}>
              Voir tout
            </Text>
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color={colors.accent} 
              style={styles.buttonIcon} 
            />
          </Pressable>
        </TouchableWithoutFeedback>
      </View>
      )}
      <LegendList
        data={books.slice(0, 8)}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => <BookCard book={item} onPress={() => router.push({pathname: "/book/[id]", params: {id: item.id}})} onTrackingToggle={onTrackingToggle} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sliderContent}
        style={{ height: CARD_WIDTH * 2.15 }}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        decelerationRate="fast"
        scrollEnabled={!isBottomSheetVisible}
        recycleItems
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
    maxWidth: '70%',
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
    paddingRight: 16,
  },
});

export default React.memo(CategorySlider);