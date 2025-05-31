import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { Book } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_HEIGHT = 80;

interface DraggableListProps {
  books: Book[];
  onReorder: (bookId: number, newPosition: number) => void;
  renderItem: (book: Book, index: number) => React.ReactNode;
  isEditing?: boolean;
}

interface DraggableItemProps {
  book: Book;
  index: number;
  onReorder: (bookId: number, newPosition: number) => void;
  renderItem: (book: Book, index: number) => React.ReactNode;
  isEditing: boolean;
  totalItems: number;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  book,
  index,
  onReorder,
  renderItem,
  isEditing,
  totalItems,
}) => {
  const { colors } = useTheme();
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const [isDragging, setIsDragging] = useState(false);

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startY: number }
  >({
    onStart: (_, context) => {
      context.startY = translateY.value;
      scale.value = withSpring(1.05);
      zIndex.value = 1000;
      runOnJS(setIsDragging)(true);
    },
    onActive: (event, context) => {
      translateY.value = context.startY + event.translationY;
    },
    onEnd: (event) => {
      const newIndex = Math.round(
        Math.max(
          0,
          Math.min(
            totalItems - 1,
            index + event.translationY / ITEM_HEIGHT
          )
        )
      );

      if (newIndex !== index) {
        runOnJS(onReorder)(book.id, newIndex + 1); // +1 because positions are 1-indexed
      }

      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
      runOnJS(setIsDragging)(false);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scale.value,
      [1, 1.05],
      [1, 0.9],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity,
      zIndex: zIndex.value,
      elevation: zIndex.value > 0 ? 5 : 0,
    };
  });

  if (!isEditing) {
    return <View style={styles.itemContainer}>{renderItem(book, index)}</View>;
  }

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.itemContainer, animatedStyle]}>
        <View style={[styles.dragHandle, { backgroundColor: colors.accent }]}>
          <Text style={[styles.dragHandleText, { color: colors.background }]}>
            ⋮⋮
          </Text>
        </View>
        <View style={styles.itemContent}>
          {renderItem(book, index)}
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};

export const DraggableList: React.FC<DraggableListProps> = ({
  books,
  onReorder,
  renderItem,
  isEditing = false,
}) => {
  return (
    <View style={styles.container}>
      {books.map((book, index) => (
        <DraggableItem
          key={book.id}
          book={book}
          index={index}
          onReorder={onReorder}
          renderItem={renderItem}
          isEditing={isEditing}
          totalItems={books.length}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ITEM_HEIGHT,
    marginVertical: 4,
  },
  dragHandle: {
    width: 30,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 8,
  },
  dragHandleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
  },
});

export default DraggableList; 