import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { router } from "expo-router";
import {
    MessageSquare,
    PenLine,
    Pencil,
    Trash2,
    AlertTriangle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { toast } from "sonner-native";

import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useBookReviews, useDeleteReview } from "@/hooks/queries/reviews";
import { BookReview } from "@/types/review";
import ReviewCard, {
    REVIEW_CARD_WIDTH,
    REVIEW_CARD_GAP,
    REVIEW_CARD_SIDE_SPACING,
} from "./ReviewCard";
import { useTranslation } from "react-i18next";
import SkeletonLoader from "@/components/skeleton-loader/SkeletonLoader";
import { useUserStore } from "@/stores/userStore";
import LikeButton from "@/components/ui/LikeButton";
import ActionButton from "@/components/ui/ActionButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { useToggleReviewLike } from "@/hooks/queries/reviews";

interface ReviewsSectionProps {
    bookId: string;
    isTracking?: boolean;
    onWriteReviewPress?: () => void;
}

export function ReviewsSection({
    bookId,
    isTracking,
    onWriteReviewPress,
}: ReviewsSectionProps) {
    const { colors, currentTheme } = useTheme();
    const typography = useTypography();
    const { t } = useTranslation();
    const { data, isLoading, error, isFetching } = useBookReviews(
        bookId,
        "popular",
        10
    );
    const { currentUser } = useUserStore();
    const deleteSheetRef = useRef<TrueSheet>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { mutateAsync: deleteReviewMutation } = useDeleteReview(bookId);

    // Check if current user already has a review for this book
    const userReview = useMemo(() => {
        if (!currentUser || !data?.reviews) return null;
        return data.reviews.find((review) => review.userId === currentUser.id);
    }, [data?.reviews, currentUser]);

    const hasExistingReview = Boolean(userReview);

    // Reorder reviews to show user's review first if it exists
    const orderedReviews = useMemo(() => {
        if (!data?.reviews) return [];
        if (!userReview) return data.reviews;
        
        // Filter out user's review from the list and put it first
        const otherReviews = data.reviews.filter((review) => review.id !== userReview.id);
        return [userReview, ...otherReviews];
    }, [data?.reviews, userReview]);

    const handleSeeAllPress = () => {
        router.push(`/book/${bookId}/reviews`);
    };

    const handleWriteReviewPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onWriteReviewPress?.();
    };

    const handleReviewItemPress = (reviewId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/book/${bookId}/reviews`);
    };

    const { mutate: toggleLike } = useToggleReviewLike(bookId);

    const handleLikePress = (reviewId: number, isLiked: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggleLike({ reviewId, isLiked });
    };

    const handleDeletePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        deleteSheetRef.current?.present();
    };

    const handleConfirmDelete = async () => {
        if (!userReview || isDeleting) return;
        setIsDeleting(true);
        try {
            await deleteReviewMutation(userReview.id);
            deleteSheetRef.current?.dismiss();
            toast.success(t("reviews.deleteSuccess"));
        } catch (error) {
            toast.error(t("reviews.deleteError"));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        deleteSheetRef.current?.dismiss();
    };

    const renderReviewItem = ({ item }: { item: BookReview }) => {
        // Check if this is the current user's own review
        const isOwnReview = currentUser?.id === item.userId;

        return (
            <View>
                <ReviewCard
                    review={item}
                    bookId={bookId}
                    onPress={() => handleReviewItemPress(item.id.toString())}
                />
                <View style={{ marginTop: 8, alignSelf: "flex-start" }}>
                    <LikeButton
                        isLiked={item.isLikedByMe}
                        count={item.likesCount}
                        onPress={() => handleLikePress(item.id, item.isLikedByMe)}
                        disabled={isOwnReview}
                    />
                </View>
            </View>
        );
    };

    // Always show the section if tracking (to allow writing reviews)
    const hasReviews = data?.reviews && data.reviews.length > 0;

    return (
        <View style={[styles.container, { borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <MessageSquare size={20} color={colors.text} fill={colors.text} strokeWidth={2} />
                    <Text
                        style={[
                            typography.categoryTitle,
                            { color: colors.text, marginLeft: 8 },
                        ]}
                    >
                        {t("book.reviews")}
                    </Text>
                    {data?.total != null && data.total > 0 && (
                        <>
                            <Text
                                style={{
                                    fontWeight: "900",
                                    marginHorizontal: 4,
                                    color: colors.secondaryText,
                                }}
                            >
                                ·
                            </Text>
                            <Text
                                style={[typography.caption, { color: colors.secondaryText }]}
                            >
                                {data.total}{" "}
                                {data.total === 1 ? t("common.review") : t("common.reviews")}
                            </Text>
                        </>
                    )}
                </View>
            </View>

            {/* Write/Edit Review Button - Only shown when tracking */}
            {isTracking && onWriteReviewPress && (
                hasExistingReview ? (
                    <View style={styles.reviewActions}>
                        <SecondaryButton
                            title={t("reviews.editReview")}
                            onPress={handleWriteReviewPress}
                            icon={<Pencil size={16} color={colors.secondaryButtonText} />}
                            style={{ flex: 1 }}
                        />
                        <Pressable
                            onPress={handleDeletePress}
                            style={[
                                styles.deleteButton,
                                {
                                    backgroundColor: currentTheme === "dark"
                                        ? "rgba(239, 68, 68, 0.15)"
                                        : "rgba(239, 68, 68, 0.1)",
                                },
                            ]}
                        >
                            <Trash2 size={18} color="#ef4444" />
                        </Pressable>
                    </View>
                ) : (
                    <SecondaryButton
                        title={t("reviews.writeReview")}
                        onPress={handleWriteReviewPress}
                        icon={<PenLine size={16} color={colors.secondaryButtonText} />}
                        style={{ marginBottom: 16 }}
                    />
                )
            )}

            {/* Reviews List - Horizontal Snap Scroll */}
            {isLoading ? (
                <View style={styles.skeletonContainer}>
                    <SkeletonLoader
                        width={REVIEW_CARD_WIDTH}
                        height={180}
                        style={{ borderRadius: 16 }}
                    />
                </View>
            ) : hasReviews ? (
                <FlatList
                    data={orderedReviews}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderReviewItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginHorizontal: -16 }}
                    contentContainerStyle={{
                        paddingHorizontal: REVIEW_CARD_SIDE_SPACING,
                    }}
                    ItemSeparatorComponent={() => (
                        <View style={{ width: REVIEW_CARD_GAP }} />
                    )}
                    snapToInterval={REVIEW_CARD_WIDTH + REVIEW_CARD_GAP}
                    snapToAlignment="start"
                    decelerationRate="fast"
                />
            ) : (
                <View style={styles.emptyState}>
                    <Text style={[typography.body, { color: colors.secondaryText }]}>
                        {t("reviews.noReviews")}
                    </Text>
                </View>
            )}

            {/* See All Button */}
            {hasReviews && (
                <ActionButton
                    title={t("book.seeAllReviews")}
                    onPress={handleSeeAllPress}
                    style={{ marginTop: 16 }}
                />
            )}

            {/* Delete Confirmation Bottom Sheet */}
            <TrueSheet
                ref={deleteSheetRef}
                detents={["auto"]}
                backgroundColor={colors.background}
                grabber={false}
            >
                <View style={styles.deleteSheetContent}>
                    <View
                        style={[
                            styles.deleteIconContainer,
                            {
                                backgroundColor: currentTheme === "dark"
                                    ? "rgba(239, 68, 68, 0.15)"
                                    : "rgba(239, 68, 68, 0.1)",
                            },
                        ]}
                    >
                        <AlertTriangle size={32} color="#ef4444" />
                    </View>
                    <Text style={[typography.h2, { color: colors.text, marginTop: 16, textAlign: "center" }]}>
                        {t("reviews.deleteConfirmTitle")}
                    </Text>
                    <Text style={[typography.body, { color: colors.secondaryText, marginTop: 8, textAlign: "center" }]}>
                        {t("reviews.deleteConfirmMessage")}
                    </Text>
                    <View style={styles.deleteSheetActions}>
                        <Pressable
                            onPress={handleCancelDelete}
                            style={[styles.cancelButton, { backgroundColor: colors.actionButton }]}
                        >
                            <Text style={[typography.bodyBold, { color: colors.text }]}>
                                {t("common.cancel")}
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={handleConfirmDelete}
                            disabled={isDeleting}
                            style={[styles.confirmDeleteButton, { opacity: isDeleting ? 0.6 : 1 }]}
                        >
                            <Trash2 size={16} color="#fff" />
                            <Text style={[typography.bodyBold, { color: "#fff", marginLeft: 6 }]}>
                                {isDeleting ? t("common.deleting") : t("reviews.deleteReview")}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </TrueSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderTopWidth: 1,
        marginTop: 24,
        paddingTop: 24,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    reviewActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
    },
    deleteButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    skeletonContainer: {
        marginBottom: 16,
    },
    emptyState: {
        paddingVertical: 24,
        alignItems: "center",
    },
    deleteSheetContent: {
        padding: 24,
        paddingBottom: 40,
        alignItems: "center",
    },
    deleteIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    deleteSheetActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 24,
        width: "100%",
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    confirmDeleteButton: {
        flex: 1,
        flexDirection: "row",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ef4444",
    },
});

export default React.memo(ReviewsSection);
