export type Paged<T> = { rows: T[]; total: number; totalPages: number };

export function paginate<T>(rows: T[] | null, count: number | null, pageSize: number): Paged<T> {
  const total = count ?? 0;
  return { rows: rows ?? [], total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
