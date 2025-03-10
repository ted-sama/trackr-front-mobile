import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  Image, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  StyleSheet, 
  Animated, 
  Dimensions,
  TextInput,
  PanResponder
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Manga, ReadingStatus } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface TrackingModalProps {
  visible: boolean;
  manga: Manga;
  onClose: () => void;
  onSave: (mangaId: string, status: ReadingStatus, currentChapter?: number) => void;
}

const { height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100; // distance de glissement pour fermer le modal

const TrackingModal = ({ visible, manga, onClose, onSave }: TrackingModalProps) => {
  const [status, setStatus] = useState<ReadingStatus>('reading');
  const [currentChapter, setCurrentChapter] = useState<string>('1');
  const [isClosing, setIsClosing] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const { colors } = useTheme();

  // Création du PanResponder pour gérer le glissement
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Permettre le glissement uniquement vers le bas avec un minimum de mouvement
        return gestureState.dy > 5;
      },
      onPanResponderGrant: () => {
        // Arrêter toute animation en cours quand l'utilisateur touche
        slideAnim.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        // Déplacer le modal en fonction du glissement (seulement vers le bas)
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Si le glissement dépasse le seuil, fermer le modal
        if (gestureState.dy > SWIPE_THRESHOLD) {
          closeWithAnimation();
        } else {
          // Sinon, remettre le modal à sa position initiale
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
      // Amélioration pour la compatibilité Expo Go
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    })
  ).current;

  // Fonction pour fermer avec animation
  const closeWithAnimation = () => {
    setIsClosing(true);
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsClosing(false);
      onClose();
    });
  };

  useEffect(() => {
    if (visible && !isClosing) {
      // Réinitialiser l'animation lors de l'ouverture
      slideAnim.setValue(height);
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8, // Pour un effet de rebond léger
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim, isClosing]);

  const handleStatusSelect = (newStatus: ReadingStatus) => {
    setStatus(newStatus);
  };

  const handleSave = () => {
    const chapter = status === 'reading' ? parseInt(currentChapter, 10) : undefined;
    onSave(manga.id, status, chapter);
    closeWithAnimation();
  };

  const handleClosePress = () => {
    closeWithAnimation();
  };

  const renderStatusButton = (buttonStatus: ReadingStatus, label: string, iconName: any) => {
    const isSelected = status === buttonStatus;
    
    return (
      <TouchableOpacity
        style={[
          styles.statusButton,
          { backgroundColor: isSelected ? colors.accent : colors.card },
        ]}
        onPress={() => handleStatusSelect(buttonStatus)}
      >
        <Ionicons 
          name={iconName} 
          size={18} 
          color={isSelected ? '#FFF' : colors.text} 
        />
        <Text
          style={[
            styles.statusButtonText,
            { color: isSelected ? '#FFF' : colors.text },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClosePress}
    >
      <TouchableWithoutFeedback onPress={handleClosePress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <Animated.View 
              style={[
                styles.container,
                { 
                  backgroundColor: colors.background,
                  transform: [{ translateY: slideAnim }]
                },
              ]}
            >
              {/* La poignée est l'élément principal sur lequel on fait glisser */}
              <View {...panResponder.panHandlers} style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
              
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Ajouter au suivi
                </Text>
                <TouchableOpacity onPress={handleClosePress}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.mangaInfo}>
                <Image 
                  source={{ uri: manga.coverImage }} 
                  style={styles.cover}
                />
                <View style={styles.textInfo}>
                  <Text style={[styles.mangaTitle, { color: colors.text }]}>
                    {manga.title}
                  </Text>
                  {manga.author && (
                    <Text style={[styles.mangaAuthor, { color: colors.secondaryText }]}>
                      {manga.author}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.statusSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Statut de lecture
                </Text>
                
                <View style={styles.statusButtons}>
                  {renderStatusButton('reading', 'En cours', 'book-outline')}
                  {renderStatusButton('plan_to_read', 'À commencer', 'time-outline')}
                  {renderStatusButton('dropped', 'Stoppé', 'stop-circle-outline')}
                </View>
              </View>

              {status === 'reading' && (
                <View style={styles.chapterSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Chapitre actuel
                  </Text>
                  <View style={[styles.chapterInputContainer, { backgroundColor: colors.card }]}>
                    <TextInput
                      style={[styles.chapterInput, { color: colors.text }]}
                      value={currentChapter}
                      onChangeText={setCurrentChapter}
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: colors.accent }]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>
                  Enregistrer
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 30,
    maxHeight: height * 0.85,
  },
  handleContainer: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mangaInfo: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  cover: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  textInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  mangaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mangaAuthor: {
    fontSize: 14,
  },
  statusSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  chapterSection: {
    marginBottom: 24,
  },
  chapterInputContainer: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chapterInput: {
    fontSize: 16,
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TrackingModal; 