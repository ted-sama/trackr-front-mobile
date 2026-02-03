import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useRouter } from 'expo-router';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Button from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { toast } from 'sonner-native';
import { useMalImport, MalImportResponse } from '@/hooks/queries/malImport';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';

export default function MalImport() {
  const { colors, currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const typography = useTypography();
  const router = useRouter();
  const { t } = useTranslation();
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState<number>(0);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<MalImportResponse | null>(null);

  const malImportMutation = useMalImport();

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const validateUsername = (): string => {
    if (!username.trim()) {
      return t('auth.errors.requiredField');
    }
    if (username.length < 2) {
      return t('malImport.errors.usernameTooShort');
    }
    return '';
  };

  const handleImport = async () => {
    const validationError = validateUsername();
    setError(validationError);

    if (validationError) {
      return;
    }

    try {
      const response = await malImportMutation.mutateAsync(username.trim());
      setResult(response);
      if (response.imported > 0) {
        toast.success(t('malImport.success', { count: response.imported }));
      } else {
        toast(t('malImport.noNewBooks'));
      }
    } catch (err: any) {
      const errorCode = err?.response?.data?.code;
      if (errorCode === 'MAL_USER_NOT_FOUND') {
        toast.error(t('malImport.errors.userNotFound'));
      } else if (errorCode === 'MAL_IMPORT_FAILED') {
        toast.error(t('malImport.errors.importFailed'));
      } else {
        toast.error(t('malImport.errors.generic'));
      }
    }
  };

  const renderResults = () => {
    if (!result) return null;

    return (
      <View style={styles.resultsContainer}>
        <Text style={[typography.h2, { color: colors.text, marginBottom: 16 }]}>
          {t('malImport.results.title')}
        </Text>

        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <CheckCircle size={24} color={colors.accent} />
              <Text style={[typography.h2, { color: colors.text }]}>{result.imported}</Text>
              <Text style={[typography.caption, { color: colors.secondaryText }]}>
                {t('malImport.results.imported')}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <AlertCircle size={24} color={colors.icon} />
              <Text style={[typography.h2, { color: colors.text }]}>{result.alreadyExists.length}</Text>
              <Text style={[typography.caption, { color: colors.secondaryText }]}>
                {t('malImport.results.alreadyExists')}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <XCircle size={24} color={colors.error} />
              <Text style={[typography.h2, { color: colors.text }]}>{result.notFound.length}</Text>
              <Text style={[typography.caption, { color: colors.secondaryText }]}>
                {t('malImport.results.notFound')}
              </Text>
            </View>
          </View>
        </View>

        {/* Not found list */}
        {result.notFound.length > 0 && (
          <View style={styles.listSection}>
            <Text style={[typography.body, { color: colors.secondaryText, marginBottom: 8, fontWeight: '600' }]}>
              {t('malImport.results.notFoundList')}
            </Text>
            <View style={[styles.listCard, { backgroundColor: colors.card }]}>
              {result.notFound.map((title, index) => (
                <Text
                  key={index}
                  style={[typography.body, { color: colors.text, paddingVertical: 8 }]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Already exists list */}
        {result.alreadyExists.length > 0 && (
          <View style={styles.listSection}>
            <Text style={[typography.body, { color: colors.secondaryText, marginBottom: 8, fontWeight: '600' }]}>
              {t('malImport.results.alreadyExistsList')}
            </Text>
            <View style={[styles.listCard, { backgroundColor: colors.card }]}>
              {result.alreadyExists.slice(0, 10).map((title, index) => (
                <Text
                  key={index}
                  style={[typography.body, { color: colors.text, paddingVertical: 8 }]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              ))}
              {result.alreadyExists.length > 10 && (
                <Text style={[typography.caption, { color: colors.secondaryText, paddingVertical: 8 }]}>
                  {t('malImport.results.andMore', { count: result.alreadyExists.length - 10 })}
                </Text>
              )}
            </View>
          </View>
        )}

        <Button
          title={t('malImport.done')}
          onPress={() => router.back()}
          style={{ marginTop: 24 }}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />

      <AnimatedHeader
        title={t('malImport.title')}
        scrollY={scrollY}
        onBack={() => router.back()}
        collapseThreshold={titleY > 0 ? titleY : undefined}
      />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          marginTop: insets.top,
          paddingBottom: 64,
          paddingHorizontal: 16,
        }}
      >
        <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
          <Text style={[typography.h1, { color: colors.text }]}>{t('malImport.title')}</Text>
        </View>

        {!result ? (
          <>
            <Text style={[typography.body, { color: colors.secondaryText, marginBottom: 24 }]}>
              {t('malImport.description')}
            </Text>

            <TextField
              label={t('malImport.usernameLabel')}
              placeholder={t('malImport.usernamePlaceholder')}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setError('');
              }}
              error={error}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Button
              title={malImportMutation.isPending ? t('malImport.importing') : t('malImport.importButton')}
              onPress={handleImport}
              disabled={malImportMutation.isPending || !username.trim()}
              style={{ marginTop: 24 }}
            />

            <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 16, textAlign: 'center' }]}>
              {t('malImport.note')}
            </Text>
          </>
        ) : (
          renderResults()
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 70,
    marginBottom: 16,
  },
  resultsContainer: {
    marginTop: 8,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 8,
  },
  listSection: {
    marginBottom: 16,
  },
  listCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
  },
});
