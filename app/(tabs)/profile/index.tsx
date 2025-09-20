import { useUserStore } from "@/stores/userStore";
import { View, Text } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import Avatar from "@/components/ui/Avatar";
import PlusBadge from "@/components/ui/PlusBadge";

export default function Profile() {
  const { currentUser } = useUserStore();
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <View>
      <View>
        <View
          style={{
            position: "relative",
            width: "110%",
            height: 275,
            alignSelf: "center",
            marginHorizontal: -16,
            zIndex: -99,
          }}
        >
          {currentUser?.backdropMode === "image" &&
          currentUser?.backdropImage ? (
            <MaskedView
              style={{ flex: 1 }}
              maskElement={
                <LinearGradient
                  colors={["rgba(0,0,0,1)", "rgba(0,0,0,0)"]}
                  style={{ flex: 1 }}
                />
              }
            >
              <Image
                source={{ uri: currentUser?.backdropImage }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </MaskedView>
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: currentUser?.backdropColor || colors.accent,
              }}
            />
          )}
        </View>
        <View style={{ alignItems: "center", alignSelf: "center", paddingHorizontal: 16, marginTop: -40 }}>
            <Avatar image={currentUser?.avatar || ""} size={80} borderWidth={4} borderColor={colors.background} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 16 }}>
                <Text numberOfLines={1} ellipsizeMode="clip" style={[typography.h1, { color: colors.text, textAlign: "center", maxWidth: 250 }]}>
                    {currentUser?.username}
                </Text>
                {currentUser?.plan === "plus" && (
                    <PlusBadge />
                )}
            </View>
        </View>
      </View>
    </View>
  );
}
