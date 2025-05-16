import React, { forwardRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useBottomSheet } from '@/contexts/BottomSheetContext';
import { useTrackedBooksStore } from '@/state/tracked-books-store';
import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTypography } from '@/hooks/useTypography';
import { Book } from '@/types';
import { Plus, Minus } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import { updateBookTracking } from '@/api';


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
    const [chapter, setChapter] = useState(bookTracking?.current_chapter?.toString() ?? '0');

    const handleDismiss = () => {
        if (onDismiss) {
            setChapter(bookTracking?.current_chapter?.toString() ?? '0');
            onDismiss();
        }
    };

    const handleInputChange = (text: string) => {
        const numeric = text.replace(/[^0-9]/g, '');
        setChapter(numeric);
    };

    const handleSave = async () => {
        if (isTracking) {
            const updatedBookTracking = await updateBookTracking({ bookId: book.id.toString(), current_chapter: Number(chapter) });
            updateTrackedBook(book.id, { ...book, tracking_status: updatedBookTracking });
            setChapter(updatedBookTracking.current_chapter?.toString() ?? '0');
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
                backgroundColor: colors.card,
                borderRadius: 25,
            }}
            handleIndicatorStyle={{ backgroundColor: colors.icon }}
            backdropComponent={renderBackdrop}
        >
            <BottomSheetView style={styles.bottomSheetContent}>
                <Text style={[typography.categoryTitle, styles.title, { color: colors.text }]}>Dernier chapitre lu</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.actionButton }]}>
                    <Pressable onPress={() => setChapter((Number(chapter) - 1).toString())}>
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
                    <Pressable onPress={() => setChapter((Number(chapter) + 1).toString())}>
                        <Plus size={24} color={colors.text} />
                    </Pressable>
                </View>
                <Button title="Enregistrer" onPress={handleSave} style={{ marginTop: 36 }} />
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
        padding: 16,
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
