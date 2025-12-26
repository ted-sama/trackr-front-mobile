import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useTranslation } from "react-i18next";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import { useUserBooks } from "@/hooks/queries/users";
import BookCard from "@/components/BookCard";
import { Book, TrackedBookWithMeta } from "@/types/book";

interface AuthorData {
  label: string;
  value: number;
}

interface AuthorsChartProps {
  data: AuthorData[];
  username?: string;
}

export function AuthorsChart({ data, username }: AuthorsChartProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const router = useRouter();
  const { getTrackedBooks } = useTrackedBooksStore();
  const { data: userBooks } = useUserBooks(username);

  const topAuthors = useMemo(
    () => data.sort((a, b) => b.value - a.value).slice(0, 6),
    [data]
  );

  const booksByAuthor = useMemo(() => {
    const books: TrackedBookWithMeta[] = username && userBooks ? userBooks : getTrackedBooks();
    const grouped: Record<string, TrackedBookWithMeta[]> = {};

    books.forEach((book) => {
      if (book.authors && book.authors.length > 0) {
        book.authors.forEach((author) => {
          if (!grouped[author.name]) grouped[author.name] = [];
          grouped[author.name].push(book);
        });
      }
    });

    return grouped;
  }, [username, userBooks, getTrackedBooks]);

  const handleBookPress = (book: Book) => {
    router.push(`/book/${book.id}`);
  };

  if (!topAuthors.length) return null;

  return (
    <View style={styles.container}>
      <Text style={[typography.bodyCaption, { color: colors.secondaryText, marginBottom: 12 }]}>
        {t("stats.authors.chartTitle")}
      </Text>
      <View style={styles.authorsList}>
        {topAuthors.map((author) => {
          const authorBooks = booksByAuthor[author.label] || [];

          return (
            <View key={author.label} style={styles.authorSection}>
              <View style={styles.authorRow}>
                <Text style={[typography.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {author.label}
                </Text>
                <Text style={[typography.caption, { color: colors.secondaryText }]}>
                  {author.value > 1 ? t("stats.authors.series", { count: author.value }) : t("stats.authors.serie", { count: author.value })}
                </Text>
              </View>

              {authorBooks.length > 0 && (
                <FlatList
                  data={authorBooks}
                  keyExtractor={(item) => String(item.id)}
                  numColumns={5}
                  scrollEnabled={false}
                  columnWrapperStyle={styles.booksRow}
                  contentContainerStyle={styles.booksGrid}
                  renderItem={({ item }) => (
                    <BookCard
                      book={item}
                      onPress={handleBookPress}
                      size="compact-xs"
                      showTitle={false}
                      showAuthor={false}
                      showRating={false}
                      showTrackingButton={false}
                      showTrackingStatus={false}
                    />
                  )}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  authorsList: {
    gap: 24,
  },
  authorSection: {
    gap: 12,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  booksGrid: {
    marginTop: 4,
  },
  booksRow: {
    gap: 8,
  },
});
