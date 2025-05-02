import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, useWindowDimensions } from "react-native";
import { useTypography } from "@/hooks/useTypography";
import { useTheme } from "@/contexts/ThemeContext";
import ChapterListElement from "@/components/ChapterListElement";
import { Chapter, ChapterResponse } from "@/types";
import { useLocalSearchParams } from "expo-router";
import { getChaptersFromSource } from "@/api";
import ChapterListElementSkeleton from "@/components/skeleton-loader/ChapterListElementSkeleton";

export default function ChapterList() {
    const { bookId, sourceId } = useLocalSearchParams();
    const typography = useTypography();
    const { colors } = useTheme();
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const limit = 20;
    const { height } = useWindowDimensions();

    const fetchChapters = useCallback(async (newOffset = 0, append = false) => {
        if (!bookId || !sourceId) return;
        if (append) setIsFetchingMore(true); else setIsLoading(true);
        try {
            const chaptersResponse: ChapterResponse = await getChaptersFromSource(
                bookId as string,
                sourceId as string,
                'desc',
                newOffset,
                limit
            );
            setTotal(chaptersResponse.total);
            setOffset(newOffset + chaptersResponse.items.length);
            setChapters(prev => append ? [...prev, ...chaptersResponse.items] : chaptersResponse.items);
        } finally {
            if (append) setIsFetchingMore(false); else setIsLoading(false);
        }
    }, [bookId, sourceId]);

    useEffect(() => {
        setChapters([]);
        setOffset(0);
        setTotal(0);
        fetchChapters(0, false);
    }, [bookId, sourceId, fetchChapters]);

    const handleEndReached = () => {
        if (isFetchingMore || isLoading) return;
        if (chapters.length >= total) return;
        fetchChapters(offset, true);
    };

    // Génère plusieurs skeletons pour le chargement principal ou le footer
    const renderSkeletons = (count: number) => (
        <View style={{ marginTop: 12 }}>
            {Array.from({ length: count }).map((_, idx) => (
                <View key={idx} style={{ marginBottom: 12 }}>
                    <ChapterListElementSkeleton />
                </View>
            ))}
        </View>
    );

    return (
        <View style={{ flex: 1, justifyContent: 'flex-start', paddingTop: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
                <Text style={[typography.h3, { color: colors.text }]}>Chapitres</Text>
            </View>
            <View style={{ height: height - 150 }}>
            {isLoading ? (
                renderSkeletons(8)
            ) : (
                <FlatList
                    data={chapters}
                    renderItem={({ item }) => <ChapterListElement chapter={item} />}
                    keyExtractor={(item) => item.id.toString()}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 64, flexGrow: 1 }}
                    showsVerticalScrollIndicator={true}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.2}
                    ListFooterComponent={isFetchingMore ? renderSkeletons(2) : null}
                />
            )}
            </View>
        </View>
    )
}
