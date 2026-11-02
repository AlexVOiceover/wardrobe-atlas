import PushNotification from "react-native-push-notification";
import {
  cancelLegacyLoggingReminder,
  updateLaundryReminder,
} from "../utils/notifications";
import settingsReducer, { importSettings } from "../redux/settingsSlice";

jest.mock("react-native-push-notification", () => ({
  __esModule: true,
  default: {
    cancelLocalNotification: jest.fn(),
    removeDeliveredNotifications: jest.fn(),
    createChannel: jest.fn(),
    localNotificationSchedule: jest.fn(),
  },
}));
beforeEach(() => jest.clearAllMocks());

test("retires only the old logging alarm and its delivered notification", () => {
  cancelLegacyLoggingReminder();
  expect(PushNotification.cancelLocalNotification).toHaveBeenCalledWith("1");
  expect(PushNotification.cancelLocalNotification).toHaveBeenCalledTimes(1);
  expect(PushNotification.removeDeliveredNotifications).toHaveBeenCalledWith([
    "1",
  ]);
  expect(PushNotification.localNotificationSchedule).not.toHaveBeenCalled();
});

test.each([
  [0, true],
  [3, false],
])(
  "does not schedule reminders when laundry count=%s and enabled=%s",
  (count, enabled) => {
    updateLaundryReminder(count as number, enabled as boolean);
    expect(PushNotification.cancelLocalNotification).toHaveBeenCalledWith("2");
    expect(PushNotification.localNotificationSchedule).not.toHaveBeenCalled();
  },
);

test("laundry remains available without recreating logging prompts", () => {
  updateLaundryReminder(3, true);
  expect(PushNotification.createChannel).toHaveBeenCalled();
  expect(PushNotification.localNotificationSchedule).toHaveBeenCalledTimes(1);
  expect(PushNotification.localNotificationSchedule).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "2",
      repeatType: "day",
      title: "Laundry Reminder",
    }),
  );
});

test("old backups cannot reactivate logging reminders or change unrelated settings", () => {
  const legacy = {
    name: "Alex",
    language: 2,
    laundryNumber: 7,
    enableLaundry: false,
    enableReminder: true,
    collectionSortValue: "CUSTOM",
  };
  const imported = settingsReducer(undefined, importSettings(legacy));
  expect(imported.enableReminder).toBe(false);
  expect(imported.name).toBe("Alex");
  expect(imported.language).toBe(2);
  expect(imported.laundryNumber).toBe(7);
  expect(imported.enableLaundry).toBe(false);
  expect(settingsReducer(undefined, { type: "init" }).enableReminder).toBe(
    false,
  );
});
