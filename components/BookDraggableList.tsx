import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { Book } from '@/types';

interface BookDraggableListProps {
  books: Book[];
  onDragEnd: (data: Book[]) => void;
  showDragHandle?: boolean;
  showPosition?: boolean;
  contentContainerStyle?: object;
}

export const BookDraggableList: React.FC<BookDraggableListProps> = ({
  books,
  onDragEnd,
  showDragHandle = true,
  showPosition = true,
  contentContainerStyle = {},
}) => {
  const { colors } = useTheme();
  const typography = useTypography();

  const handleDragEnd = useCallback(({ data }: { data: Book[] }) => {
    onDragEnd(data);
  }, [onDragEnd]);

  const renderBookItem = useCallback(({ item, drag, isActive }: RenderItemParams<Book>) => (
    <TouchableOpacity
      style={[
        styles.bookItem, 
        { backgroundColor: colors.card, borderColor: colors.border },
        isActive && styles.bookItemActive
      ]}
      onLongPress={showDragHandle ? drag : undefined}
      delayLongPress={150}
    >
      {showDragHandle && (
        <Image source={item.cover_image} style={styles.coverImage} />
      )}
      
      <View style={[styles.bookInfo, !showDragHandle && styles.bookInfoNoHandle]}>
        <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[typography.caption, { color: colors.secondaryText }]} numberOfLines={1}>
          {item.author}
        </Text>
        {item.tracking_status && (
          <Text style={[typography.caption, { color: colors.accent }]}>
            Chapitre {item.tracking_status.current_chapter || 0}
          </Text>
        )}
      </View>
      
      {showPosition && (
        <View style={styles.positionIndicator}>
          <Text style={[typography.caption, { color: colors.secondaryText }]}>
            {books.findIndex(book => book.id === item.id) + 1}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  ), [colors, typography, books, showDragHandle, showPosition]);

  if (books.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[typography.body, { color: colors.secondaryText }]}>
          Aucun livre dans cette liste
        </Text>
      </View>
    );
  }

  return (
    <DraggableFlatList
      data={books}
      onDragEnd={handleDragEnd}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderBookItem}
      contentContainerStyle={[{ paddingBottom: 20 }, contentContainerStyle]}
      showsVerticalScrollIndicator={true}
    />
  );
};

const styles = StyleSheet.create({
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  coverImage: {
    width: 42,
    height: 63,
    borderRadius: 4,
  },
  bookInfo: {
    flex: 1,
    marginLeft: 8,
  },
  bookInfoNoHandle: {
    marginLeft: 0,
  },
  positionIndicator: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  dragHandle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookItemActive: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
});

export default BookDraggableList; 