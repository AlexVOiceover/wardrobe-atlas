import type { item, logsType } from "../redux/itemsSlice";

export const RECENT_DAYS = 30;

const eventTime = (log: logsType) => {
  try {
    return new Date(JSON.parse(log.eventDate)).getTime();
  } catch {
    return NaN;
  }
};

/**
 * The most used garments, most uses first (ties keep list order). With
 * `since`, only outfits worn from then until `now` count. Unused garments are
 * left out.
 */
export function topUsed(
  garments: item[],
  logs: logsType[],
  {
    since,
    now = new Date(),
    limit = 5,
  }: { since?: Date; now?: Date; limit?: number } = {},
) {
  const counted = new Set(
    logs
      .filter(log => {
        if (!since) return true;
        const time = eventTime(log);
        return time >= since.getTime() && time <= now.getTime();
      })
      .map(log => log.eventId),
  );
  return garments
    .map(garment => ({
      garment,
      uses: (garment.logIds ?? []).filter(id => counted.has(id)).length,
    }))
    .filter(entry => entry.uses > 0)
    .sort((a, b) => b.uses - a.uses)
    .slice(0, limit)
    .map(entry => entry.garment);
}

/** The start of the last `days` days, counting back from `now`. */
export const daysAgo = (days: number, now = new Date()) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
