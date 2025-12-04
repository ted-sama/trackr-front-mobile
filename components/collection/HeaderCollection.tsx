import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import SearchBar from '@/components/ui/SearchBar';
import { useTypography } from '@/hooks/useTypography';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ScalePressableProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

function ScalePressable({ onPress, style, children }: ScalePressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.92, { duration: 220 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 220 }); }}
      style={[style, animatedStyle]}
      {...(onPress && { pointerEvents: 'box-only' })}
    >
      {children}
    </AnimatedPressable>
  );
}

interface HeaderCollectionProps {
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onSubmitSearch?: () => void;
  onAddPress?: () => void;
}

const screenWidth = Dimensions.get('window').width;
const paddingHorizontal = 16;

const CANCEL_BUTTON_EFFECTIVE_WIDTH = 90; // Estimated total width for the "Annuler" button including its horizontal spacing

export function HeaderCollection({
  searchText,
  onSearchTextChange,
  onSubmitSearch,
  onAddPress,
}: HeaderCollectionProps) {
  const insets = useSafeAreaInsets();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { t } = useTranslation();

  const handleSearchIconPress = useCallback(() => {
    setIsSearchActive(true);
  }, []);

  const handleCancelSearch = useCallback(() => {
    setIsSearchActive(false);
    onSearchTextChange('');
  }, [onSearchTextChange]);


  return (
    <View
      style={[
        styles.headerContainer,
        {
          height: 80 + insets.top,
        },
      ]}
    >
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
      />

      {/* Blurred header with gradient fade */}
      <MaskedView
        style={StyleSheet.absoluteFillObject}
        maskElement={
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 1)',
              'rgba(0, 0, 0, 1)',
              'rgba(0, 0, 0, 0.98)',
              'rgba(0, 0, 0, 0.95)',
              'rgba(0, 0, 0, 0.9)',
              'rgba(0, 0, 0, 0.82)',
              'rgba(0, 0, 0, 0.7)',
              'rgba(0, 0, 0, 0.55)',
              'rgba(0, 0, 0, 0.4)',
              'rgba(0, 0, 0, 0.25)',
              'rgba(0, 0, 0, 0.12)',
              'rgba(0, 0, 0, 0.05)',
              'rgba(0, 0, 0, 0.02)',
              'rgba(0, 0, 0, 0)',
            ]}
            locations={[0, 0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.94, 0.97, 1]}
            dither={true}
            style={{ flex: 1 }}
          />
        }
      >
        <BlurView
          intensity={8}
          tint={currentTheme === "dark" ? "dark" : "light"}
          style={StyleSheet.absoluteFillObject}
        />
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor:
                currentTheme === "dark"
                  ? "rgba(0,0,0,0.3)"
                  : "rgba(255,255,255,0.1)",
            },
          ]}
        />
      </MaskedView>

      {/* Header content */}
      <View
        style={[
          styles.header,
          {
            paddingTop: 12 + insets.top,
          },
        ]}
      >
        {isSearchActive ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <SearchBar
              placeholder={t("collection.searchPlaceholder")}
              value={searchText}
              onChangeText={onSearchTextChange}
              containerStyle={{ flex: 1 }}
            />
            <TouchableOpacity onPress={handleCancelSearch} style={styles.cancelButton}>
              <Text style={[typography.h3, { color: colors.primary }]}>{t("discover.cancel")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.titleRow}>
            <Text style={[typography.h1, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              Collection
            </Text>
            <View style={styles.buttonsContainer}>
              <ScalePressable onPress={onAddPress} style={styles.circleButton}>
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    styles.circleButtonBg,
                    { backgroundColor: colors.backButtonBackground },
                  ]}
                />
                <Ionicons name="add" size={22} color={colors.icon} />
              </ScalePressable>
              <ScalePressable onPress={handleSearchIconPress} style={styles.circleButton}>
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    styles.circleButtonBg,
                    { backgroundColor: colors.backButtonBackground },
                  ]}
                />
                <Ionicons name="search" size={20} color={colors.icon} />
              </ScalePressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 98,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: paddingHorizontal,
    paddingBottom: 10,
    zIndex: 99,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    overflow: 'hidden',
  },
  circleButtonBg: {
    borderRadius: '50%',
  },
  cancelButton: {
    marginLeft: 10,
    paddingHorizontal: 5,
  },
});

export default HeaderCollection; 