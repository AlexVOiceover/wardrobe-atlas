import { Dispatch, SetStateAction } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { localization } from "../utils/localization";
import { BottomSheet } from "./BottomSheet";
import { ListRow } from "./ListRow";

/** Lists Unassigned and every wardrobe; choosing one moves the selection. */
export function MoveSheet({
  isOpen,
  setIsOpen,
  language,
  onMove,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  language: number;
  onMove: (wardrobe: { id: string; name: string }) => void;
}) {
  const wardrobes = useSelector((s: RootState) => s.itemsList.wardrobes ?? []);
  return (
    <BottomSheet
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={localization.MoveTo[language]}
    >
      {[{ id: "", name: localization.Unassigned[language] }, ...wardrobes].map(
        wardrobe => (
          <ListRow
            key={wardrobe.id || "unassigned"}
            title={wardrobe.name}
            onPress={() => {
              setIsOpen(false);
              onMove(wardrobe);
            }}
          />
        ),
      )}
    </BottomSheet>
  );
}
