import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ConfirmModal } from '@/components/ConfirmModal';
import NationEdit from '@/components/NationEdit';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { admin } from '@/lib/admin-classes';
import { deleteNation, fetchCollectibles, getCache, type CollectibleEntry } from '@/lib/api';
import { bot, formatRarity, type RarityClass, rarityBadgeClass } from '@/lib/bot';
import { useMotionPref } from '@/hooks/useReducedMotion';
import { fadeUp, listItem, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';

export default function Nations({
  searchQuery = '',
  onCountChange,
}: {
  searchQuery?: string;
  onCountChange?: (count: number) => void;
}) {
  const listReveal = useMotionPref('listReveal');
  const [selectedNationId, setSelectedNationId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [catalog, setCatalog] = useState<CollectibleEntry[]>(() => getCache<CollectibleEntry[]>('collectibles_all') || []);
  const [isLoading, setIsLoading] = useState<boolean>(() => !getCache<CollectibleEntry[]>('collectibles_all')?.length);
  const [deleteItem, setDeleteItem] = useState<CollectibleEntry | null>(null);

  const loadData = () => {
    void fetchCollectibles()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalog(data);
          onCountChange?.(data.length);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    onCountChange?.(catalog.length);
  }, [catalog.length, onCountChange]);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    let active = true;
    void fetchCollectibles()
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setCatalog(data);
          onCountChange?.(data.length);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onCountChange]);

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    const targetId = deleteItem.id;
    setCatalog((prev) => {
      const next = prev.filter((item) => item.id !== targetId);
      onCountChange?.(next.length);
      return next;
    });
    setDeleteItem(null);
    void deleteNation(targetId, true);
  };

  if (selectedNationId) {
    return (
      <NationEdit
        nationId={selectedNationId}
        onBack={() => {
          setSelectedNationId(null);
          loadData();
        }}
      />
    );
  }

  if (isCreatingNew) {
    return (
      <NationEdit
        isNew
        onBack={() => {
          setIsCreatingNew(false);
          loadData();
        }}
      />
    );
  }

  const filteredCatalog = catalog.filter((entry) => {
    const matchesSearch =
      entry.name.toLowerCase().includes(localQuery.toLowerCase()) ||
      entry.id.toLowerCase().includes(localQuery.toLowerCase());
    const matchesClass = classFilter === 'all' || entry.class === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <Card className="space-y-4 p-5">
        <div className="space-y-3">
          <motion.div
            className="relative z-20 flex flex-col gap-2 md:flex-row md:items-center"
            variants={listReveal ? fadeUp : undefined}
            initial={listReveal ? 'hidden' : false}
            animate={listReveal ? 'show' : undefined}
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

            <Button
              type="button"
              size="sm"
              onClick={() => setIsCreatingNew(true)}
              className="h-9 shrink-0 gap-1.5 rounded-lg bg-[var(--admin-accent)] px-3 text-xs font-medium text-[var(--admin-accent-fg)] hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Nation</span>
            </Button>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-60 sm:h-64 rounded-xl border-2 border-[var(--admin-border)] bg-[var(--admin-card)] p-5 flex flex-col items-center justify-center space-y-3 animate-pulse"
              >
                <Skeleton className="h-6 w-36 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={listReveal ? staggerContainer : undefined}
            initial={listReveal ? 'hidden' : false}
            animate={listReveal ? 'show' : undefined}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
          {filteredCatalog.map((entry) => {
            const card = (
              <div className="group relative block h-60 sm:h-64">
                <span className="absolute inset-0 border-2 border-dashed border-[var(--admin-border)]"></span>

                <div className="relative h-full w-full transform border-2 border-[var(--admin-border)] bg-[var(--admin-card)] transition-transform duration-200 group-hover:-translate-x-2 group-hover:-translate-y-2">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center transition-opacity duration-200 group-hover:pointer-events-none group-hover:opacity-0 sm:p-6">
                    <h3 className="text-lg font-bold leading-snug text-[var(--admin-fg)] sm:text-xl break-words line-clamp-3">
                      {entry.name}
                    </h3>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className="text-xs text-[var(--admin-muted)]">ID: {entry.id}</span>
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 text-xs font-medium capitalize',
                          rarityBadgeClass[entry.class as RarityClass]
                        )}
                      >
                        {formatRarity(entry.class)}
                      </span>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex flex-col justify-between p-5 opacity-0 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 sm:p-6">
                    <div className="border-b border-[var(--admin-border)] pb-2.5">
                      <h3 className="text-base font-bold leading-snug text-[var(--admin-fg)] sm:text-lg break-words line-clamp-2" title={entry.name}>
                        {entry.name}
                      </h3>
                    </div>

                    <div className="flex-1 flex flex-col justify-center py-2">
                      <div className="grid grid-cols-2 gap-3 w-full">
                        <div className="rounded-lg bg-[var(--admin-elevated)]/60 p-2.5 text-center">
                          <span className="block text-[11px] text-[var(--admin-muted)]">Global Caught</span>
                          <span className="mt-0.5 block text-base font-bold tabular-nums text-[var(--admin-fg)] sm:text-lg">
                            {entry.globalCaught.toLocaleString()}
                          </span>
                        </div>
                        <div className="rounded-lg bg-[var(--admin-elevated)]/60 p-2.5 text-center">
                          <span className="block text-[11px] text-[var(--admin-muted)]">Spawn Weight</span>
                          <span className="mt-0.5 block text-base font-bold tabular-nums text-[var(--admin-fg)] sm:text-lg">
                            {entry.weight}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 w-full pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedNationId(entry.id)}
                        className="h-8 w-full bg-[var(--admin-elevated)] text-xs font-medium text-[var(--admin-fg)] hover:bg-[var(--admin-elevated)]/80"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteItem(entry)}
                        className="h-8 w-full bg-[var(--admin-elevated)] text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-400"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );

            return listReveal ? (
              <motion.div key={entry.id} variants={listItem} className="h-full">
                {card}
              </motion.div>
            ) : (
              <div key={entry.id} className="h-full">
                {card}
              </div>
            );
          })}
        </motion.div>
        )}

        {!isLoading && filteredCatalog.length === 0 && (
          <p className={cn('py-8 text-center text-sm', admin.muted)}>No catalog entries match.</p>
        )}
      </Card>

      <ConfirmModal
        open={Boolean(deleteItem)}
        title="Delete Collectible?"
        description={
          deleteItem
            ? `Are you sure you want to delete ${deleteItem.name} (${deleteItem.id}) from the catalog?`
            : ''
        }
        confirmText="Delete Collectible"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteItem(null)}
      />
    </div>
  );
}