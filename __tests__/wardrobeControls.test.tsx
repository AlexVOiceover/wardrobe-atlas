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
  act(() => button("Guardar").props.onPress());
  expect(mockDispatch).not.toHaveBeenCalled();
  act(() =>
    tree!.root.findByType("TextInput" as any).props.onChangeText("Viajes"),
  );
  act(() => button("Cancelar").props.onPress());
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
