import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { ThemeView } from "../../components/ThemeView";
import { ThemeText } from "../../components/ThemeText";
import { PageHeader } from "../../components/PageHeader";
import { NameSheet } from "../../components/NameSheet";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import {
  addCategory,
  addTypeToCategory,
  delCategory,
  deleteType,
  renameCategory,
  renameType,
  restoreDefaultCategories,
} from "../../redux/categoriesSlice";
import { clearGarmentCategory, clearGarmentType } from "../../redux/itemsSlice";
import {
  categoryNamesOf,
  categoryTypes,
  nextCategoryIndex,
  typeNamesOf,
  visibleCategories,
} from "../../utils/categories";
import { localization } from "../../utils/localization";
import { theme } from "../../utils/theme";

/** Confirmation text for deleting a category or subcategory used by garments. */
export const deleteMessage = (
  question: string,
  garments: number,
  language: number,
) =>
  garments > 1
    ? `${question}\n${localization.GarmentsMoveToOther[language].replace(
        "{n}",
        String(garments),
      )}`
    : garments === 1
    ? `${question}\n${localization.GarmentMovesToOther[language]}`
    : question;

/**
 * The names must be filled in and differ, in each language, from the
 * siblings' names in that language.
 */
const namesError = (
  names: string[],
  siblings: string[][],
  required: string,
  language: number,
) =>
  names.some(name => !name)
    ? required
    : siblings.some(other =>
        other.some((name, i) => name.toLowerCase() === names[i].toLowerCase()),
      )
    ? localization.NameTaken[language]
    : undefined;

type Sheet =
  | { kind: "addCategory" }
  | { kind: "renameCategory"; index: number }
  | { kind: "addType"; category: number }
  | { kind: "renameType"; category: number; value: string };
type Deleting =
  | { kind: "category"; index: number }
  | { kind: "type"; category: number; value: string };

const Row = ({
  label,
  language,
  nested = false,
  expanded,
  onPress,
  onRename,
  onDelete,
}: {
  label: string;
  language: number;
  nested?: boolean;
  expanded?: boolean;
  onPress?: () => void;
  onRename: () => void;
  onDelete: () => void;
}) => (
  <View style={[styles.row, nested && styles.nested]}>
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={label}
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      disabled={!onPress}
      onPress={onPress}
      style={styles.label}
    >
      {expanded !== undefined && (
        <Icon
          name={expanded ? "chevron-down" : "chevron-forward"}
          size={18}
          color={theme.colors.muted}
        />
      )}
      <ThemeText numberOfLines={2} customStyle={styles.labelText}>
        {label}
      </ThemeText>
    </Pressable>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${localization.Rename[language]}: ${label}`}
      onPress={onRename}
      style={styles.action}
    >
      <Icon name="create-outline" size={22} color={theme.colors.text} />
    </Pressable>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${localization.Delete[language]}: ${label}`}
      onPress={onDelete}
      style={styles.action}
    >
      <Icon name="trash-outline" size={22} color={theme.colors.danger} />
    </Pressable>
  </View>
);

