/* eslint-disable react/display-name */
import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTypography } from '@/hooks/useTypography';
import { Book } from '@/types/book';
import { Plus, Minus } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import ProgressBar from '@/components/ui/ProgressBar';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';
import 'dayjs/locale/en';

dayjs.extend(relativeTime);

interface SetChapterBottomSheetProps {
    book: Book;
    snapPoints?: string[];
    index?: number;
    onDismiss?: () => void;
    backdropDismiss?: boolean;
}

interface AnimatedPressableProps {
    style?: any;
    onPress?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

const AnimatedPressable: React.FC<AnimatedPressableProps> = ({ style, onPress, disabled, children }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(1.15, {
            damping: 50,
            stiffness: 300,
        });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, {
            damping: 50,
            stiffness: 300,
        });
    };

    return (
        <AnimatedPressableComponent
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={[style, animatedStyle]}
        >
            {children}
        </AnimatedPressableComponent>
    );
};

const SetChapterBottomSheet = forwardRef<BottomSheetModal, SetChapterBottomSheetProps>(({ book, snapPoints, index, onDismiss, backdropDismiss }, ref) => {
    const { getTrackedBookStatus, updateTrackedBook } = useTrackedBooksStore();
    const bookTracking = getTrackedBookStatus(book.id);
    
    const { colors } = useTheme();
    const typography = useTypography();
    const isTracking = bookTracking !== null;
    const [chapter, setChapter] = useState(bookTracking?.currentChapter?.toString() ?? '0');
    const { t } = useTranslation();

    useEffect(() => {
        setChapter(bookTracking?.currentChapter?.toString() ?? '0');
    }, [bookTracking?.currentChapter]);

    const handleDismiss = () => {
        // Toujours réinitialiser l'état du chapitre à la fermeture
        setChapter(bookTracking?.currentChapter?.toString() ?? '0');
        
        if (onDismiss) {
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

    const handleSheetChange = useCallback((newIndex: number) => {
        // Quand le bottom sheet s'ouvre (index >= 0), réinitialiser le chapitre
        if (newIndex >= 0) {
            setChapter(bookTracking?.currentChapter?.toString() ?? '0');
        }
    }, [bookTracking?.currentChapter]);

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
            onChange={handleSheetChange}
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
                <View style={styles.chapterActionsContainer}>
                    <AnimatedPressable style={[styles.chapterActionButton, { borderColor: colors.border, backgroundColor: colors.backButtonBackground, opacity: Number(chapter) <= 0 ? 0.5 : 1 }]} onPress={() => setChapter((Number(chapter) - 1).toString())} disabled={Number(chapter) <= 0}>
                        <Minus size={24} color={colors.icon} />
                    </AnimatedPressable>
                    <View style={styles.chapterContainer}>
                        <View style={styles.chapterInputContainer}>
                            <Text style={[typography.categoryTitle, { color: colors.accent }]}>Ch.</Text>
                            <BottomSheetTextInput
                                style={[typography.categoryTitle, { color: colors.accent }]}
                                inputMode='numeric'
                                keyboardType='numeric'
                                numberOfLines={1}
                                value={chapter}
                                onChangeText={handleInputChange}
                            />
                        </View>
                        <Text style={[typography.slashSeparator, { color: colors.text }]}>/</Text>
                        <Text style={[typography.categoryTitle, { color: colors.text }]}>Ch. {book.chapters?.toString() ?? '?'}</Text>
                    </View>
                    <AnimatedPressable style={[styles.chapterActionButton, { borderColor: colors.border, backgroundColor: colors.backButtonBackground, opacity: book.chapters !== null && Number(chapter) >= (book.chapters ?? 0) ? 0.5 : 1 }]} onPress={() => setChapter((Number(chapter) + 1).toString())} disabled={book.chapters !== null && Number(chapter) >= (book.chapters ?? 0)}>
                        <Plus size={24} color={colors.icon} />
                    </AnimatedPressable>
                </View>
                <ProgressBar
                    current={Number(chapter)}
                    max={book.chapters ?? 0}
                    height={7}
                    showGlow={true}
                    style={{ marginBottom: 8 }}
                />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <View style={{ flex: 1 }}>
                            {bookTracking?.lastReadAt && (
                                <Text style={[typography.caption, { color: colors.secondaryText }]}>
                                    {t("book.lastReadOn", { time: dayjs(bookTracking.lastReadAt).fromNow() })}
                                </Text>
                            )}
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            {book.chapters === undefined || book.chapters === null ? (
                                <Text style={[typography.caption, { color: colors.secondaryText }]}>
                                    {t("book.chaptersLeft", { chapters: "?" })}
                                </Text>
                            ) : book.chapters > Number(chapter) ? (
                                <Text style={[typography.caption, { color: colors.secondaryText }]}>
                                    {t("book.chaptersLeft", { chapters: (book.chapters - Number(chapter)).toString() })}
                                </Text>
                            ) : (
                                <Text style={[typography.caption, { color: colors.accent }]}>
                                    {t("status.completed")}
                                </Text>
                            )}
                        </View>
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
    chapterActionsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 16,
        gap: 8,
    },
    chapterActionButton: {
        padding: 8,
        borderWidth: 1,
        borderRadius: 25,
    },
    chapterContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        width: 200,
        gap: 4,
    },
    chapterInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
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
