import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { hexToRgba } from "@/utils/colors";
import { StatsSection } from "./StatsSection";
import { useTranslation } from "react-i18next";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import BookCard from "@/components/BookCard";
import { Book, TrackedBookWithMeta } from "@/types/book";

interface AuthorData {
  label: string;
  value: number;
}

interface AuthorsChartProps {
  data: AuthorData[];
  title: string;
}

export function AuthorsChart({ data, title }: AuthorsChartProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const router = useRouter();
  const { getTrackedBooks } = useTrackedBooksStore();

  const topAuthors = useMemo(
    () => data.sort((a, b) => b.value - a.value).slice(0, 6),
    [data]
  );

  const maxValue = useMemo(
    () => Math.max(...topAuthors.map((a) => a.value)),
    [topAuthors]
  );

  // Group books by author
  const booksByAuthor = useMemo(() => {
    const trackedBooks = getTrackedBooks();
    const grouped: Record<string, TrackedBookWithMeta[]> = {};

    trackedBooks.forEach((book) => {
      if (book.authors && book.authors.length > 0) {
        book.authors.forEach((author) => {
          if (!grouped[author.name]) {
            grouped[author.name] = [];
          }
          grouped[author.name].push(book);
        });
      }
    });

    return grouped;
  }, [getTrackedBooks]);

  const handleBookPress = (book: Book) => {
    router.push(`/book/${book.id}`);
  };

  if (!topAuthors.length) return null;

  return (
    <StatsSection title={title}>
      <Text
        style={[
          typography.bodyCaption,
          {
            color: colors.secondaryText,
            marginBottom: 12,
          },
        ]}
      >
        {t("stats.authors.chartTitle")}
      </Text>
      <View style={styles.authorsList}>
        {topAuthors.map((author) => {
          const authorBooks = booksByAuthor[author.label] || [];

          return (
            <View key={author.label} style={styles.authorSection}>
              <View style={styles.authorRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[typography.body, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {author.label}
                  </Text>
                  <View style={styles.funnelBarBackground}>
                    <View
                      style={[
                        styles.funnelBarFill,
                        {
                          width: `${(author.value / maxValue) * 100}%`,
                          backgroundColor: hexToRgba(colors.accent, 0.9),
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.secondaryText, marginLeft: 8, width: 50, textAlign: "right" },
                  ]}
                >
                  {author.value > 1 ? t("stats.authors.series", { count: author.value }) : t("stats.authors.serie", { count: author.value })}
                </Text>
              </View>

              {/* Books Grid */}
              {authorBooks.length > 0 && (
                <FlatList
                  data={authorBooks}
                  keyExtractor={(item) => String(item.id)}
                  numColumns={4}
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
    </StatsSection>
  );
}

const styles = StyleSheet.create({
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
  funnelBarBackground: {
    height: 8,
    backgroundColor: "rgba(100, 100, 100, 0.1)",
    borderRadius: 4,
    marginTop: 6,
    overflow: "hidden",
  },
  funnelBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  booksGrid: {
    marginTop: 4,
  },
  booksRow: {
    gap: 8,
  },
});

