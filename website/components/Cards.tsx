import { AnimatePresence, motion } from 'framer-motion';
import { Layers, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { admin } from '@/lib/admin-classes';
import {
  bot,
  type CardCategoryId,
  cardCategories,
  placeholderRegimes,
  placeholderSpecials,
} from '@/lib/bot';
import { cn } from '@/lib/utils';

export default function CardsPage({ searchQuery = '' }: { searchQuery?: string }) {
  const [category, setCategory] = useState<CardCategoryId>('regimes');
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const activeMeta = cardCategories.find((c) => c.id === category) ?? cardCategories[0];

  const regimes = placeholderRegimes.filter(
    (entry) =>
      entry.name.toLowerCase().includes(localQuery.toLowerCase()) ||
      entry.id.toLowerCase().includes(localQuery.toLowerCase())
  );

  const specials = placeholderSpecials.filter(
    (entry) =>
      entry.name.toLowerCase().includes(localQuery.toLowerCase()) ||
      entry.id.toLowerCase().includes(localQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(localQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6 space-y-3">
        <div>
          <h1 className={cn('mb-2 text-xl font-bold sm:text-2xl md:text-3xl', admin.fg)}>Cards</h1>
          <p className={cn('text-sm', admin.muted)}>
            Card assets from <code className="opacity-80">{bot.vars.specials}</code> and nation{' '}
            <code className="opacity-80">regime</code> fields — paths under{' '}
            <code className="opacity-80">assets/cards/</code>.
          </p>
        </div>
      </div>

      <Card className={cn(admin.card, 'transition-colors hover:opacity-95')}>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <Layers className={cn('h-4 w-4', admin.muted)} />
            <h3 className={cn('text-sm font-medium', admin.muted)}>Card catalog</h3>
          </div>

          <div className="relative z-20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {cardCategories.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setCategory(item.id)}
                  className={cn(
                    'relative min-h-9 cursor-pointer select-none rounded-full px-4 py-2 text-sm font-medium touch-manipulation transition-colors',
                    category === item.id ? admin.accentPill : cn(admin.elevated, admin.muted)
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search
                className={cn(
                  'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                  admin.muted
                )}
              />
              <Input
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className={cn('h-9 pl-9', admin.input)}
                placeholder="Search cards..."
              />
            </div>
          </div>

          <p className={cn('text-xs', admin.muted)}>{activeMeta.description}</p>

          <AnimatePresence mode="wait">
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {category === 'regimes'
                ? regimes.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        'rounded-lg border p-4 transition-colors',
                        admin.elevated,
                        admin.hoverRow
                      )}
                    >
                      <div className="mb-3 flex aspect-[3/4] items-center justify-center rounded-md border border-dashed border-[var(--admin-border)] bg-[color-mix(in_srgb,var(--admin-fg)_4%,transparent)]">
                        <span className={cn('text-xs font-mono', admin.muted)}>{entry.file}</span>
                      </div>
                      <p className={cn('text-sm font-medium', admin.fg)}>{entry.name}</p>
                      <p className={cn('mt-0.5 font-mono text-[10px]', admin.muted)}>{entry.id}</p>
                      <p className={cn('mt-2 text-xs', admin.muted)}>
                        {entry.nationsCount} nations use this regime
                      </p>
                      <div className="mt-3 flex justify-end">
                        <Button variant="ghost" size="sm" disabled className={admin.muted}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))
                : specials.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        'rounded-lg border p-4 transition-colors',
                        admin.elevated,
                        admin.hoverRow
                      )}
                    >
                      <div className="mb-3 flex aspect-[3/4] items-center justify-center rounded-md border border-dashed border-[var(--admin-border)] bg-[color-mix(in_srgb,var(--admin-fg)_4%,transparent)]">
                        <span className={cn('text-xs font-mono', admin.muted)}>{entry.card}</span>
                      </div>
                      <p className={cn('text-sm font-medium', admin.fg)}>{entry.name}</p>
                      <p className={cn('mt-0.5 font-mono text-[10px]', admin.muted)}>{entry.id}</p>
                      <p className={cn('mt-2 text-xs', admin.muted)}>{entry.description}</p>
                      <div className="mt-3 flex justify-end">
                        <Button variant="ghost" size="sm" disabled className={admin.muted}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
            </motion.div>
          </AnimatePresence>

          {((category === 'regimes' && regimes.length === 0) ||
            (category === 'specials' && specials.length === 0)) && (
            <p className={cn('py-8 text-center text-sm', admin.muted)}>No cards match.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
