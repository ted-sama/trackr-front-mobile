import React, { forwardRef, useRef, useCallback } from "react";
import { View, Text, Image, ViewStyle, StyleSheet, Pressable } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { Book } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useTypography } from "@/hooks/useTypography";
import { PlusIcon, ShareIcon, StarIcon, BookImageIcon, MinusIcon, BookOpenIcon } from "lucide-react-native";
import { useTrackedBooksStore } from "@/state/tracked-books-store";

interface BookActionsBottomSheetProps {
    book: Book;
    snapPoints?: string[];
    index?: number;
    onDismiss?: () => void;
    backdropDismiss?: boolean;
}

const BookActionsBottomSheet = forwardRef<BottomSheetModal, BookActionsBottomSheetProps>(({ book, snapPoints, index, onDismiss, backdropDismiss }, ref) => {
    const { colors } = useTheme();
    const typography = useTypography();
    const { isBookTracked } = useTrackedBooksStore();
    const isTracking = isBookTracked(book.id);

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
            onDismiss={onDismiss}
            backgroundStyle={{
                backgroundColor: colors.card,
                borderRadius: 25,
            }}
            handleIndicatorStyle={{ backgroundColor: colors.icon }}
            backdropComponent={renderBackdrop}
        >
            <BottomSheetView style={styles.bottomSheetContent}>
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
                    {actions.map((action, index) => (
                        action.show && (
                            <Pressable key={index} style={[styles.actionButton, { backgroundColor: colors.actionButton }]}>
                                {action.icon}
                                <Text style={[typography.caption, { color: colors.text }]}>{action.label}</Text>
                            </Pressable>
                        )
                    ))}
                </View>
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
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        padding: 16,
        borderRadius: 16,
    },
  });

export default BookActionsBottomSheet;
