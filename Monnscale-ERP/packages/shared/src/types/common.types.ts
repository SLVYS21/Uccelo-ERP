/**
 * Standard paginated envelope returned by every list endpoint. The backend
 * helper `paginate(...)` builds this shape from a raw query result.
 */
export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Identifies the host record of a polymorphic relation (tasks, activities).
 * `type` is one of the `CrmEntity` values; `id` is the host document id.
 */
export interface MorphTarget {
  type: string;
  id: string;
}

/**
 * Generic option used by `<select>`-like form controls.
 */
export interface SelectOption<TValue = string> {
  value: TValue;
  label: string;
  color?: string | null;
  isSystem?: boolean;
}
