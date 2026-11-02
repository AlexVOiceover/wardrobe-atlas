import { ScrollView } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { localization as l } from "../../utils/localization";
import { theme } from "../../utils/theme";
import { ThemeView } from "../../components/ThemeView";
import { PageHeader } from "../../components/PageHeader";
import { ListRow } from "../../components/ListRow";
export const More = ({ navigation }: { navigation: any }) => {
  const { language } = useSelector((s: RootState) => s.settings);
  const rows = [
    {
      title: l.Wardrobes,
      icon: "file-tray-stacked-outline",
      route: "Wardrobes",
    },
    { title: l.Collections, icon: "albums-outline", route: "CollectionForm" },
    {
      title: l.Categories,
      icon: "pricetags-outline",
      route: "ManageCategories",
    },
    { title: l.ClosetInfo, icon: "stats-chart-outline", route: "ClosetInfo" },
    { title: l.Settings, icon: "settings-outline", route: "Settings" },
  ];
  return (
    <ThemeView>
      <PageHeader back={false} title={l.More[language]} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: theme.spacing.md }}
      >
        {rows.map(row => (
          <ListRow
            key={row.route}
            title={row.title[language]}
            icon={row.icon}
            onPress={() => navigation.navigate(row.route)}
          />
        ))}
      </ScrollView>
    </ThemeView>
  );
};
