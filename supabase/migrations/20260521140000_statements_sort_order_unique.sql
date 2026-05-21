-- Add unique constraint on sort_order so the seed can use ON CONFLICT (sort_order).
create unique index if not exists statements_sort_order_unique
  on public.statements (sort_order);
