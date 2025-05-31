import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler,
  FadeInDown,
  FadeInUp 
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import { useListStore } from '@/stores/listStore';
import Button from '@/components/ui/Button';
import SecondaryButton from '@/components/ui/SecondaryButton';
import Badge from '@/components/ui/Badge';
import { X, Plus } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function ListEdit() {
  const { listId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  
  // Animation
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Store
  const list = useListStore(state => state.listsById[listId as string] || state.myListsById[listId as string]);
  const updateList = useListStore(state => state.updateList);
  const fetchList = useListStore(state => state.fetchList);
  const isLoading = useListStore(state => state.isLoading);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Load list data
  useEffect(() => {
    if (listId && !list) {
      fetchList(listId as string);
    }
  }, [listId, list, fetchList]);

  // Initialize form with list data
  useEffect(() => {
    if (list) {
      setName(list.name || '');
      setDescription(list.description || '');
      setTags(list.tags || []);
    }
  }, [list]);

  // Track changes
  useEffect(() => {
    if (list) {
      const nameChanged = name !== (list.name || '');
      const descriptionChanged = description !== (list.description || '');
      const tagsChanged = JSON.stringify(tags.sort()) !== JSON.stringify((list.tags || []).sort());
      setHasChanges(nameChanged || descriptionChanged || tagsChanged);
    }
  }, [name, description, tags, list]);

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Modifications non sauvegardées',
        'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Quitter', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      Haptics.selectionAsync();
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    Haptics.selectionAsync();
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Le nom de la liste est requis'
      });
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updateList(Number(listId), {
        name: name.trim(),
        description: description.trim() || null,
        tags: tags.length > 0 ? tags : null
      });
      
      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Liste mise à jour avec succès'
      });
      
      router.back();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de mettre à jour la liste'
      });
    }
  };

  const handleReset = () => {
    if (list) {
      setName(list.name || '');
      setDescription(list.description || '');
      setTags(list.tags || []);
    }
  };

  if (!list) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <AnimatedHeader
          title="Modifier la liste"
          scrollY={scrollY}
          onBack={handleBack}
        />
        <View style={styles.loadingContainer}>
          <Text style={[typography.body, { color: colors.secondaryText }]}>
            Chargement...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <AnimatedHeader
        title="Modifier la liste"
        scrollY={scrollY}
        onBack={handleBack}
      />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <AnimatedScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          onScroll={scrollHandler}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            entering={FadeInUp.duration(300).delay(100)}
            style={styles.formContainer}
          >
            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={[typography.h3, styles.label, { color: colors.text }]}>
                Nom de la liste
              </Text>
              <TextInput
                style={[
                  styles.input,
                  typography.body,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  }
                ]}
                placeholder="Entrez le nom de la liste"
                placeholderTextColor={colors.secondaryText}
                value={name}
                onChangeText={setName}
                maxLength={100}
                autoCapitalize="sentences"
                returnKeyType="next"
              />
            </View>

            {/* Description Field */}
            <View style={styles.fieldContainer}>
              <Text style={[typography.h3, styles.label, { color: colors.text }]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.descriptionInput,
                  typography.body,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  }
                ]}
                placeholder="Décrivez votre liste (optionnel)"
                placeholderTextColor={colors.secondaryText}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
                autoCapitalize="sentences"
                returnKeyType="default"
              />
            </View>

            {/* Tags Field */}
            <View style={styles.fieldContainer}>
              <Text style={[typography.h3, styles.label, { color: colors.text }]}>
                Tags
              </Text>
              
              {/* Add Tag Input */}
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.tagInput,
                    typography.body,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    }
                  ]}
                  placeholder="Ajouter un tag"
                  placeholderTextColor={colors.secondaryText}
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={addTag}
                  maxLength={30}
                  autoCapitalize="none"
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[styles.addTagButton, { backgroundColor: colors.primary }]}
                  onPress={addTag}
                  disabled={!newTag.trim()}
                >
                  <Plus size={20} color={colors.buttonText} />
                </TouchableOpacity>
              </View>

              {/* Tags Display */}
              {tags.length > 0 && (
                <Animated.View 
                  entering={FadeInDown.duration(300)}
                  style={styles.tagsContainer}
                >
                  {tags.map((tag, index) => (
                    <Animated.View 
                      key={tag}
                      entering={FadeInDown.duration(300).delay(index * 50)}
                      style={styles.tagItem}
                    >
                      <Badge
                        text={tag}
                        color={colors.text}
                        backgroundColor={colors.accent}
                        borderColor={colors.border}
                      />
                      <TouchableOpacity
                        style={styles.removeTagButton}
                        onPress={() => removeTag(tag)}
                      >
                        <X size={14} color={colors.secondaryText} />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </Animated.View>
              )}
            </View>
          </Animated.View>
        </AnimatedScrollView>

        {/* Action Buttons */}
        <Animated.View 
          entering={FadeInUp.duration(300).delay(200)}
          style={[styles.buttonContainer, { backgroundColor: colors.background }]}
        >
          <View style={styles.buttonRow}>
            <SecondaryButton
              title="Réinitialiser"
              onPress={handleReset}
              style={[styles.button, { opacity: hasChanges ? 1 : 0.5 }] as any}
              disabled={!hasChanges}
            />
            <Button
              title="Sauvegarder"
              onPress={handleSave}
              style={[styles.button, { opacity: hasChanges ? 1 : 0.5 }] as any}
              disabled={!hasChanges || isLoading}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 100, // Account for animated header
    paddingBottom: 120, // Account for button container
  },
  formContainer: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    paddingTop: 16,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeTagButton: {
    padding: 2,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
