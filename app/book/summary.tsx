import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useBookDetailStore } from '@/stores/bookDetailStore';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import { ReadingStatus } from '@/types';
import Badge from '@/components/ui/Badge';
import { X, RotateCcw, BookOpen, TrendingUp, Calendar, Clock3, BookCheck, Pause, Square, Star } from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';

export default function Summary() {
  const router = useRouter();
  const { bookId, bookTitle } = useLocalSearchParams();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const { bookById } = useBookDetailStore();
  const { getTrackedBookStatus } = useTrackedBooksStore();

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style='light' />
      
      {/* Background Image with Masked Fade Effect */}
      {bookDetails?.cover_image && (
        <View style={styles.backgroundContainer}>
          <MaskedView
            style={styles.maskedView}
            maskElement={
              <LinearGradient
                colors={['rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,0)']}
                locations={[0, 0.5, 1]}
                style={styles.maskGradient}
              />
            }
          >
            <Image 
              source={{ uri: bookDetails.cover_image }} 
              style={styles.backgroundImage}
            />
          </MaskedView>
        </View>
      )}
      
      {/* Header avec bouton fermer */}
      <View 
        style={[styles.header, { borderBottomColor: 'transparent' }]}
      >
        <View style={styles.headerLeft}>
          <Text style={[typography.categoryTitle, { color: colors.text }]}>
            Résumé
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
          
          {/* Statut de lecture */}
          {bookTracking && (
            <View style={styles.badgeContainer}>
              <Badge
                text={trackingStatusValues[bookTracking.status as ReadingStatus].text}
                color={colors.badgeText}
                backgroundColor={colors.badgeBackground}
                icon={trackingStatusValues[bookTracking.status as ReadingStatus].icon}
                borderColor={colors.badgeBorder}
              />
            </View>
          )}
        </Animated.View>

        {/* Statistiques de lecture */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <View style={styles.statsGrid}>
            {/* Chapitres lus */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <BookOpen size={20} color={colors.primary} />
              </View>
              <Text style={[typography.h3, { color: colors.text }]}>Chapitres lus</Text>
              <Text style={[typography.h1, { color: colors.primary }]} numberOfLines={1} ellipsizeMode='tail'>
                {bookTracking?.current_chapter || '0'}
              </Text>
            </View>

            {/* Progression */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
                <TrendingUp size={20} color={colors.accent} />
              </View>
              <Text style={[typography.h3, { color: colors.text }]}>Progression</Text>
              <Text style={[typography.h1, { color: colors.accent }]} numberOfLines={1} ellipsizeMode='tail'>
                {bookDetails?.chapters && bookTracking?.current_chapter 
                  ? ((bookTracking.current_chapter / bookDetails.chapters) * 100).toFixed(1) + '%'
                  : '—'
                }
              </Text>
            </View>

            {/* Jours actifs */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.iconContainer, { backgroundColor: colors.reading + '20' }]}>
                <Calendar size={20} color={colors.reading} />
              </View>
              <Text style={[typography.h3, { color: colors.text }]}>Jours actifs</Text>
              {bookTracking?.start_date ? (
                bookTracking.finish_date ? (
                  <Text style={[typography.h1, { color: colors.reading }]}>
                  {(() => {
                    const start = new Date(bookTracking.start_date);
                    const finish = new Date(bookTracking.finish_date);
                    const diffTime = Math.abs(finish.getTime() - start.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                  })()}
                  </Text>
                ) : (
                  <Text style={[typography.h1, { color: colors.reading }]}>
                    {(() => {
                      const start = new Date(bookTracking.start_date);
                      const now = new Date();
                      const diffTime = Math.abs(now.getTime() - start.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                    })()}
                  </Text>
                )
              ) : (
                <Text style={[typography.h1, { color: colors.reading }]}>—</Text>
              )}
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.iconContainer, { backgroundColor: colors.completed + '20' }]}>
                <Star size={20} color={colors.completed} />
              </View>
              <Text style={[typography.h3, { color: colors.text }]}>Note</Text>
              <Text style={[typography.h1, { color: colors.completed }]} numberOfLines={1} ellipsizeMode='tail'>
                {bookTracking?.rating || '—'}
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <Animated.View style={{ flexDirection: 'column', gap: 4 }} entering={FadeInDown.delay(300).duration(300)}>
          <Text style={[typography.caption, { color: colors.secondaryText }]}>
            Ajouté le {new Date(bookTracking?.created_at || '').toLocaleDateString()}
          </Text>
          {bookTracking?.start_date && (
            <Text style={[typography.caption, { color: colors.secondaryText }]}>
              Débuté le {new Date(bookTracking?.start_date || '').toLocaleDateString()}
            </Text>
          )}
          {bookTracking?.finish_date && (
            <Text style={[typography.caption, { color: colors.secondaryText }]}>
              Terminé le {new Date(bookTracking?.finish_date || '').toLocaleDateString()}
            </Text>
          )}
        </Animated.View>

        {/* Objectifs de lecture */}
        {/* <Animated.View entering={FadeInDown.delay(300).duration(300)}>
          <Text style={[typography.h2, { color: colors.text, marginBottom: 20, marginTop: 32 }]}>
            Objectifs de lecture
          </Text>
          
          <View style={[styles.goalCard, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: colors.border }]}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: 8 }]}>
              Objectif hebdomadaire
            </Text>
            <Text style={[typography.body, { color: colors.secondaryText, marginBottom: 16 }]}>
              Lire 5 chapitres cette semaine
            </Text>
            
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: colors.primary,
                    width: '60%' 
                  }
                ]} 
              />
            </View>
            <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 8 }]}>
              3/5 chapitres (60%)
            </Text>
          </View>
        </Animated.View> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '75%',
    zIndex: -1,
  },
  maskedView: {
    width: '100%',
    height: '100%',
  },
  maskGradient: {
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.3, 
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  activityCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  goalCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  separator: {
    height: 1,
    marginVertical: 20,
  },
}); 