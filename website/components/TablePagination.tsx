import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TablePaginationProps {
  totalItems: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function TablePagination({
  totalItems,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  pageSizeOptions = [5, 10, 25, 50],
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--admin-border)] text-xs text-[var(--admin-muted)]',
        className
      )}
    >
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[var(--admin-elevated)] text-[var(--admin-fg)] rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <span>
          Showing <strong className="text-[var(--admin-fg)] font-semibold">{startItem}–{endItem}</strong> of{' '}
          <strong className="text-[var(--admin-fg)] font-semibold">{totalItems}</strong> entries
        </span>
      </div>

      <div className="flex items-center gap-1.5 p-1 rounded-full bg-[var(--admin-elevated)]">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => setCurrentPage(1)}
          className="h-7 w-7 p-0 rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] disabled:opacity-40"
          title="First Page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          className="h-7 w-7 p-0 rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] disabled:opacity-40"
          title="Previous Page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <span className="px-2.5 text-xs font-semibold text-[var(--admin-fg)] select-none">
          Page {safePage} of {totalPages}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          className="h-7 w-7 p-0 rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] disabled:opacity-40"
          title="Next Page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className="h-7 w-7 p-0 rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] disabled:opacity-40"
          title="Last Page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default TablePagination;