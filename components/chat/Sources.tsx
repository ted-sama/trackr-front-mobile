import { View, Text, Image, ScrollView, Linking } from "react-native";
import * as WebBrowser from 'expo-web-browser';
import { useTypography } from "@/hooks/useTypography";
import PillButton from "@/components/ui/PillButton";
import { useTheme } from "@/contexts/ThemeContext";
import { Globe } from "lucide-react-native";
import { useTranslation } from "react-i18next";

interface SourceProps {
  sources: { url: string; title: string }[];
}

export default function Sources({ sources }: SourceProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  return (
    <View>
        <View style={{ marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Globe size={16} color={colors.secondaryText} />
                <Text style={[typography.caption, { color: colors.secondaryText }]}>{t('chat.sources')}</Text>
            </View>
            <Text style={[typography.caption, { color: colors.secondaryText }]}>
                {sources.length}
            </Text>
        </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -16 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {sources.map((source) => (
          <PillButton
            key={source.url}
            title={source.url.split("/")[2]}
            icon={
              <Image
                source={{
                  uri: `https://www.google.com/s2/favicons?domain=${source.url.split("/")[2]}&sz=16`,
                }}
                style={{ width: 16, height: 16 }}
              />
            }
            onPress={() => WebBrowser.openBrowserAsync(source.url)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
