import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  StyleSheet, 
  Dimensions,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Manga, ReadingStatus } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { 
  BottomSheetModal, 
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

interface TrackingModalProps {
  visible: boolean;
  manga: Manga;
  onClose: () => void;
  onSave: (mangaId: string, status: ReadingStatus, currentChapter?: number) => void;
}

const { height } = Dimensions.get('window');

const TrackingModal = ({ visible, manga, onClose, onSave }: TrackingModalProps) => {
  const [status, setStatus] = useState<ReadingStatus>('reading');
  const [currentChapter, setCurrentChapter] = useState<string>('1');
  const { colors } = useTheme();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useRef(['75%']).current;

  // Gérer l'ouverture et la fermeture du bottom sheet
  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
      // Retour haptique à l'ouverture
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const handleStatusSelect = (newStatus: ReadingStatus) => {
    // Ajouter un léger retour haptique lors de la sélection du statut
    Haptics.selectionAsync();
    setStatus(newStatus);
  };

  const handleSave = () => {
    // Ajouter un retour haptique lors de l'enregistrement
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const chapter = status === 'reading' ? parseInt(currentChapter, 10) : undefined;
    onSave(manga.id, status, chapter);
    bottomSheetModalRef.current?.dismiss();
  };

  const handleClosePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bottomSheetModalRef.current?.dismiss();
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

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

  if (!manga) return null;

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      onChange={handleSheetChanges}
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
    >
      <BottomSheetView style={[styles.container, { backgroundColor: colors.background }]}>
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
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
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