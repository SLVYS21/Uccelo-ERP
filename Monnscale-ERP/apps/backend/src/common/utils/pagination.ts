import type { Paginated } from '@Moonscale/shared';

export type PaginateInput = { page?: number; pageSize?: number };

export function normalizePagination(input: PaginateInput): { skip: number; take: number; page: number; pageSize: number } {
  const page = Math.max(1, Number(input.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(input.pageSize ?? 25)));
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}

export function paginate<T>(data: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return { data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
