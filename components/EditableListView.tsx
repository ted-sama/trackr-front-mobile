import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book, List } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useListStore } from '@/stores/listStore';
import DraggableList from './DraggableList';

interface EditableListViewProps {
  list: List;
  onToggleEdit?: () => void;
}

export const EditableListView: React.FC<EditableListViewProps> = ({
  list,
  onToggleEdit,
}) => {
  const { colors } = useTheme();
  const typography = useTypography();
  const [isEditing, setIsEditing] = useState(false);
  const { reorderBookInList, isLoading } = useListStore();

  const handleReorder = async (bookId: number, newPosition: number) => {
    try {
      await reorderBookInList(list.id, bookId, newPosition);
    } catch (error) {
      console.error('Erreur lors du réordonnancement:', error);
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    onToggleEdit?.();
  };

  const renderBookItem = (book: Book, index: number) => (
    <View style={[styles.bookItem, { backgroundColor: colors.card }]}>
      <Image
        source={{ uri: book.cover_image || 'https://via.placeholder.com/60x80' }}
        style={styles.bookCover}
        resizeMode="cover"
      />
      <View style={styles.bookInfo}>
        <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[typography.caption, { color: colors.secondaryText }]} numberOfLines={1}>
          {book.author}
        </Text>
        {book.tracking_status && (
          <Text style={[typography.caption, { color: colors.accent }]}>
            Chapitre {book.tracking_status.current_chapter || 0}
          </Text>
        )}
      </View>
      {isEditing && (
        <View style={styles.positionIndicator}>
          <Text style={[typography.caption, { color: colors.secondaryText }]}>
            #{index + 1}
          </Text>
        </View>
      )}
    </View>
  );

  if (!list.books || list.books.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[typography.body, { color: colors.secondaryText }]}>
          Aucun livre dans cette liste
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[typography.h1, { color: colors.text }]}>
          {list.name}
        </Text>
        <TouchableOpacity
          onPress={toggleEditMode}
          style={[styles.editButton, { backgroundColor: colors.accent }]}
          disabled={isLoading}
        >
          <Ionicons
            name={isEditing ? 'checkmark' : 'create-outline'}
            size={20}
            color={colors.background}
          />
          <Text style={[typography.caption, { color: colors.background, marginLeft: 4 }]}>
            {isEditing ? 'Terminer' : 'Modifier'}
          </Text>
        </TouchableOpacity>
      </View>

      {isEditing && (
        <View style={[styles.editingHint, { backgroundColor: colors.card }]}>
          <Ionicons name="information-circle" size={16} color={colors.accent} />
          <Text style={[typography.caption, { color: colors.secondaryText, marginLeft: 8 }]}>
            Maintenez et faites glisser les éléments pour les réorganiser
          </Text>
        </View>
      )}

      <DraggableList
        books={list.books}
        onReorder={handleReorder}
        renderItem={renderBookItem}
        isEditing={isEditing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editingHint: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookCover: {
    width: 50,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
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
});

export default EditableListView; 