import React, { useState, useEffect } from "react";
import { View, Text, FlatList } from "react-native";
import { useTypography } from "@/hooks/useTypography";
import { useTheme } from "@/contexts/ThemeContext";
import ChapterListElement from "@/components/ChapterListElement";
import { Chapter, ChapterResponse } from "@/types";
import { useLocalSearchParams } from "expo-router";
import { getChaptersFromSource } from "@/api";

export default function ChapterList() {
    const { bookId, sourceId } = useLocalSearchParams();
    const typography = useTypography();
    const { colors } = useTheme();
    const [chapters, setChapters] = useState<Chapter[]>([]);

    useEffect(() => {
        const fetchChapters = async () => {
            const chaptersResponse: ChapterResponse = await getChaptersFromSource(bookId as string, sourceId as string);
            setChapters(chaptersResponse.items.sort((a, b) => parseInt(b.chapter) - parseInt(a.chapter)));
        }
        fetchChapters();
    }, [bookId, sourceId])
    return (
        <View style={{ flex: 1, justifyContent: 'flex-start', paddingTop: 22, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
                <Text style={[typography.h3, { color: colors.text }]}>Chapitres</Text>
            </View>
            <FlatList
                data={chapters}
                renderItem={({ item }) => <ChapterListElement chapter={item} />}
                keyExtractor={(item) => item.id.toString()}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                contentContainerStyle={{ paddingBottom: 64 }}
                showsVerticalScrollIndicator={true}
            />
      </View>
    )
}
