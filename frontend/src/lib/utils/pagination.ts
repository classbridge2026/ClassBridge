export function parsePage(raw: string | undefined, total: number, pageSize = 20) {
  const page = Math.max(1, Number(raw) || 1);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  return { page: safePage, pageSize, skip: (safePage - 1) * pageSize, totalPages };
}
