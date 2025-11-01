/* eslint-disable react/display-name */
import React, { forwardRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  StarIcon,
  TypeIcon,
  UserIcon,
  CalendarIcon,
} from 'lucide-react-native';

export type SortType = 'rating' | 'title' | 'author' | 'date';
export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  type: SortType;
  order: SortOrder;
}

export interface SortBottomSheetProps {
  onSortChange: (sortOption: SortOption) => void;
  currentSort?: SortOption;
}

const SortBottomSheet = forwardRef<BottomSheetModal, SortBottomSheetProps>(
  ({ onSortChange, currentSort }, ref) => {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const typography = useTypography();

    const sortOptions: (SortOption & { label: string; icon: React.ReactNode })[] = [
      {
        type: 'rating',
        order: 'desc',
        label: t('collection.myLibrary.sort.rating_desc'),
        icon: <StarIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
      {
        type: 'rating',
        order: 'asc',
        label: t('collection.myLibrary.sort.rating_asc'),
        icon: <StarIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
      {
        type: 'title',
        order: 'asc',
        label: t('collection.myLibrary.sort.title_asc'),
        icon: <TypeIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
      {
        type: 'title',
        order: 'desc',
        label: t('collection.myLibrary.sort.title_desc'),
        icon: <TypeIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
      {
        type: 'author',
        order: 'asc',
        label: t('collection.myLibrary.sort.author_asc'),
        icon: <UserIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
      {
        type: 'author',
        order: 'desc',
        label: t('collection.myLibrary.sort.author_desc'),
        icon: <UserIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
      {
        type: 'date',
        order: 'desc',
        label: t('collection.myLibrary.sort.date_desc'),
        icon: <CalendarIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
      {
        type: 'date',
        order: 'asc',
        label: t('collection.myLibrary.sort.date_asc'),
        icon: <CalendarIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
    ];

    const handleSortPress = (sortOption: SortOption) => {
      onSortChange(sortOption);
      const sheetRef = typeof ref === 'object' ? ref?.current : null;
      if (sheetRef) {
        // @ts-expect-error bottom sheet ref
        sheetRef.dismiss();
      }
    };

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      []
    );

    const isSelected = (option: SortOption) => {
      return (
        currentSort?.type === option.type && currentSort?.order === option.order
      );
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['50%']}
        index={0}
        backgroundStyle={{
          backgroundColor: colors.background,
          borderCurve: 'continuous',
          borderRadius: 30,
        }}
        handleComponent={null}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.header}>
            <Text style={[typography.h3, { color: colors.text }]}>
              {t('collection.myLibrary.sort.title')}
            </Text>
          </View>
          <View style={styles.sortOptions}>
            {sortOptions.map((option, idx) => (
              <TouchableOpacity
                key={`${option.type}-${option.order}-${idx}`}
                style={[
                  styles.sortButton,
                  { backgroundColor: colors.actionButton },
                  isSelected(option) && {
                    backgroundColor: colors.primary,
                    opacity: 0.8,
                  },
                ]}
                onPress={() => handleSortPress(option)}
              >
                <View style={styles.sortButtonContent}>
                  {option.icon}
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.text, flex: 1 },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.order === 'asc' ? (
                    <ArrowUpIcon size={16} strokeWidth={2.75} color={colors.secondaryText} />
                  ) : (
                    <ArrowDownIcon size={16} strokeWidth={2.75} color={colors.secondaryText} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheetContent: {
    padding: 24,
    paddingBottom: 64,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sortOptions: {
    flexDirection: 'column',
    gap: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  sortButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
});

export default SortBottomSheet;
