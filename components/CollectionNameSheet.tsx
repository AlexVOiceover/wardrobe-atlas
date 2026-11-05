import { Dispatch, SetStateAction } from "react";
import type { CollectionTag } from "../redux/itemsSlice";
import { localization } from "../utils/localization";
import { TextNameSheet } from "./TextNameSheet";

/** Why a collection name can't be used; renaming may keep its own name. */
export const collectionNameError = (
  collections: CollectionTag[],
  name: string,
  current?: string,
) => {
  const wanted = name.trim().toLowerCase();
  if (!wanted) return "CollectionNameRequired" as const;
  const taken = collections.some(
    collection =>
      collection.label !== current && collection.label.toLowerCase() === wanted,
  );
  return taken ? ("NameTaken" as const) : undefined;
};

/** Asks for a name for a new or renamed collection. */
export function CollectionNameSheet({
  isOpen,
  setIsOpen,
  title,
  language,
  collections,
  initial = "",
  onSave,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  title: string;
  language: number;
  collections: CollectionTag[];
  initial?: string;
  onSave: (name: string) => void;
}) {
  return (
    <TextNameSheet
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={title}
      label={localization.Collection_name[language]}
      language={language}
      initial={initial}
      validate={name => {
        const problem = collectionNameError(
          collections,
          name,
          initial || undefined,
        );
        return problem ? localization[problem][language] : undefined;
      }}
      onSave={onSave}
    />
  );
}
