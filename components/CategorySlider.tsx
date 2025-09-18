import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, FlatList } from 'react-native';
import { Category } from '@/types/category';
import BookCard from './BookCard';
import { useTheme } from '../contexts/ThemeContext';
import { router } from 'expo-router';
import { useTypography } from '@/hooks/useTypography';
import { ChevronRight } from 'lucide-react-native';

interface CategorySliderProps {
  category: Category;
  isBottomSheetVisible?: boolean;
  header?: boolean;
  seeMore?: boolean;
  ranked?: boolean;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.33;

const CategorySlider = ({ category, isBottomSheetVisible = false, header = true, seeMore = true, ranked = false }: CategorySliderProps) => {
  const { colors } = useTheme();
  const typography = useTypography();
  
  // Ensure books is always an array
  const books = useMemo(() => (Array.isArray(category?.books) ? category.books : []), [category?.books]);

  return (
    <View style={styles.categoryContainer}>
      {header && (
        <Pressable style={styles.categoryHeader} onPress={() => seeMore ? router.push({pathname: "/category-full", params: {id: category.id}}) : null}>
          <Text style={[styles.categoryTitle, typography.categoryTitle, { color: colors.text }]} numberOfLines={1}>
            {category.title}
          </Text>
          {seeMore ? <ChevronRight size={20} strokeWidth={2.5} color={colors.secondaryText} /> : null}
        </Pressable>
      )}
      <FlatList
        data={books.slice(0, seeMore ? undefined : 8)}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item, index }) => (
          <BookCard
            book={item}
            onPress={() => router.push({ pathname: "/book/[id]", params: { id: item.id } })}
            rank={ranked ? index + 1 : undefined}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sliderContent}
        style={{ height: CARD_WIDTH * 2.15 }}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        decelerationRate="fast"
        scrollEnabled={!isBottomSheetVisible}
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
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryTitle: {
    maxWidth: '95%',
  },
  sliderContent: {
    paddingLeft: 16,
    paddingRight: 16,
  },
});

export default React.memo(CategorySlider);