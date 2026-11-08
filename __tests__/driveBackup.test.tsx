import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import {
  DriveError,
  backupFileName,
  backupFolder,
  pruneBackups,
  uploadBackup,
} from "../utils/driveBackup";

const mockDispatch = jest.fn();
const mockState = { settings: { driveLastBackupAt: undefined as any } };
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select(mockState),
  useDispatch: () => mockDispatch,
}));
jest.mock("react-native-paper", () => ({ Button: "Button" }));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("../components/BottomSheet", () => ({ BottomSheet: "BottomSheet" }));
jest.mock("../components/ConfirmationDialog", () => ({
  ConfirmationDialog: "Dialog",
}));
jest.mock("../components/ListRow", () => ({ ListRow: "ListRow" }));
const mockNetwork = { type: "wifi" };
jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: { fetch: () => Promise.resolve(mockNetwork) },
}));
const mockGoogle = {
  getCurrentUser: jest.fn(),
  hasPreviousSignIn: jest.fn(() => false),
  signInSilently: jest.fn(),
  signIn: jest.fn(),
  hasPlayServices: jest.fn(() => Promise.resolve(true)),
  getTokens: jest.fn(),
  clearCachedAccessToken: jest.fn(() => Promise.resolve(null)),
  revokeAccess: jest.fn(() => Promise.resolve(null)),
  signOut: jest.fn(() => Promise.resolve(null)),
  configure: jest.fn(),
};
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: mockGoogle,
}));
jest.mock("../utils/exportStoreToJson", () => ({
  backupText: () => '{"formatVersion":1}',
}));
const mockApplyBackup = jest.fn();
jest.mock("../utils/importStoreFromJson", () => ({
  applyBackup: (...args: unknown[]) => mockApplyBackup(...args),
}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// A fake Drive: answers each request in turn and records what was asked.
let calls: { url: string; init: any }[] = [];
const respond = (answers: any[]) => {
  calls = [];
  (globalThis as any).fetch = jest.fn((url: string, init: any) => {
    calls.push({ url, init });
    const answer = answers.shift() ?? {};
    return Promise.resolve({
      ok: (answer.status ?? 200) < 400,
      status: answer.status ?? 200,
      json: () => Promise.resolve(answer.json ?? {}),
      text: () => Promise.resolve(answer.text ?? ""),
      headers: { get: () => answer.location },
    });
  });
};
const file = (id: string, createdTime: string) => ({
  id,
  name: `wardrobe-atlas-${id}.json`,
  size: "2097152",
  createdTime,
});

beforeEach(() => {
  mockDispatch.mockReset();
  mockApplyBackup.mockReset();
  Object.values(mockGoogle).forEach(fn => (fn as jest.Mock).mockClear());
  mockGoogle.getCurrentUser.mockReturnValue(null);
  mockGoogle.getTokens.mockResolvedValue({ accessToken: "token-1" });
  mockNetwork.type = "wifi";
});

describe("Drive calls", () => {
  test("backup files are named by date and time", () => {
    expect(backupFileName(new Date(2026, 10, 8, 9, 5))).toBe(
      "wardrobe-atlas-2026-11-08-0905.json",
    );
  });

  test("the folder is found, or created the first time", async () => {
    respond([{ json: { files: [{ id: "folder" }] } }]);
    expect(await backupFolder("t")).toBe("folder");
    expect(calls[0].url).toContain(
      encodeURIComponent("name = 'Wardrobe Atlas backups'"),
    );
    expect(calls[0].init.headers.Authorization).toBe("Bearer t");
    respond([{ json: { files: [] } }, { json: { id: "new" } }]);
    expect(await backupFolder("t")).toBe("new");
    expect(calls[1].init.method).toBe("POST");
    expect(JSON.parse(calls[1].init.body)).toEqual({
      name: "Wardrobe Atlas backups",
      mimeType: "application/vnd.google-apps.folder",
    });
  });

  test("an upload opens a resumable session in the folder, then sends the backup", async () => {
    respond([
      { location: "https://upload.example/session" },
      { json: { id: "file" } },
    ]);
    expect(await uploadBackup("t", "folder", "b.json", "{}")).toBe("file");
    expect(calls[0].url).toContain("uploadType=resumable");
    expect(JSON.parse(calls[0].init.body)).toMatchObject({
      name: "b.json",
      parents: ["folder"],
    });
    expect(calls[1]).toMatchObject({
      url: "https://upload.example/session",
      init: { method: "PUT", body: "{}" },
    });
  });

  test("only the newest 3 backups are kept", async () => {
    respond([
      {
        json: {
          files: [
            file("d", "2026-11-04"),
            file("c", "2026-11-03"),
            file("b", "2026-11-02"),
            file("a", "2026-11-01"),
          ],
        },
      },
      {},
    ]);
    expect(await pruneBackups("t", "folder")).toBe(1);
    expect(calls[1].url).toMatch(/files\/a$/);
    expect(calls[1].init.method).toBe("DELETE");
  });

  test("a failed request is a DriveError with its status", async () => {
    respond([{ status: 403 }, { status: 403 }]);
    await expect(backupFolder("t")).rejects.toMatchObject({ status: 403 });
    await expect(backupFolder("t")).rejects.toBeInstanceOf(DriveError);
  });

  test("an expired token is renewed once", async () => {
    const { withDriveToken } = require("../utils/googleAccount");
    mockGoogle.getTokens
      .mockResolvedValueOnce({ accessToken: "old" })
      .mockResolvedValueOnce({ accessToken: "new" });
    const work = jest
      .fn()
      .mockRejectedValueOnce(new DriveError(401, "expired"))
      .mockResolvedValueOnce("done");
    expect(await withDriveToken(work)).toBe("done");
    expect(mockGoogle.clearCachedAccessToken).toHaveBeenCalledWith("old");
    expect(work).toHaveBeenLastCalledWith("new");
  });
});

describe("Settings › Google Drive", () => {
  const { DriveBackup } = require("../components/DriveBackup");
  const onNotice = jest.fn();
  const open = async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(
        <DriveBackup language={0} onNotice={onNotice} syncDisplay={jest.fn()} />,
      );
    });
    return tree;
  };
  const button = (tree: ReactTestRenderer, label: string) =>
    tree.root
      .findAllByType("Button" as any)
      .find(b => b.props.children === label);
  const dialog = (tree: ReactTestRenderer, title: string) =>
    tree.root.findAllByType("Dialog" as any).find(d => d.props.title === title)!;
  const text = (tree: ReactTestRenderer) => JSON.stringify(tree.toJSON());
  const signedIn = () =>
    mockGoogle.getCurrentUser.mockReturnValue({
      user: { email: "me@example.com" },
    });

  beforeEach(() => onNotice.mockReset());

  test("not connected: Connect asks for the account, then shows the backup buttons", async () => {
    const tree = await open();
    expect(button(tree, "Back up now")).toBeUndefined();
    mockGoogle.signIn.mockResolvedValueOnce({
      type: "success",
      data: { user: { email: "me@example.com" } },
    });
    await act(async () =>
      button(tree, "Connect Google Drive")!.props.onPress(),
    );
    expect(text(tree)).toContain("me@example.com · last backup: never");
    expect(button(tree, "Back up now")).toBeDefined();
  });

  test("a failed connection says to check the setup", async () => {
    const tree = await open();
    mockGoogle.signIn.mockRejectedValueOnce(new Error("DEVELOPER_ERROR"));
    await act(async () =>
      button(tree, "Connect Google Drive")!.props.onPress(),
    );
    expect(text(tree)).toContain("Couldn't connect to Google");
  });

  test("Back up now on Wi-Fi uploads into the folder, keeps 3 and remembers when", async () => {
    signedIn();
    const tree = await open();
    respond([
      { json: { files: [{ id: "folder" }] } },
      { location: "https://upload.example/s" },
      { json: { id: "file" } },
      { json: { files: [] } },
    ]);
    await act(async () => button(tree, "Back up now")!.props.onPress());
    expect(calls[2].init.body).toBe('{"formatVersion":1}');
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "settings/setDriveLastBackup",
      payload: { at: expect.any(String) },
    });
    expect(onNotice).toHaveBeenCalledWith("Backed up to Google Drive");
  });

  test("off Wi-Fi it asks first and only uploads when confirmed", async () => {
    signedIn();
    mockNetwork.type = "cellular";
    const tree = await open();
    respond([]);
    await act(async () => button(tree, "Back up now")!.props.onPress());
    expect(calls).toHaveLength(0);
    expect(dialog(tree, "You're not on Wi-Fi").props.visible).toBe(true);
    expect(dialog(tree, "You're not on Wi-Fi").props.message).toContain(
      "0.1 MB",
    );
    respond([
      { json: { files: [{ id: "folder" }] } },
      { location: "https://upload.example/s" },
      { json: { id: "file" } },
      { json: { files: [] } },
    ]);
    await act(async () =>
      dialog(tree, "You're not on Wi-Fi").props.onConfirm(),
    );
    expect(onNotice).toHaveBeenCalledWith("Backed up to Google Drive");
  });

  test("Restore lists backups, asks, then replaces everything with the chosen one", async () => {
    signedIn();
    const tree = await open();
    respond([
      { json: { files: [{ id: "folder" }] } },
      { json: { files: [file("b", "2026-11-08T10:00:00Z")] } },
    ]);
    await act(async () => button(tree, "Restore from Drive")!.props.onPress());
    const rows = tree.root.findAllByType("ListRow" as any);
    expect(rows.map(r => r.props.subtitle)).toEqual(["2.0 MB"]);
    act(() => rows[0].props.onPress());
    expect(dialog(tree, "Restore this backup?").props.visible).toBe(true);
    respond([{ text: '{"backup":true}' }]);
    await act(async () =>
      dialog(tree, "Restore this backup?").props.onConfirm(),
    );
    expect(calls[0].url).toMatch(/files\/b\?alt=media$/);
    expect(mockApplyBackup.mock.calls[0][0]).toBe('{"backup":true}');
    expect(onNotice).toHaveBeenCalledWith("Restored from Google Drive");
  });

  test("a backup that isn't valid changes nothing and says so", async () => {
    signedIn();
    const tree = await open();
    respond([
      { json: { files: [{ id: "folder" }] } },
      { json: { files: [file("b", "2026-11-08T10:00:00Z")] } },
    ]);
    await act(async () => button(tree, "Restore from Drive")!.props.onPress());
    act(() => tree.root.findAllByType("ListRow" as any)[0].props.onPress());
    respond([{ text: "not json" }]);
    mockApplyBackup.mockRejectedValueOnce(new SyntaxError("bad"));
    await act(async () =>
      dialog(tree, "Restore this backup?").props.onConfirm(),
    );
    expect(text(tree)).toContain("Couldn't restore that backup");
  });

  test("losing the Google sign-in asks to connect again", async () => {
    signedIn();
    const tree = await open();
    mockGoogle.getTokens.mockRejectedValueOnce(new Error("signed out"));
    mockGoogle.getCurrentUser.mockReturnValue(null);
    await act(async () => button(tree, "Back up now")!.props.onPress());
    expect(text(tree)).toContain("Google Drive needs connecting again");
    expect(button(tree, "Connect Google Drive")).toBeDefined();
  });
});
