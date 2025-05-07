import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, Animated, Pressable, TouchableWithoutFeedback } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../..//contexts/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { getBook, getChaptersFromBook, getSources, getChaptersFromSource } from '../../api';
import { Book, ChapterResponse, Chapter, Source } from '../../types';
import TabBar, { TabBarTab } from '../../components/TabBar';
import DropdownSelector from '../../components/DropdownSelector';
import { useDropdownContext } from '../../contexts/DropdownContext';
import Button from '../../components/Button';

interface SourceWithChapterCount extends Source {
  chapterCount?: number;
}

export default function TrackingSettingsScreen() {
  const router = useRouter();
  const { bookId } = useLocalSearchParams(); 
  const { colors } = useTheme();
  const typography = useTypography();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sources, setSources] = useState<SourceWithChapterCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'auto' | 'semi-auto'>('auto');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedLastReadChapter, setSelectedLastReadChapter] = useState<string | null>(null);
  const { openDropdownId, setOpenDropdownId } = useDropdownContext();
  const trackingTabs: TabBarTab<'auto' | 'semi-auto'>[] = [
    { label: 'Automatique', value: 'auto' },
    { label: 'Semi-automatique', value: 'semi-auto' },
  ];

  const dummySources = [
    "MANGA Moins",
    "MANGA Plus",
    "Little Garden",
    "VoirAnime"
  ]

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

    const fetchChapters = async () => {
      const data = await getChaptersFromBook(bookId as string);
      setChapters(data.items);
    };

    const fetchSources = async () => {
      const sourceData = await getSources();
      const sourcesWithCount: (SourceWithChapterCount | null)[] = await Promise.all(
        sourceData.items.map(async (source) => {
          const chapterData = await getChaptersFromSource(bookId as string, source.id.toString(), 'desc');
          if (chapterData.total > 0) {
            return {
              ...source,
              chapterCount: chapterData.total,
            };
          }
          return null;
        })
      );
      setSources(sourcesWithCount.filter(source => source !== null) as SourceWithChapterCount[]);
    };

    if (bookId) {
      fetchBook();
      fetchChapters();
      fetchSources();
    }
    else setError('ID du livre manquant');
  }, [bookId]);

  useEffect(() => {
    const fetchChapters = async () => {
      if (selectedSource) {
        const source = sources.find(source => source.id.toString() === selectedSource);
        if (source) {
          const chapters = await getChaptersFromSource(bookId as string, source.id.toString(), 'desc');
          setChapters(chapters.items);
        }
      }
    };
    fetchChapters();
  }, [selectedSource]);
  

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (error) return <Text style={{ color: 'red' }}>{error}</Text>;
  if (!book) return <Text>Livre introuvable</Text>;

  return (
    <TouchableWithoutFeedback onPress={() => setOpenDropdownId(null)}>
      <View style={{ flex: 1, justifyContent: 'flex-start', paddingTop: 22, paddingHorizontal: 16 }}>
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
        {selectedTab === 'auto' && (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={[typography.h3, { color: colors.text, marginBottom: 8 }]}>Source de tracking</Text>
              <DropdownSelector
                options={sources.map(source => ({
                  label: `${source.name} • ${source.chapterCount ?? 0} ${source.chapterCount === 1 ? 'chapitre' : 'chapitres'}`,
                  value: source.id.toString()
                }))}
                selectedValue={selectedSource}
                onValueChange={setSelectedSource}
                placeholder="Source de tracking"
              />
            </View>
            <Button
              title="Voir les chapitres disponibles"
              onPress={() => router.push(`/book/chapter-list?bookId=${bookId}&sourceId=${selectedSource}`)}
              disabled={!selectedSource}
            />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
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
