import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useMemo } from "react";

export default function useHeatmap(itemLogs: string[]) {
  const storedEvents = useSelector((state: RootState) => state.itemsList.logs);
  const currentDate = new Date();

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(currentDate.getMonth() - 1);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const heatmapColor = useMemo(() => {
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

    // const filteredEventsMoreThanAMonthAgo = storedEvents.filter((x) => {
    //     const eventDate = new Date(JSON.parse(x.eventDate));
    //     return eventDate < oneMonthAgo;
    //   });

    if (filteredEventsLastWeek.length > 0) {
      return "Used this week";
    } else if (filteredEventsLastMonth.length > 0) {
      return "Used this month";
    } else {
      return "Not used this month";
    }
  }, [itemLogs, storedEvents]);
  return heatmapColor;
}
