import React, { forwardRef, useRef, useCallback, useState } from "react";
import { View, Text, Image, ViewStyle, StyleSheet, Pressable } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import Animated, { useAnimatedStyle, interpolate, Extrapolation, FadeIn, FadeOut } from 'react-native-reanimated';
import { Book } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useTypography } from "@/hooks/useTypography";
import { PlusIcon, ShareIcon, StarIcon, BookImageIcon, MinusIcon, Clock3, BookOpenIcon, BookCheck, Pause, Square } from "lucide-react-native";
import { useTrackedBooksStore } from "@/state/tracked-books-store";

interface BookActionsBottomSheetProps {
    book: Book;
    snapPoints?: string[];
    index?: number;
    onDismiss?: () => void;
    backdropDismiss?: boolean;
}

const VIEW_ACTIONS = "actions";
const VIEW_STATUS_EDITOR = "status_editor";

const BookActionsBottomSheet = forwardRef<BottomSheetModal, BookActionsBottomSheetProps>(({ book, snapPoints, index, onDismiss, backdropDismiss }, ref) => {
    const { colors } = useTheme();
    const typography = useTypography();
    const { isBookTracked } = useTrackedBooksStore();
    const isTracking = isBookTracked(book.id);
    const [currentView, setCurrentView] = useState(VIEW_ACTIONS);

    const handleDismiss = () => {
        setCurrentView(VIEW_ACTIONS); // Reset to default view on dismiss
        if (onDismiss) {
            onDismiss();
        }
    };

    const actions = [
        {
            label: "Ajouter à ma bibliothèque",
            icon: <PlusIcon size={16} color={colors.text} />,
            show: !isTracking,
        },
        {
            label: "Modifier le statut",
            icon: <BookOpenIcon size={16} color={colors.text} />,
            show: isTracking,
            onPress: () => setCurrentView(VIEW_STATUS_EDITOR),
        },
        {
            label: "Supprimer de ma bibliothèque",
            icon: <MinusIcon size={16} color={colors.text} />,
            show: isTracking,
        },
        {
            label: "Ajouter à une liste",
            icon: <PlusIcon size={16} color={colors.text} />,
            show: true,
        },
        {
            label: "Noter",
            icon: <StarIcon size={16} color={colors.text} />,
            show: true,
        },
        {
            label: "Changer de couverture",
            icon: <BookImageIcon size={16} color={colors.text} />,
            show: true,
        },
        {
            label: "Partager",
            icon: <ShareIcon size={16} color={colors.text} />,
            show: true,
        }
        
    ]

    const statusOptions = [
        {
            label: "En cours",
            icon: <BookOpenIcon size={16} strokeWidth={2.75} color={colors.text} />,
        },
        {
            label: "A lire",
            icon: <Clock3 size={16} strokeWidth={2.75} color={colors.text} />,
        },
        {
            label: "Complété",
            icon: <BookCheck size={16} strokeWidth={2.75} color={colors.text} />,
        },
        {
            label: "En pause",
            icon: <Pause size={16} strokeWidth={2.75} color={colors.text} />,
        },
        {
            label: "Abandonné",
            icon: <Square size={16} strokeWidth={2.75} color={colors.text} />,
        },
        

    ]

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
                {currentView === VIEW_ACTIONS && (
                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                        <View>
                            <View style={styles.bottomSheetHeader}>
                                <Image
                                    source={{ uri: book.cover_image }}
                                    style={{ width: 60, height: 60 * 1.5, borderRadius: 6, marginBottom: 10 }}
                                />
                                <View style={{ flexShrink: 1 }}>
                                    <Text style={[typography.h3, { color: colors.text }]} numberOfLines={2}>{book.title}</Text>
                                    <Text style={[typography.caption, { color: colors.secondaryText }]} numberOfLines={1}>{book.author}</Text>
                                    <View style={[styles.ratingContainer, { marginTop: 4 }]}> 
                                        <Ionicons name="star" size={14} color={colors.text} />
                                        <Text style={[typography.caption, { color: colors.secondaryText }]}> {book.rating || 'N/A'}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.bottomSheetActions}>
                                {actions.map((action, idx) => (
                                    action.show && (
                                        <Pressable key={idx} style={[styles.actionButton, { backgroundColor: colors.actionButton }]} onPress={action.onPress}>
                                            {action.icon}
                                            <Text style={[typography.caption, { color: colors.text }]}>{action.label}</Text>
                                        </Pressable>
                                    )
                                ))}
                            </View>
                        </View>
                    </Animated.View>
                )}

                {currentView === VIEW_STATUS_EDITOR && (
                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                        <View style={styles.statusEditorHeader}>
                            <Pressable onPress={() => setCurrentView(VIEW_ACTIONS)} style={[styles.backButton, { backgroundColor: colors.transparentBackground }]}>
                                <Ionicons name="arrow-back" size={24} color={colors.icon} />
                            </Pressable>
                            <Text style={[typography.h3, { color: colors.text, textAlign: 'center' }]}>Modifier le statut</Text>
                        </View>
                        <View style={styles.bottomSheetActions}>
                            {statusOptions.map((option, idx) => (
                                <Pressable key={idx} style={[styles.actionButton, { backgroundColor: colors.actionButton }]} onPress={() => {}}>
                                    {option.icon}
                                    <Text style={[typography.caption, { color: colors.text }]}>{option.label}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </Animated.View>
                )}
            </BottomSheetView>
        </BottomSheetModal>
    )
});

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
    bottomSheetHeader: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 16,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    ratingText: {
        fontSize: 12,
        marginLeft: 4,
    },
    bottomSheetActions: {
        flexDirection: "column",
        gap: 10,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 16,
        borderRadius: 16,
    },
    statusEditorHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 64,
    },
    backButton: {
        position: "absolute",
        left: 0,
        borderRadius: 25,
        padding: 8,
    },
    statusOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: "center",
    }
  });

export default BookActionsBottomSheet;
