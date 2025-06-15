import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useBookDetailStore } from '@/stores/bookDetailStore';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import { ReadingStatus } from '@/types';
import { X, BookOpen, Clock3, BookCheck, Pause, Square } from 'lucide-react-native';
import Animated, { 
    FadeInDown, 
    FadeInUp, 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming 
  } from 'react-native-reanimated';
import { getRecap } from '@/services/api';

export default function Recap() {
  const router = useRouter();
  const { bookId, bookTitle } = useLocalSearchParams();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const { bookById } = useBookDetailStore();
  const { getTrackedBookStatus } = useTrackedBooksStore();
  const [recap, setRecap] = useState<string>('');
  const bookTracking = getTrackedBookStatus(Number(bookId));
  const bookDetails = bookById[Number(bookId)];

  const trackingStatusValues: Record<ReadingStatus, { text: string, icon: React.ReactNode }> = {
    'plan_to_read': { text: 'À lire', icon: <Clock3 size={12} strokeWidth={2.75} color={colors.planToRead} /> },
    'reading': { text: 'En cours', icon: <BookOpen size={12} strokeWidth={2.75} color={colors.reading} /> },
    'completed': { text: 'Complété', icon: <BookCheck size={12} strokeWidth={2.75} color={colors.completed} /> },
    'on_hold': { text: 'En pause', icon: <Pause size={12} strokeWidth={2.75} color={colors.onHold} /> },
    'dropped': { text: 'Abandonné', icon: <Square size={12} strokeWidth={2.75} color={colors.dropped} /> },
  };

  const handleClose = () => {
    router.back();
  };

  useEffect(() => {
    const fetchRecap = async () => {
      const recap = await getRecap(bookId as string, bookTracking?.current_chapter as number);
      console.log(recap);
      setRecap(recap);
    };
    fetchRecap();
  }, [bookId, bookTracking]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style='light' /> 
      {/* Header avec bouton fermer */}
      <View 
        style={[styles.header, { borderBottomColor: 'transparent' }]}
      >
        <View style={styles.headerLeft}>
          <Text style={[typography.categoryTitle, { color: colors.text }]}>
            Récapitulatif
          </Text>
        </View>
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [
            styles.closeButton,
            { 
              backgroundColor: colors.backButtonBackground,
              opacity: pressed ? 0.7 : 1 
            }
          ]}
        >
          <X size={20} color={colors.text} />
        </Pressable>
      </View>

      <View 
        style={styles.content}
      >
         {/* Titre du livre */}
         <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Text style={[typography.h1, { color: colors.text, marginBottom: 12 }]} numberOfLines={2} ellipsizeMode='tail'>
            {bookDetails?.title || 'Titre du livre'}
          </Text>
          
          {/* Current chapter */}
          {bookTracking && (
            <Text style={[typography.caption, { color: colors.secondaryText, marginBottom: 12 }]} numberOfLines={1} ellipsizeMode='tail'>
              Chapitre {bookTracking.current_chapter}
            </Text>
          )}
        </Animated.View>

        <ScrollView>
          <Text style={[typography.body, { color: colors.text }]}>
            {recap}
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },


  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  separator: {
    height: 1,
    marginVertical: 20,
  },
}); 