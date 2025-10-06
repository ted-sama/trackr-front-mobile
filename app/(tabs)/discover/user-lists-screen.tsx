import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ActivityIndicator , RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LegendList } from "@legendapp/list";
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from "@/hooks/useTypography";
import { useLists } from '@/hooks/queries/lists';
import CollectionListElement from "@/components/CollectionListElement";

interface UserListsHeaderProps {
  colors: any;
  typography: any;
}

const UserListsHeader: React.FC<UserListsHeaderProps> = React.memo(
  ({ colors, typography }) => {
    const { t } = useTranslation();
    return (
      <View style={styles.headerContainer}>
        <Text style={[typography.categoryTitle, { color: colors.text }]}>{t("discover.lists.header")}</Text>
        <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 4 }]}>
          {t("discover.lists.description")}
        </Text>
      </View>
    );
  }
);
UserListsHeader.displayName = 'UserListsHeader';

export default function UserListsScreen() {
  const { colors } = useTheme();
  const typography = useTypography();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  const { data: listsData, isLoading, error, refetch } = useLists();
  const lists = (listsData || []).filter(list => list.isPublic);
  
  useEffect(() => {
    if (listsData) setHasLoadedOnce(true);
  }, [listsData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const renderListHeader = useCallback(() => (
    <UserListsHeader
      colors={colors}
      typography={typography}
    />
  ), [colors, typography]);

  if (error && !hasLoadedOnce && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["right", "left"]}>
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <Text style={[typography.h3, { color: colors.text, textAlign: 'center' }]}>
            Erreur de chargement
          </Text>
          <Text style={[typography.body, { color: colors.secondaryText, textAlign: 'center', marginTop: 8 }]}>
            {error.message}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["right", "left"]}>
      <View style={styles.content}>
        <LegendList
          data={lists}
          ListHeaderComponent={renderListHeader}
          renderItem={({ item }) => (
            <CollectionListElement 
              list={item}
              showDescription
              onPress={() => {
                router.push(`/list/${item.id}`);
              }} 
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          recycleItems
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            !isLoading || hasLoadedOnce ? (
              <View style={styles.emptyContainer}>
                <Text style={[typography.h3, { color: colors.text, textAlign: 'center' }]}>
                  Aucune liste trouvée
                </Text>
                <Text style={[typography.body, { color: colors.secondaryText, textAlign: 'center', marginTop: 8 }]}>
                  Il n&apos;y a pas encore de listes publiques à afficher.
                </Text>
              </View>
            ) : (
              <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 16,
  },
  listContainer: {
    paddingTop: 20,
    paddingBottom: 128,
    paddingHorizontal: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyContainer: {
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
}); 