import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { Modal } from "react-native";
import {
  WardrobeProvider,
  WardrobeSelector,
  useWardrobeView,
} from "../components/WardrobeSelector";
import { Wardrobes } from "../screens/stackNav/Wardrobes";
import { TextNameSheet } from "../components/TextNameSheet";

const mockDispatch = jest.fn();
const mockState = {
  settings: { language: 1 },
  itemsList: {
    wardrobes: [{ id: "all", name: "Casa" }],
    items: [{ wardrobeId: "all", quantity: 3 }],
  },
};
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select(mockState),
  useDispatch: () => mockDispatch,
}));
jest.mock("../components/PageHeader", () => ({
  PageHeader: "PageHeader",
  HeaderIcon: "HeaderIcon",
}));
jest.mock("../components/ThemeView", () => ({ ThemeView: "ThemeView" }));
jest.mock("nanoid", () => ({ nanoid: () => "new" }));
jest.mock("../components/ConfirmationDialog", () => ({
  ConfirmationDialog: "ConfirmationDialog",
}));
// The latest arguments of usePreventRemove: whether leaving asks first.
const mockGuard = { prevent: false };
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ dispatch: jest.fn() }),
  usePreventRemove: (prevent: boolean) => {
    mockGuard.prevent = prevent;
  },
}));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-paper", () => ({
  Button: "Button",
  TextInput: "TextInput",
  RadioButton: { Group: "RadioGroup", Item: "RadioItem" },
}));

test("selector distinguishes All from real wardrobe IDs, uses Spanish and closes on Android Back", () => {
  const onChange = jest.fn();
  let tree: ReactTestRenderer;
  act(() => {
    tree = create(<WardrobeSelector all onChange={onChange} />);
  });
  // In forms the selector looks like the other fields.
  const opener = () =>
    tree!.root.find(
      n =>
        n.props.accessibilityLabel === "Armario: Todos los armarios" &&
        !!n.props.onPress,
    );
  act(() => opener().props.onPress());
  expect(
    tree!.root.findAllByType("RadioItem" as any).map(x => x.props.label),
  ).toEqual(["Todos los armarios", "Sin asignar", "Casa"]);
  act(() =>
    tree!.root
      .findByType("RadioGroup" as any)
      .props.onValueChange("wardrobe:all"),
  );
  expect(onChange).toHaveBeenLastCalledWith("all");
  act(() => opener().props.onPress());
  act(() => tree!.root.findByType(Modal).props.onRequestClose());
  expect(tree!.root.findByType(Modal).props.visible).toBe(false);
});

test("navigation context shares a selected wardrobe with creation and resets on a fresh session", () => {
  let view: ReturnType<typeof useWardrobeView>;
  function Probe() {
    view = useWardrobeView();
    return null;
  }
  let tree: ReactTestRenderer;
  act(() => {
    tree = create(
      <WardrobeProvider>
        <Probe />
      </WardrobeProvider>,
    );
  });
  act(() => view.select("all"));
  expect(view!.selected).toBe("all");
  act(() => tree!.unmount());
  act(() => {
    create(
      <WardrobeProvider>
        <Probe />
      </WardrobeProvider>,
    );
  });
  expect(view!.selected).toBeUndefined();
});

test("adding uses a name sheet that validates, and its Cancel just closes", () => {
  mockDispatch.mockClear();
  let tree: ReactTestRenderer;
  act(() => {
    tree = create(<Wardrobes />);
  });
  const button = (label: string) =>
    tree!.root
      .findAllByType("Button" as any)
      .find(x => x.props.children === label)!;
  const sheet = () => tree!.root.findByType(TextNameSheet);
  expect(sheet().props.isOpen).toBe(false);
  act(() => button("Añadir armario").props.onPress());
  expect(sheet().props.isOpen).toBe(true);
  expect(sheet().props.title).toBe("Añadir armario");
  // The page no longer guards leaving: Back closes the sheet first.
  expect(mockGuard.prevent).toBe(false);
  act(() => button("Guardar").props.onPress());
  expect(mockDispatch).not.toHaveBeenCalled();
  expect(JSON.stringify(tree!.toJSON())).toContain(
    "Introduce un nombre para el armario",
  );
  act(() =>
    tree!.root.findByType("TextInput" as any).props.onChangeText("casa"),
  );
  act(() => button("Guardar").props.onPress());
  expect(JSON.stringify(tree!.toJSON())).toContain(
    "Ya existe un armario con este nombre",
  );
  act(() => button("Cancelar").props.onPress());
  expect(sheet().props.isOpen).toBe(false);
  expect(mockDispatch).not.toHaveBeenCalled();
  act(() => button("Añadir armario").props.onPress());
  // Opening again starts empty.
  expect(tree!.root.findByType("TextInput" as any).props.value).toBe("");
  act(() =>
    tree!.root.findByType("TextInput" as any).props.onChangeText("Viajes"),
  );
  act(() => button("Guardar").props.onPress());
  expect(mockDispatch).toHaveBeenCalledWith({
    type: "itemsList/addWardrobe",
    payload: { name: "Viajes" },
  });
  expect(sheet().props.isOpen).toBe(false);
});

test("renaming opens the sheet with the name, and delete asks in the app's dialog", () => {
  mockDispatch.mockClear();
  let tree: ReactTestRenderer;
  act(() => {
    tree = create(<Wardrobes />);
  });
  const pressable = (label: string) =>
    tree!.root.find(
      n => n.props.accessibilityLabel === label && !!n.props.onPress,
    );
  // Its row says how many garments it holds.
  expect(JSON.stringify(tree!.toJSON())).toContain("1 prenda");
  act(() => pressable("Renombrar: Casa").props.onPress());
  const sheet = () => tree!.root.findByType(TextNameSheet);
  expect(sheet().props.title).toBe("Renombrar");
  expect(tree!.root.findByType("TextInput" as any).props.value).toBe("Casa");
  // Keeping its own name is allowed.
  act(() =>
    tree!.root.findByType("TextInput" as any).props.onChangeText("Casa 2"),
  );
  act(() =>
    tree!.root
      .findAllByType("Button" as any)
      .find(x => x.props.children === "Guardar")!
      .props.onPress(),
  );
  expect(mockDispatch).toHaveBeenLastCalledWith({
    type: "itemsList/renameWardrobe",
    payload: { id: "all", name: "Casa 2" },
  });
  mockDispatch.mockClear();
  const dialog = () =>
    tree!.root
      .findAllByType("ConfirmationDialog" as any)
      .find(d => d.props.title.startsWith("Eliminar"))!;
  expect(dialog().props.visible).toBe(false);
  act(() => pressable("Eliminar: Casa").props.onPress());
  expect(dialog().props.visible).toBe(true);
  expect(dialog().props.title).toBe("Eliminar: Casa");
  expect(mockDispatch).not.toHaveBeenCalled();
  act(() => dialog().props.onConfirm());
  expect(mockDispatch).toHaveBeenCalledWith({
    type: "itemsList/deleteWardrobe",
    payload: { id: "all" },
  });
});
