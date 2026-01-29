/* eslint-disable react/display-name */
import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import { useUpdateTracking } from '@/hooks/useUpdateTracking';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useTypography } from '@/hooks/useTypography';
import { Book } from '@/types/book';
import { Plus, Minus } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import ProgressBar from '@/components/ui/ProgressBar';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';
import 'dayjs/locale/en';

dayjs.extend(relativeTime);

interface SetChapterBottomSheetProps {
    book: Book;
    onDismiss?: () => void;
    onBookCompleted?: () => void;
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

const SetChapterBottomSheet = forwardRef<TrueSheet, SetChapterBottomSheetProps>(({ book, onDismiss, onBookCompleted }, ref) => {
    const { getTrackedBookStatus } = useTrackedBooksStore();
    const { updateTracking } = useUpdateTracking();
    const bookTracking = getTrackedBookStatus(book.id);

    const { colors } = useTheme();
    const typography = useTypography();
    const isTracking = bookTracking !== null;
    const [chapter, setChapter] = useState(bookTracking?.currentChapter?.toString() ?? '0');
    const { t } = useTranslation();
    const colorTransition = useSharedValue(0);

    const lastReadTimeAgo = useMemo(() => {
        if (!bookTracking?.lastReadAt) return null;
        dayjs.locale(i18n.language);
        return dayjs(bookTracking.lastReadAt).fromNow();
    }, [bookTracking?.lastReadAt, i18n.language]);

    useEffect(() => {
        setChapter(bookTracking?.currentChapter?.toString() ?? '0');
    }, [bookTracking?.currentChapter]);

    const isComplete = book.chapters !== undefined && book.chapters !== null && book.chapters <= Number(chapter);

    useEffect(() => {
        colorTransition.value = withTiming(isComplete ? 1 : 0, {
            duration: 600,
        });
    }, [isComplete]);

    const animatedTextStyle = useAnimatedStyle(() => {
        const textColor = interpolateColor(
            colorTransition.value,
            [0, 1],
            [colors.secondaryText, colors.completed]
        );

        return {
            color: textColor,
        };
    });

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
        } else if (numericValue >= 999999) {
            setChapter('999999');
        } else {
            setChapter(numeric);
        }
    };

    const handleSave = async () => {
        if (isTracking) {
            try {
                const chapterNumber = Number(chapter);
                const hasKnownChapterCount = book.chapters !== null && book.chapters !== undefined;
                const isCompleting = hasKnownChapterCount && chapterNumber >= book.chapters!;
                const wasAlreadyCompleted = bookTracking?.status === 'completed';
                const isGoingBackFromCompleted = wasAlreadyCompleted && hasKnownChapterCount && chapterNumber < book.chapters!;

                // Build update data with status changes
                const updateData: { currentChapter: number; status?: 'completed' | 'reading' } = { currentChapter: chapterNumber };

                if (isCompleting) {
                    // If reaching max chapters, set status to "completed"
                    updateData.status = 'completed';
                } else if (isGoingBackFromCompleted) {
                    // If going back from completed, set status to "reading"
                    updateData.status = 'reading';
                }

                // Dismiss sheet BEFORE updating store to avoid "No sheet found" error
                // (The parent component uses key={bookTracking?.currentChapter} which causes remount)
                if (ref && typeof ref === 'object' && 'current' in ref) {
                    ref.current?.dismiss();
                }

                await updateTracking(book.id, updateData);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setChapter(chapter);

                // Trigger celebration only if this action completes the book (wasn't already completed)
                if (isCompleting && !wasAlreadyCompleted) {
                    onBookCompleted?.();
                }
            } catch (error) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        }
    };

