import { ReactNode } from "react";
import { useNavigation } from "@react-navigation/native";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { localization } from "../utils/localization";
import { theme } from "../utils/theme";
import { ThemeText } from "./ThemeText";
export const HeaderIcon = ({
  name,
  label,
  onPress,
  badge = 0,
}: {
  name: string;
  label: string;
  onPress: () => void;
  badge?: number;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={badge > 0 ? `${label} (${badge})` : label}
    onPress={onPress}
    style={styles.icon}
  >
    <Icon name={name} size={24} color={theme.colors.onBar} />
    {badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
  </Pressable>
);
export const PageHeader = ({
  title,
  back = true,
  actions,
}: {
  title?: string;
  back?: boolean;
  actions?: ReactNode;
}) => {
  const navigation = useNavigation<any>();
  const language = useSelector((s: RootState) => s.settings.language);
  return (
    <View style={[styles.container, !back && styles.rootContainer]}>
      {back && (
        <HeaderIcon
          name="chevron-back"
          label={localization.Back[language]}
          onPress={() => {
            Keyboard.dismiss();
            navigation.goBack();
          }}
        />
      )}
      <ThemeText numberOfLines={1} customStyle={styles.title}>
        {title}
      </ThemeText>
      {actions}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.bar,
  },
  rootContainer: {
    paddingLeft: theme.spacing.md,
  },
  title: {
    flex: 1,
    color: theme.colors.onBar,
    fontSize: theme.type.title,
    fontWeight: "600",
  },
  icon: {
    width: theme.touch,
    height: theme.touch,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: theme.colors.onBar,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: theme.colors.bar,
    fontSize: 10,
    fontWeight: "600",
  },
});
