import { localization } from "../utils/localization";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useMemo } from "react";

export default function useHeatmap(itemLogs: string[]) {
  const storedEvents = useSelector((state: RootState) => state.itemsList.logs);
  const language = useSelector((s: RootState) => s.settings.language);
  const currentDate = new Date();

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(currentDate.getMonth() - 1);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recency = useMemo(() => {
    const filteredEventsLastMonth = storedEvents.filter(x => {
      const eventDate = new Date(JSON.parse(x.eventDate));
      return (
        eventDate >= oneMonthAgo &&
        eventDate <= currentDate &&
        eventDate < oneWeekAgo &&
        itemLogs?.includes(x.eventId)
      );
    });
    const filteredEventsLastWeek = storedEvents.filter(x => {
      const eventDate = new Date(JSON.parse(x.eventDate));
      return (
        eventDate >= oneWeekAgo &&
        eventDate <= currentDate &&
        itemLogs?.includes(x.eventId)
      );
    });

    if (filteredEventsLastWeek.length > 0) {
      return localization.UsedThisWeek[language];
    } else if (filteredEventsLastMonth.length > 0) {
      return localization.UsedThisMonth[language];
    } else {
      return localization.NotUsedThisMonth[language];
    }
  }, [itemLogs, storedEvents, language]);
  return recency;
}
