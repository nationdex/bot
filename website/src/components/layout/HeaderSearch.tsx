import { AnimatePresence, m } from '@/lib/panel-motion';
import { ArrowRight, Search, X } from '@/components/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact';
import { Input } from '@/components/ui/input';
import { useMotionPref } from '@/hooks/useReducedMotion';
import { type SearchResult, searchAdmin, searchTypeLabels } from '@/lib/search';
import { cn } from '@/lib/utils';

type HeaderSearchProps = {
  onNavigate: (section: string, filterQuery?: string) => void;
  className?: string;
};

export default function HeaderSearch({ onNavigate, className }: HeaderSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchMotion = useMotionPref('searchMotion');
  const hoverFeedback = useMotionPref('hoverFeedback');

  const results = useMemo(() => searchAdmin(query), [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const selectResult = useCallback(
    (result: SearchResult) => {
      onNavigate(result.section, result.filterQuery);
      close();
    },
    [close, onNavigate]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
        return;
      }
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close]);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      selectResult(results[activeIndex]);
    }
  };

  return (
    <>
      <m.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={hoverFeedback ? { scale: 1.08, rotate: 8 } : undefined}
        whileTap={hoverFeedback ? { scale: 0.95 } : undefined}
        className={cn(
          'rounded-lg p-2 text-[var(--admin-muted)] transition-colors hover:bg-[var(--admin-accent)]/10 hover:text-[var(--admin-fg)]',
          className
        )}
        aria-label="Search admin panel"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Search className="h-5 w-5" />
      </m.button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <m.button
                  type="button"
                  aria-label="Close search"
                  initial={searchMotion ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  exit={searchMotion ? { opacity: 0 } : undefined}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
                  onClick={close}
                />

                <m.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Search"
                  initial={searchMotion ? { opacity: 0, y: -12, scale: 0.98 } : false}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={searchMotion ? { opacity: 0, y: -8, scale: 0.98 } : undefined}
                  transition={{ duration: 0.2 }}
                  className="fixed left-1/2 top-[max(1rem,12vh)] z-[101] w-[min(calc(100vw-1.5rem),34rem)] -translate-x-1/2 overflow-hidden rounded-xl bg-[var(--admin-panel)]"
                >
                  <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-3 py-2.5">
                    <Search className="h-4 w-4 shrink-0 text-[var(--admin-muted)]" />
                    <Input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => {
                        setQuery(e.currentTarget.value);
                        setActiveIndex(0);
                      }}
                      onKeyDown={handleInputKeyDown}
                      placeholder="Search whole panel (pages, settings, nations, users...)"
                      omitDefaults="h-10 px-3" className="h-9 flex-1 bg-transparent px-0 text-sm text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)]"
                    />
                    <button
                      type="button"
                      onClick={close}
                      className="rounded-md p-1 text-[var(--admin-muted)] hover:bg-[var(--admin-accent)]/10 hover:text-[var(--admin-fg)]"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <ul className="max-h-[min(55vh,24rem)] overflow-y-auto p-1.5">
                    {results.length > 0 ? (
                      results.map((result, index) => (
                        <li key={result.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => selectResult(result)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                              index === activeIndex
                                ? 'bg-[var(--admin-accent)]/10'
                                : 'hover:bg-[var(--admin-accent)]/5'
                            )}
                          >
                            <span className="shrink-0 rounded-md bg-[var(--admin-elevated)] px-2 py-0.5 text-[10px] font-medium tracking-wide text-[var(--admin-muted)]">
                              {searchTypeLabels[result.type] ?? 'Item'}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-[var(--admin-fg)]">
                                {result.title}
                              </span>
                              {result.subtitle && (
                                <span className="block truncate text-xs text-[var(--admin-muted)]">
                                  {result.subtitle}
                                </span>
                              )}
                            </span>
                            <ArrowRight
                              className={cn(
                                'h-3.5 w-3.5 shrink-0 text-[var(--admin-muted)] transition-transform',
                                index === activeIndex && 'translate-x-0.5 text-[var(--admin-fg)]'
                              )}
                            />
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-8 text-center text-sm text-[var(--admin-muted)]">
                        No results for &ldquo;{query}&rdquo;
                      </li>
                    )}
                  </ul>

                  <div className="flex items-center justify-between border-t border-[var(--admin-border)] px-3 py-2 text-[10px] text-[var(--admin-muted)]">
                    <span>↑↓ navigate | Enter open | Esc close</span>
                    <kbd className="rounded bg-[var(--admin-elevated)] px-1.5 py-0.5">
                      Ctrl K
                    </kbd>
                  </div>
                </m.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}