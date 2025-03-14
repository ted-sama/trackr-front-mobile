import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import CategorySlider from '../components/CategorySlider';
import TrackingModal from '../components/TrackingModal';
import { CATEGORIES } from '../data/manga';
import { useTheme } from '../contexts/ThemeContext';
import { Manga, ReadingStatus } from '../types';

// Composant principal pour la page Discover
export default function Discover() {
  const { colors, currentTheme } = useTheme();
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const handleTrackingRequest = useCallback((manga: Manga) => {
    setSelectedManga(manga);
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleSaveTracking = useCallback((mangaId: string, status: ReadingStatus, currentChapter?: number) => {
    // Mise à jour du statut de tracking
    if (selectedManga) {
      selectedManga.tracking = true;
      
      // Ici, vous pourriez enregistrer le statut et le chapitre dans votre backend ou state management
      console.log(`${selectedManga.title} ajouté au suivi: ${status}, chapitre: ${currentChapter || 'N/A'}`);
    }
    setIsModalVisible(false);
  }, [selectedManga]);
  
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={['right', 'left']}
    >
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {CATEGORIES.map((category) => (
          <CategorySlider 
            key={category.id} 
            category={category} 
            onTrackingRequest={handleTrackingRequest}
          />
        ))}
      </ScrollView>
      
      {selectedManga && (
        <TrackingModal
          visible={isModalVisible}
          manga={selectedManga}
          onClose={handleCloseModal}
          onSave={handleSaveTracking}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20,
  },
}); 