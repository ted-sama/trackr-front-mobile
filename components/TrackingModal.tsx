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
  PanResponder,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Manga, ReadingStatus } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface TrackingModalProps {
  visible: boolean;
  manga: Manga;
  onClose: () => void;
  onSave: (mangaId: string, status: ReadingStatus, currentChapter?: number) => void;
}

const { height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 2000; // distance de glissement pour fermer le modal - réduit pour plus de sensibilité

const TrackingModal = ({ visible, manga, onClose, onSave }: TrackingModalProps) => {
  const [status, setStatus] = useState<ReadingStatus>('reading');
  const [currentChapter, setCurrentChapter] = useState<string>('1');
  const [isClosing, setIsClosing] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const { colors } = useTheme();
  const prevVisibleRef = useRef(visible);

  // Création du panResponder avec une configuration améliorée
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 2; // Déclencher avec un petit mouvement vers le bas
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) { // Seulement pour les mouvements vers le bas
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SWIPE_THRESHOLD || gestureState.vy > 0.5) {
          // Fermer si suffisamment glissé vers le bas ou avec une vitesse suffisante
          closeWithAnimation();
        } else {
          // Remettre à la position initiale
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Fonction pour fermer avec animation
  const closeWithAnimation = () => {
    setIsClosing(true);
    // Déclencher un retour haptique lors de la fermeture
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    // Détecter l'ouverture du modal
    if (visible && !prevVisibleRef.current && !isClosing) {
      // Déclencher un retour haptique lors de l'ouverture
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Réinitialiser l'animation lors de l'ouverture
      slideAnim.setValue(height);
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 100,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
    
    // Mettre à jour la référence
    prevVisibleRef.current = visible;
  }, [visible, slideAnim, isClosing]);

  const handleStatusSelect = (newStatus: ReadingStatus) => {
    // Ajouter un léger retour haptique lors de la sélection du statut
    Haptics.selectionAsync();
    setStatus(newStatus);
  };

  const handleSave = () => {
    // Ajouter un retour haptique lors de l'enregistrement
    // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      <TouchableWithoutFeedback
        onPress={() => handleStatusSelect(buttonStatus)}
      >
        <View style={styles.statusButtonContainer}>
          <View
            style={[
              styles.statusButton,
              {
                backgroundColor: colors.card,
                borderColor: isSelected ? colors.accent : colors.border,
                borderWidth: 2,
              },
            ]}
          >
            <Ionicons 
              name={iconName} 
              size={24} 
              color={colors.text}
            />
          </View>
          <Text style={[styles.statusButtonText, { color: colors.text }]}>{label}</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClosePress}
    >
      <TouchableWithoutFeedback onPress={handleClosePress}>
        <View style={styles.overlay}>
            <Animated.View 
              style={[
                styles.container,
                { 
                  backgroundColor: colors.background,
                  transform: [{ translateY: slideAnim }]
                },
              ]}
              {...panResponder.panHandlers}
            >
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Ajouter au suivi
                </Text>
                <TouchableOpacity onPress={handleClosePress} style={{ position: 'absolute', right: 16 }}>
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
                      <Text style={[styles.mangaDetails, { color: colors.secondaryText }]}>
                        {manga.author}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.chapterSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Dernier chapitre lu
                  </Text>
                  <View style={[styles.chapterInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.chapterInput, { color: colors.text }]}
                      value={currentChapter}
                      onChangeText={setCurrentChapter}
                      keyboardType="number-pad"
                      editable={['reading', 'dropped'].includes(status)}
                      maxLength={4}
                    />
                  </View>
                </View>

                <View style={styles.statusSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Statut
                  </Text>
                  
                  <View style={styles.statusButtons}>
                    {renderStatusButton('reading', 'En cours', 'book-outline')}
                    {renderStatusButton('plan_to_read', 'À commencer', 'time-outline')}
                    {renderStatusButton('dropped', 'Stoppé', 'stop-circle-outline')}
                    {renderStatusButton('completed', 'Terminé', 'checkmark-circle-outline')}
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: colors.accent }]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>
                    Enregistrer
                  </Text>
                </TouchableOpacity>
            </Animated.View>
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
  modalWrapper: {
    width: '100%',
  },
  container: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    maxHeight: height * 0.85,
  },
  header: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 26,
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
  mangaDetails: {
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
    gap: 16,
  },
  statusButtonContainer: {
    flex: 1,
  },
  statusButton: {
    borderRadius: 8,
    height: 78,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
  },
  chapterSection: {
    marginBottom: 24,
  },
  chapterInputContainer: {
    borderWidth: 2,
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
    marginBottom: 24,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TrackingModal;