import React, { useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Category, Manga } from '../types';
import { Ionicons } from '@expo/vector-icons';
import MangaCard from './MangaCard';
import { useTheme } from '../contexts/ThemeContext';

interface CategorySliderProps {
  category: Category;
  onSeeAllPress?: (categoryId: string) => void;
  onTrackingRequest?: (manga: Manga) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.33;
const ITEM_MARGIN_RIGHT = 12;
const CONTAINER_PADDING_LEFT = 16;
const ITEM_WIDTH = CARD_WIDTH + ITEM_MARGIN_RIGHT;

const CategorySlider = ({ category, onSeeAllPress, onTrackingRequest }: CategorySliderProps) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.categoryContainer}>
      <View style={styles.categoryHeader}>
        <Text style={[styles.categoryTitle, { color: colors.text }]}>
          {category.title}
        </Text>
        <TouchableOpacity 
          style={styles.seeAllButtonContainer}
          onPress={() => onSeeAllPress 
            ? onSeeAllPress(category.id) 
            : console.log(`Voir tout: ${category.title}`)}
        >
          <Text style={[styles.seeAllButtonText, { color: colors.accent }]}>
            Voir tout
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color={colors.accent} 
            style={styles.buttonIcon} 
          />
        </TouchableOpacity>
      </View>
      <FlatList
        data={category.mangas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MangaCard 
            manga={item} 
            onTrackingRequest={onTrackingRequest}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sliderContent}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        snapToAlignment="start"
        snapToOffsets={category.mangas.map((_, index) => {
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
    fontWeight: 'bold',
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