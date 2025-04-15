import { getBook } from "@/api";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Book } from "@/types";
import { Text, StyleSheet, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

export default function BookScreen() {
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const [book, setBook] = useState<Book | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const book = await getBook({ id: id as string });
                setBook(book);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Une erreur est survenue');
            } finally {
                setIsLoading(false);
            }
        };
        fetchBook();
    }, [id]);
    
    if (isLoading) {
        return <Text>Loading...</Text>;
    }

    if (error) {
        return <Text>Error: {error}</Text>;
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "right", "left"]}>
            <View style={styles.titleContainer}>
                <Image source={{ uri: book?.cover_image }} style={styles.image} />
                <View style={styles.titleTextContainer}>
                    <Text style={styles.title}>{book?.title}</Text>
                    <Text style={styles.author}>{book?.author}</Text>
                </View>
            </View>
            <Text>{book?.title}</Text>
            <Text>{book?.author}</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    titleContainer: {
        flexDirection: "row",
    },
    image: {
        width: 135,
        height: 202.5,
        borderRadius: 6,
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
    },
    titleTextContainer: {
        flexDirection: "column",
        justifyContent: "flex-end",
    },
});