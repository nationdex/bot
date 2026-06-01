import { AnimatePresence, motion } from 'framer-motion';
import { Globe, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { admin } from '@/lib/admin-classes';
import {
  bot,
  collectibleLabel,
  formatRarity,
  placeholderCatalog,
  type RarityClass,
  rarityBadgeClass,
} from '@/lib/bot';
import { fadeUp, listItem, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';

export default function Nations({ searchQuery = '' }: { searchQuery?: string }) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [classFilter, setClassFilter] = useState<string>('all');

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const filteredCatalog = placeholderCatalog.filter((entry) => {
    const matchesSearch =
      entry.name.toLowerCase().includes(localQuery.toLowerCase()) ||
      entry.id.toLowerCase().includes(localQuery.toLowerCase());
    const matchesClass = classFilter === 'all' || entry.class === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6 space-y-3">
        <div>
          <h1 className={cn('mb-2 text-xl font-bold sm:text-2xl md:text-3xl capitalize', admin.fg)}>
            {bot.collectible.plural}
          </h1>
          <p className={cn('text-sm', admin.muted)}>
            Global catalog from <code className="opacity-80">{bot.vars.globalCatalog}.nations</code>{' '}
            — rarity classes: {bot.rarityClasses.join(', ')}.
          </p>
        </div>
      </div>

      <Card className={cn(admin.card)}>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className={cn('h-4 w-4 shrink-0', admin.muted)} />
              <h3 className={cn('text-sm font-medium capitalize', admin.muted)}>
                Catalog ({placeholderCatalog.length} {collectibleLabel(placeholderCatalog.length)})
              </h3>
            </div>

            <motion.div
              className="relative z-20 flex flex-col gap-2 md:flex-row md:items-center"
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <div className="relative min-w-0 flex-1">
                <Search
                  className={cn(
                    'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                    admin.muted
                  )}
                />
                <Input
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  className={cn('h-9 w-full pl-9 pr-3', admin.input)}
                  placeholder="Search by name or ID..."
                />
              </div>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger
                  className={cn(
                    'min-h-9 h-9 w-full shrink-0 cursor-pointer touch-manipulation text-xs md:w-36',
                    admin.input
                  )}
                >
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent className={cn(admin.elevated, admin.fg)}>
                  <SelectItem value="all">All classes</SelectItem>
                  {bot.rarityClasses.map((rarity) => (
                    <SelectItem key={rarity} value={rarity} className="capitalize">
                      {formatRarity(rarity)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence initial={false}>
              {filteredCatalog.map((entry) => (
                <motion.div
                  key={entry.id}
                  variants={listItem}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="h-full"
                >
                  <div
                    className={cn(
                      'h-full rounded-lg border p-4 transition-colors',
                      admin.elevated,
                      admin.hoverRow
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className={cn('block truncate text-sm font-medium', admin.fg)}>
                          {entry.name}
                        </span>
                        <span className={cn('font-mono text-[10px]', admin.muted)}>{entry.id}</span>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                          rarityBadgeClass[entry.class as RarityClass]
                        )}
                      >
                        {formatRarity(entry.class)}
                      </span>
                    </div>
                    <div className={cn('flex items-center justify-between text-xs', admin.muted)}>
                      <span>{entry.globalCaught.toLocaleString()} global caught</span>
                      <span>weight {entry.weight}</span>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn('h-7 text-xs', admin.muted, 'hover:text-[var(--admin-fg)]')}
                        disabled
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {filteredCatalog.length === 0 && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn('py-8 text-center text-sm', admin.muted)}
              >
                No catalog entries match.
              </motion.p>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
