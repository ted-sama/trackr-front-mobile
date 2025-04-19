import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, Image, StyleSheet, ActivityIndicator, Animated, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../..//contexts/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { getBook } from '../../api';
import { Book } from '../../types';
import TabBar, { TabBarTab } from '../../components/TabBar';

export default function TrackingSettingsScreen() {
  const router = useRouter();
  const { bookId } = useLocalSearchParams(); 
  const { colors } = useTheme();
  const typography = useTypography();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'auto' | 'semi-auto'>('auto');
  const trackingTabs: TabBarTab<'auto' | 'semi-auto'>[] = [
    { label: 'Automatique', value: 'auto' },
    { label: 'Semi-automatique', value: 'semi-auto' },
  ];

  useEffect(() => {
    const fetchBook = async () => {
      try {
        if (!bookId) throw new Error('ID du livre invalide');
        const data = await getBook({ id: bookId as string });
        setBook(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };
    if (bookId) fetchBook();
    else setError('ID du livre manquant');
  }, [bookId]);

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (error) return <Text style={{ color: 'red' }}>{error}</Text>;
  if (!book) return <Text>Livre introuvable</Text>;

  return (
    <View style={{ flex: 1, justifyContent: 'flex-start', paddingTop: 32, paddingHorizontal: 16 }}>
      {/* Header du bottom sheet copié */}
      <View style={styles.bottomSheetHeader}> 
        <Image
          source={{ uri: book.cover_image }}
          style={{ width: 60, height: 90, borderRadius: 6, marginBottom: 10 }}
        />
        <View>
          <Text style={[typography.h3, { color: colors.text }]} numberOfLines={1}>{book.title}</Text>
          <Text style={[typography.caption, { color: colors.secondaryText }]} numberOfLines={1}>{book.author}</Text>
          <View style={[styles.ratingContainer, { marginTop: 4 }]}> 
            <Ionicons name="star" size={14} color={colors.text} />
            <Text style={[typography.caption, { color: colors.secondaryText }]}> {book.rating || 'N/A'}</Text>
          </View>
        </View>
      </View>
      {/* TabBar universelle */}
      <TabBar tabs={trackingTabs} selected={selectedTab} onTabChange={setSelectedTab} />
      {/* ... Votre formulaire ici ... */}
      <View>
        <Text style={[typography.h3, { color: colors.text }]}>Type de suivi</Text>
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomSheetHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
  },
});

const tabBoxStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F3',
    borderRadius: 16,
    padding: 4,
    position: 'relative',
    marginBottom: 8,
    height: 48,
    alignItems: 'center',
  },
  highlight: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    height: 40,
    borderRadius: 12,
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#222',
  },
});
