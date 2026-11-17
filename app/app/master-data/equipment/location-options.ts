import type { LocationItem } from "./use-locations";

export function mergeLocationItems(
  items: LocationItem[],
  selectedItems: LocationItem[],
  selectedValue?: string,
): LocationItem[] {
  const key = (item: LocationItem) => item.id || item.code || item.name;
  const merged = new Map(items.map((item) => [key(item), item]));
  // Disabled selection queries may still contain the cached, unfiltered list.
  // Retain only the selected label, after the current search results.
  if (selectedValue) {
    for (const item of selectedItems) {
      if (
        (item.id === selectedValue || item.code === selectedValue) &&
        !merged.has(key(item))
      ) {
        merged.set(key(item), item);
      }
    }
  }
  return [...merged.values()];
}
