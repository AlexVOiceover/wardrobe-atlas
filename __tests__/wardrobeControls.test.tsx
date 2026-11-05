import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { Modal } from "react-native";
import {
  WardrobeProvider,
  WardrobeSelector,
  useWardrobeView,
} from "../components/WardrobeSelector";
import { Wardrobes } from "../screens/stackNav/Wardrobes";

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
jest.mock("../components/PageHeader", () => ({ PageHeader: "PageHeader" }));
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
  expect(tree!.root.findAllByType("Button" as any)[0].props.children).toBe(
    "Todos los armarios",
  );
  act(() => tree!.root.findAllByType("Button" as any)[0].props.onPress());
  expect(
    tree!.root.findAllByType("RadioItem" as any).map(x => x.props.label),
  ).toEqual(["Todos los armarios", "Sin asignar", "Casa"]);
  act(() =>
    tree!.root
      .findByType("RadioGroup" as any)
      .props.onValueChange("wardrobe:all"),
  );
  expect(onChange).toHaveBeenLastCalledWith("all");
  act(() => tree!.root.findAllByType("Button" as any)[0].props.onPress());
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

test("management validates blank names and cancellation never dispatches changes", () => {
  mockDispatch.mockClear();
  let tree: ReactTestRenderer;
  act(() => {
    tree = create(<Wardrobes />);
  });
  const button = (label: string) =>
    tree!.root
      .findAllByType("Button" as any)
      .find(x => x.props.children === label)!;
  act(() => button("Añadir armario").props.onPress());
  // An empty form leaves without asking; a typed name asks first.
  expect(mockGuard.prevent).toBe(false);
  act(() => button("Guardar").props.onPress());
  expect(mockDispatch).not.toHaveBeenCalled();
  act(() =>
    tree!.root.findByType("TextInput" as any).props.onChangeText("Viajes"),
  );
  expect(mockGuard.prevent).toBe(true);
  act(() => button("Cancelar").props.onPress());
  expect(mockGuard.prevent).toBe(false);
  expect(mockDispatch).not.toHaveBeenCalled();
  act(() => button("Añadir armario").props.onPress());
  act(() =>
    tree!.root.findByType("TextInput" as any).props.onChangeText("Viajes"),
  );
  act(() => button("Guardar").props.onPress());
  expect(mockDispatch).toHaveBeenCalledWith({
    type: "itemsList/addWardrobe",
    payload: { name: "Viajes" },
  });
});

test("renaming asks only once the name changes, and delete asks in the app's dialog", () => {
  mockDispatch.mockClear();
  let tree: ReactTestRenderer;
  act(() => {
    tree = create(<Wardrobes />);
  });
  const pressable = (label: string) =>
    tree!.root.find(
      n => n.props.accessibilityLabel === label && !!n.props.onPress,
    );
  act(() => pressable("Editar: Casa").props.onPress());
  expect(mockGuard.prevent).toBe(false);
  act(() =>
    tree!.root.findByType("TextInput" as any).props.onChangeText("Casa 2"),
  );
  expect(mockGuard.prevent).toBe(true);
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
  // The open rename of the deleted wardrobe closes with it.
  expect(tree!.root.findAllByType("TextInput" as any)).toHaveLength(0);
});
