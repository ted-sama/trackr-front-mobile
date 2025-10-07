/* eslint-disable react/display-name */
import React, { forwardRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTypography } from '@/hooks/useTypography';
import { Book } from '@/types/book';
import { Plus, Minus } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';


interface SetChapterBottomSheetProps {
    book: Book;
    snapPoints?: string[];
    index?: number;
    onDismiss?: () => void;
    backdropDismiss?: boolean;
}

const SetChapterBottomSheet = forwardRef<BottomSheetModal, SetChapterBottomSheetProps>(({ book, snapPoints, index, onDismiss, backdropDismiss }, ref) => {
    const { getTrackedBookStatus, updateTrackedBook } = useTrackedBooksStore();
    const bookTracking = getTrackedBookStatus(book.id);
    
    const { colors } = useTheme();
    const typography = useTypography();
    const isTracking = bookTracking !== null;
    const [chapter, setChapter] = useState(bookTracking?.currentChapter?.toString() ?? '0');
    const { t } = useTranslation();

    const handleDismiss = () => {
        if (onDismiss) {
            setChapter(bookTracking?.currentChapter?.toString() ?? '0');
            onDismiss();
        }
    };

    const handleInputChange = (text: string) => {
        const numeric = text.replace(/[^0-9]/g, '');
        const numericValue = Number(numeric);
        
        // Si book.chapters existe, limiter au maximum disponible
        if (book.chapters !== null && book.chapters !== undefined && numericValue > book.chapters) {
            setChapter(book.chapters.toString());
        } else {
            setChapter(numeric);
        }
    };

    const handleSave = async () => {
        if (isTracking) {
            await updateTrackedBook(book.id, { currentChapter: Number(chapter) });
            setChapter(chapter);
            if (ref && typeof ref === 'object' && 'current' in ref) {
                ref.current?.dismiss();
            }
        }
    };

    const renderBackdrop = useCallback((props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior={backdropDismiss ? "close" : "none"}
        />
      ), [backdropDismiss]);

    return (
        <BottomSheetModal
            ref={ref}
            snapPoints={snapPoints}
            index={index}
            onDismiss={handleDismiss}
            backgroundStyle={{
                backgroundColor: colors.background,
                borderCurve: "continuous",
                borderRadius: 30,
            }}
            handleComponent={null}
            handleIndicatorStyle={{ backgroundColor: colors.icon }}
            backdropComponent={renderBackdrop}
        >
            <BottomSheetView style={styles.bottomSheetContent}>
                <Text style={[typography.categoryTitle, styles.title, { color: colors.text }]}>{t("book.lastChapterRead")}</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.actionButton }]}>
                    <Pressable 
                        onPress={() => {
                            const newValue = Number(chapter) - 1;
                            if (newValue >= 0) {
                                setChapter(newValue.toString());
                            }
                        }}
                        disabled={Number(chapter) <= 0}
                        style={{ opacity: Number(chapter) <= 0 ? 0.5 : 1 }}
                    >
                        <Minus size={24} color={colors.text} />
                    </Pressable>
                    <BottomSheetTextInput
                        style={[typography.categoryTitle, styles.input, { color: colors.text }]}
                        inputMode='numeric'
                        keyboardType='numeric'
                        numberOfLines={1}
                        value={chapter}
                        onChangeText={handleInputChange}
                    />
                    <Pressable 
                        onPress={() => {
                            const newValue = Number(chapter) + 1;
                            const maxChapters = book.chapters !== null && book.chapters !== undefined ? book.chapters : Number.MAX_SAFE_INTEGER;
                            if (newValue <= maxChapters) {
                                setChapter(newValue.toString());
                            }
                        }}
                        disabled={book.chapters !== null && book.chapters !== undefined && Number(chapter) >= book.chapters}
                        style={{ opacity: book.chapters !== null && book.chapters !== undefined && Number(chapter) >= book.chapters ? 0.5 : 1 }}
                    >
                        <Plus size={24} color={colors.text} />
                    </Pressable>
                </View>
                <Button title={t("save")} onPress={handleSave} style={{ marginTop: 36 }} />
            </BottomSheetView>
        </BottomSheetModal>
    );
});

export default SetChapterBottomSheet;

const styles = StyleSheet.create({
    backdrop: {
        backgroundColor: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    bottomSheetContent: {
        padding: 24,
        paddingBottom: 64,
    },
    title: {
        textAlign: 'center',
        marginBottom: 32,
    },
    inputContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        padding: 16,
    },
    input: {
        flex: 1,
        textAlign: 'center',
        margin: 0,
        padding: 0,
    },
});
