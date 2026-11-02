import PushNotification from "react-native-push-notification";

/** Old builds scheduled a repeating outfit prompt as notification 1. */
export function cancelLegacyLoggingReminder(): void {
  PushNotification.cancelLocalNotification("1");
  PushNotification.removeDeliveredNotifications(["1"]);
}

export function updateLaundryReminder(count: number, enabled: boolean): void {
  PushNotification.cancelLocalNotification("2");
  if (!enabled || count <= 0) return;
  PushNotification.createChannel(
    { channelId: "channel-id-1", channelName: "Wardrobe Atlas" },
    () => undefined,
  );
  PushNotification.localNotificationSchedule({
    channelId: "channel-id-1",
    message: `You have ${count} item${count === 1 ? "" : "s"} needing laundry`,
    title: "Laundry Reminder",
    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    repeatType: "day",
    repeatTime: 1,
    id: "2",
    allowWhileIdle: true,
    ignoreInForeground: true,
    color: "#111111",
  });
}
