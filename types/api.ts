// Generic API shape
export type ApiList<T> = T[] | { data: T[] };
export type ApiOne<T> = T | { data: T };