export function ManageCategories() {
  const dispatch = useDispatch();
  const categoryState = useSelector((s: RootState) => s.CategoryList);
  const garments = useSelector((s: RootState) => s.itemsList.items);
  const { language } = useSelector((s: RootState) => s.settings);
  const [open, setOpen] = useState<number[]>([]);
  const [sheet, setSheet] = useState<Sheet>();
  const [deleting, setDeleting] = useState<Deleting>();
  const categories = visibleCategories(categoryState, language);
  const allCategoryNames = categories.map(category =>
    categoryNamesOf(categoryState, category.index),
  );
  const typeNamesIn = (category: number) =>
    categoryTypes(categoryState, category, 0).map(type =>
      typeNamesOf(categoryState, category, type.value),
    );
  const affected = garments.filter(g =>
    deleting?.kind === "category"
      ? g.category === deleting.index
      : deleting?.kind === "type" &&
        g.category === deleting.category &&
        g.type === deleting.value,
  ).length;
  const sheetProps = (() => {
    switch (sheet?.kind) {
      case "addCategory":
        return {
          title: localization.Add_New_Category[language],
          initial: undefined,
          validate: (names: string[]) =>
            namesError(
              names,
              allCategoryNames,
              localization.CategoryNameRequired[language],
              language,
            ),
          onSave: (names: string[]) =>
            dispatch(
              addCategory({
                name: names,
                index: nextCategoryIndex(categoryState, garments),
              }),
            ),
        };
      case "renameCategory": {
        const initial = categoryNamesOf(categoryState, sheet.index);
        return {
          title: `${localization.Rename[language]}: ${initial[language]}`,
          initial,
          validate: (names: string[]) =>
            namesError(
              names,
              allCategoryNames.filter(
                (_, i) => categories[i].index !== sheet.index,
              ),
              localization.CategoryNameRequired[language],
              language,
            ),
          onSave: (names: string[]) =>
            dispatch(renameCategory({ index: sheet.index, name: names })),
        };
      }
      case "addType":
        return {
          title: localization.Add_Type[language],
          initial: undefined,
          validate: (names: string[]) =>
            namesError(
              names,
              typeNamesIn(sheet.category),
              localization.TypeNameRequired[language],
              language,
            ),
          onSave: (names: string[]) =>
            dispatch(
              addTypeToCategory({ index: sheet.category, labels: names }),
            ),
        };
      case "renameType": {
        const initial = typeNamesOf(categoryState, sheet.category, sheet.value);
        return {
          title: `${localization.Rename[language]}: ${initial[language]}`,
          initial,
          validate: (names: string[]) =>
            namesError(
              names,
              categoryTypes(categoryState, sheet.category, 0)
                .filter(type => type.value !== sheet.value)
                .map(type =>
                  typeNamesOf(categoryState, sheet.category, type.value),
                ),
              localization.TypeNameRequired[language],
              language,
            ),
          onSave: (names: string[]) =>
            dispatch(
              renameType({
                category: sheet.category,
                value: sheet.value,
                name: names,
              }),
            ),
        };
      }
      default:
        return undefined;
    }
  })();
  return (
    <ThemeView>
      <ConfirmationDialog
        visible={deleting !== undefined}
        setVisible={() => setDeleting(undefined)}
        message={deleteMessage(
          deleting?.kind === "type"
            ? localization.ConfirmDeleteType[language]
            : localization.ConfirmDeleteCategory[language],
          affected,
          language,
        )}
        onConfirm={() => {
          if (deleting?.kind === "category") {
            dispatch(delCategory({ index: deleting.index }));
            if (affected > 0)
              dispatch(clearGarmentCategory({ category: deleting.index }));
          } else if (deleting?.kind === "type") {
            const { category, value } = deleting;
            dispatch(deleteType({ category, value }));
            if (affected > 0) dispatch(clearGarmentType({ category, value }));
          }
        }}
      />
      <NameSheet
        isOpen={!!sheetProps}
        setIsOpen={value => {
          if (!(typeof value === "function" ? value(true) : value))
            setSheet(undefined);
        }}
        title={sheetProps?.title ?? ""}
        language={language}
        initial={sheetProps?.initial}
        validate={names => sheetProps?.validate(names)}
        onSave={names => sheetProps?.onSave(names)}
      />
      <PageHeader title={localization.Categories[language]} />
      <ScrollView contentContainerStyle={styles.content}>
        {categories.length === 0 && (
          <ThemeText>{localization.NoCategories[language]}</ThemeText>
        )}
        {categories.map(category => {
          const expanded = open.includes(category.index);
          return (
            <View key={category.index}>
              <Row
                label={category.label}
                language={language}
                expanded={expanded}
                onPress={() =>
                  setOpen(current =>
                    expanded
                      ? current.filter(index => index !== category.index)
                      : [...current, category.index],
                  )
                }
                onRename={() =>
                  setSheet({ kind: "renameCategory", index: category.index })
                }
                onDelete={() =>
                  setDeleting({ kind: "category", index: category.index })
                }
              />
              {expanded && (
                <>
                  {categoryTypes(categoryState, category.index, language).map(
                    type => (
                      <Row
                        key={type.value}
                        nested
                        label={type.label}
                        language={language}
                        onRename={() =>
                          setSheet({
                            kind: "renameType",
                            category: category.index,
                            value: type.value,
                          })
                        }
                        onDelete={() =>
                          setDeleting({
                            kind: "type",
                            category: category.index,
                            value: type.value,
                          })
                        }
                      />
                    ),
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${localization.Add_Type[language]}: ${category.label}`}
                    onPress={() =>
                      setSheet({ kind: "addType", category: category.index })
                    }
                    style={[styles.row, styles.nested, styles.add]}
                  >
                    <Icon name="add" size={20} color={theme.colors.text} />
                    <ThemeText>{localization.Add_Type[language]}</ThemeText>
                  </Pressable>
                </>
              )}
            </View>
          );
        })}
        <Button
          mode="outlined"
          style={styles.button}
          onPress={() => setSheet({ kind: "addCategory" })}
        >
          {localization.Add_New_Category[language]}
        </Button>
        <Button onPress={() => dispatch(restoreDefaultCategories())}>
          {localization.RestoreDefaultCategories[language]}
        </Button>
      </ScrollView>
    </ThemeView>
  );
}
const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  nested: {
    paddingLeft: theme.spacing.lg,
    minHeight: 48,
  },
  add: {
    gap: theme.spacing.sm,
  },
  label: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    minHeight: theme.touch,
  },
  labelText: {
    flex: 1,
  },
  action: {
    width: theme.touch,
    minHeight: theme.touch,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    marginTop: theme.spacing.md,
  },
});