    return (
        <TrueSheet
            ref={ref}
            detents={["auto"]}
            backgroundColor={colors.background}
            grabber={false}
            onDidDismiss={handleDismiss}
        >
            <View style={styles.bottomSheetContent}>
                <View style={styles.titleContainer}>
                    <Text style={[typography.categoryTitle, { color: colors.text }]}>{book.type === 'comic' ? t("book.lastIssueRead") : t("book.lastChapterRead")}</Text>
                    <Text style={[typography.caption, { color: colors.secondaryText, textAlign: 'center' }]} numberOfLines={2}>{book.title}</Text>
                </View>
                <View style={styles.chapterActionsContainer}>
                    <AnimatedPressable style={[styles.chapterActionButton, { borderColor: colors.border, backgroundColor: colors.backButtonBackground, opacity: Number(chapter) <= 0 ? 0.5 : 1 }]} onPress={() => setChapter((Number(chapter) - 1).toString())} disabled={Number(chapter) <= 0}>
                        <Minus size={24} color={colors.icon} />
                    </AnimatedPressable>
                    <View style={styles.chapterContainer}>
                        <View
                            style={[
                                styles.chapterInputContainer,
                                {
                                    backgroundColor: colors.accent + '15',
                                    borderColor: colors.accent + '40',
                                },
                            ]}
                        >
                            <Text style={[typography.categoryTitle, { color: colors.accent }]}>{"#"}</Text>
                            <TextInput
                                style={[typography.categoryTitle, styles.chapterInput, { color: colors.accent }]}
                                inputMode='numeric'
                                keyboardType='numeric'
                                numberOfLines={1}
                                value={chapter}
                                onChangeText={handleInputChange}
                                selectTextOnFocus
                            />
                        </View>
                        <Text style={[typography.slashSeparator, { color: colors.text }]}>/</Text>
                        <Text style={[typography.categoryTitle, { color: colors.text }]}>{"#"}{book.chapters?.toString() ?? '?'}</Text>
                    </View>
                    <AnimatedPressable
                        style={[
                            styles.chapterActionButton,
                            {
                                borderColor: colors.border,
                                backgroundColor: colors.backButtonBackground,
                                opacity:
                                    (book.chapters !== null && Number(chapter) >= (book.chapters ?? 0)) ||
                                    Number(chapter) >= 999999
                                        ? 0.5
                                        : 1,
                            },
                        ]}
                        onPress={() => setChapter((Number(chapter) + 1).toString())}
                        disabled={
                            (book.chapters !== null && Number(chapter) >= (book.chapters ?? 0)) ||
                            Number(chapter) >= 999999
                        }
                    >
                        <Plus size={24} color={colors.icon} />
                    </AnimatedPressable>
                </View>
                <ProgressBar
                    current={Number(chapter)}
                    max={book.chapters ?? 0}
                    height={7}
                    showGlow={true}
                    progressColor={colors.reading}
                    completionColor={colors.completed}
                    style={{ marginBottom: 8 }}
                />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <View style={{ flex: 1 }}>
                            {lastReadTimeAgo && (
                                <Text style={[typography.caption, { color: colors.secondaryText }]}>
                                    {t("book.lastReadOn", { time: lastReadTimeAgo })}
                                </Text>
                            )}
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            {book.chapters === undefined || book.chapters === null ? (
                                <Text style={[typography.caption, { color: colors.secondaryText }]}>
                                    {book.type === 'comic' ? t("book.issuesLeft", { issues: "?" }) : t("book.chaptersLeft", { chapters: "?" })}
                                </Text>
                            ) : book.chapters > Number(chapter) ? (
                                <Text style={[typography.caption, { color: colors.secondaryText }]}>
                                    {book.type === 'comic' ? t("book.issuesLeft", { issues: (book.chapters - Number(chapter)).toString() }) : t("book.chaptersLeft", { chapters: (book.chapters - Number(chapter)).toString() })}
                                </Text>
                            ) : (
                                <Animated.Text style={[typography.caption, animatedTextStyle]}>
                                    {t("status.completed")}
                                </Animated.Text>
                            )}
                        </View>
                    </View>
                <Button title={t("save")} onPress={handleSave} style={{ marginTop: 36 }} />
            </View>
        </TrueSheet>
    );
});

export default SetChapterBottomSheet;

const styles = StyleSheet.create({
    bottomSheetContent: {
        padding: 24,
    },
    titleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        marginBottom: 32,
        gap: 8,
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
        overflow: 'hidden',
        width: 225,
        gap: 4,
    },
    chapterInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1.5,
    },
    chapterInput: {
        minWidth: 20,
        textAlign: 'center',
    },
});
