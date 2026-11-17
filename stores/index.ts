type StoreWithSelectors<T> = {
  use: {
    [K in keyof T]: () => T[K];
  };
};

export function createSelectors<T extends Record<string, unknown>>(
  store: T
): StoreWithSelectors<T> {
  const use = {} as StoreWithSelectors<T>["use"];
  for (const key of Object.keys(store) as (keyof T)[]) {
    (use as Record<string, unknown>)[key as string] = () => store[key];
  }
  return { use } as StoreWithSelectors<T>;
}
