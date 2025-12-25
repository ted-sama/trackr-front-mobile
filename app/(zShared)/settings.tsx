import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import Constants from 'expo-constants';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore, ALL_BOOK_TYPES } from '@/stores/uiStore';
import { useUserStore } from '@/stores/userStore';
import { useSubscriptionInfo } from '@/hooks/queries/subscription';
import { useDeleteAccount } from '@/hooks/queries/auth';
import { KeyRound, LogOut, MessageCircle, Lock, Palette, Languages, ChartColumnStacked, Info, ShieldCheck, FileText, Trash2 } from 'lucide-react-native';
import TrackrIcon from '@/components/icons/TrackrIcon';
import { ConfirmationBottomSheet } from '@/components/shared/DeleteBottomSheet';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { toast } from 'sonner-native';

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
}

function SettingsItem({ icon, label, value, onPress, showChevron = true, danger = false }: SettingsItemProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <TouchableOpacity
      style={[styles.settingsItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
          {icon}
        </View>
        <Text style={[typography.body, { color: danger ? colors.error : colors.text, fontWeight: '500' }]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingsItemRight}>
        {value && (
          <Text style={[typography.body, { color: colors.secondaryText, marginRight: 8, fontSize: 14 }]}>
            {value}
          </Text>
        )}
        {showChevron && onPress && (
          <Ionicons name="chevron-forward" size={20} color={colors.icon} />
        )}
      </View>
    </TouchableOpacity>
  );
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <View style={styles.section}>
      <Text style={[typography.body, styles.sectionTitle, { color: colors.secondaryText }]}>
        {title}
      </Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

export default function Settings() {
  const { colors, currentTheme, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const typography = useTypography();
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();
  const { isTrackrPlus } = useSubscription();
  const { data: subscriptionInfo } = useSubscriptionInfo();
  const currentUser = useUserStore((state) => state.currentUser);
  const deleteAccountMutation = useDeleteAccount();
  const searchTypes = useUIStore((state) => state.searchTypes);
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteAccountSheetRef = useRef<TrueSheet>(null);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const { t } = useTranslation();

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccountMutation.mutateAsync();
      toast.success(t('deleteAccount.success'));
      await logout();
      router.replace('/');
    } catch (error) {
      toast.error(t('deleteAccount.errorDeleting'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getChatUsageValue = () => {
    if (!subscriptionInfo?.chat) return '';
    const { used, limit } = subscriptionInfo.chat;
    return t('settings.aiChat.usageValue', { used, limit });
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return t('languages.french') === 'Français' ? 'Clair' : 'Light';
      case 'dark':
        return t('languages.french') === 'Français' ? 'Sombre' : 'Dark';
      case 'system':
        return t('languages.french') === 'Français' ? 'Système' : 'System';
      default:
        return t('languages.french') === 'Français' ? 'Système' : 'System';
    }
  };

  const getCurrentLanguage = () => {
    return i18n.language === 'fr' ? t('languages.french') : t('languages.english');
  };

  const getSearchTypesValue = () => {
    if (searchTypes.length === ALL_BOOK_TYPES.length) {
      return t('settings.search.allTypes');
    }
    return t('settings.search.typesCount', { count: searchTypes.length, total: ALL_BOOK_TYPES.length });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      
      <AnimatedHeader
        title={t('settings.title')}
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
          paddingHorizontal: 16 
        }}
      >
        <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
          <Text style={[typography.h1, { color: colors.text }]}>{t("settings.title")}</Text>
        </View>
        {isAuthenticated && (
          <SettingsSection title={t('settings.account.title')}>
            {currentUser?.hasPassword && (
              <SettingsItem
                icon={<KeyRound size={20} color={colors.icon} />}
                label={t('settings.account.changePassword')}
                onPress={() => router.push('/(zShared)/change-password')}
              />
            )}
            <SettingsItem
              icon={<Trash2 size={20} color={colors.error} />}
              label={t('settings.account.deleteAccount')}
              onPress={() => deleteAccountSheetRef.current?.present()}
              danger
            />
            <SettingsItem
              icon={<LogOut size={20} color={colors.error} />}
              label={t('settings.account.logout')}
              onPress={logout}
              showChevron={false}
              danger
            />
          </SettingsSection>
        )}

        {isAuthenticated && (
          <SettingsSection title={t('settings.subscription.title')}>
            <SettingsItem
              icon={<TrackrIcon color={isTrackrPlus ? colors.accent : colors.icon} />}
              label={t('settings.subscription.plan')}
              value={isTrackrPlus ? t('subscription.trackrPlus') : t('subscription.freePlan')}
              onPress={() => router.push('/(zShared)/subscription')}
            />
          </SettingsSection>
        )}

        {isAuthenticated && (
          <SettingsSection title={t('settings.aiChat.title')}>
            <SettingsItem
              icon={<MessageCircle size={20} color={colors.icon} />}
              label={t('settings.aiChat.usage')}
              value={getChatUsageValue()}
              onPress={() => router.push('/(zShared)/chat-usage')}
            />
          </SettingsSection>
        )}

        {isAuthenticated && (
          <SettingsSection title={t('settings.privacy.title')}>
            <SettingsItem
              icon={<Lock size={20} color={colors.icon} />}
              label={t('settings.privacy.title')}
              onPress={() => router.push('/(zShared)/privacy')}
            />
          </SettingsSection>
        )}

        <SettingsSection title={t('settings.appearance.title')}>
          <SettingsItem
            icon={<Palette size={20} color={colors.icon} />}
            label={t('settings.appearance.theme')}
            value={getThemeLabel()}
            onPress={() => {
              // Navigation vers l'écran de sélection de thème ou toggle
              router.push('/(zShared)/theme-selector');
            }}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.language.title')}>
          <SettingsItem
            icon={<Languages size={20} color={colors.icon} />}
            label={t('settings.language.current')}
            value={getCurrentLanguage()}
            onPress={() => {
              // Navigation vers l'écran de sélection de langue
              router.push('/(zShared)/language-selector');
            }}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.search.title')}>
          <SettingsItem
            icon={<ChartColumnStacked size={20} color={colors.icon} />}
            label={t('settings.search.types')}
            value={getSearchTypesValue()}
            onPress={() => {
              router.push('/(zShared)/search-types-selector');
            }}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.about.title')}>
          <SettingsItem
            icon={<Info size={20} color={colors.icon} />}
            label={t('settings.about.version')}
            value={Constants.expoConfig?.version || '1.0.0'}
            showChevron={false}
            onPress={undefined}
          />
          <SettingsItem
            icon={<ShieldCheck size={20} color={colors.icon} />}
            label={t('settings.about.privacy')}
            onPress={() => {
              // Navigation vers la politique de confidentialité
            }}
          />
          <SettingsItem
            icon={<FileText size={20} color={colors.icon} />}
            label={t('settings.about.terms')}
            onPress={() => {
              // Navigation vers les conditions d'utilisation
            }}
          />
        </SettingsSection>
      </Animated.ScrollView>

      <ConfirmationBottomSheet
        ref={deleteAccountSheetRef}
        title={t('deleteAccount.title')}
        message={t('deleteAccount.warning')}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeleting}
        variant="destructive"
        confirmText={t('deleteAccount.confirm')}
      />
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
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
