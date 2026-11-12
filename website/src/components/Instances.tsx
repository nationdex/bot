import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { admin } from '@/lib/admin-classes';
import { fetchNationInstances, getCache, removeUserNation, setCache, type NationInstanceEntry } from '@/lib/api';
import { bot, formatRarity } from '@/lib/bot';
import { TablePagination } from '@/components/TablePagination';
import { ConfirmModal } from '@/components/ConfirmModal';
import { cn } from '@/lib/utils';

function formatTimeToCatch(val: number | string): string {
  const ms = typeof val === 'number' ? val : parseInt(String(val), 10);
  if (isNaN(ms) || ms <= 0) return '0s';

  const seconds = Math.floor(ms / 1000);
  if (seconds <= 0) return '0s';

  const mo = Math.floor(seconds / 2592000);
  const d = Math.floor((seconds % 2592000) / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts: string[] = [];
  if (mo > 0) parts.push(`${mo}mo`);
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);

  return parts.join(' ');
}

export default function InstancesPage({ searchQuery = '' }: { searchQuery?: string }) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [instances, setInstances] = useState<NationInstanceEntry[]>(() => getCache<NationInstanceEntry[]>('instances_all_v2') || []);
  const [isLoading, setIsLoading] = useState<boolean>(() => !getCache<NationInstanceEntry[]>('instances_all_v2')?.length);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [deleteInstance, setDeleteInstance] = useState<NationInstanceEntry | null>(null);
  const [deleteSelectedModalOpen, setDeleteSelectedModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleConfirmSingleDelete = async () => {
    if (!deleteInstance) return;
    setIsDeleting(true);
    try {
      const res = await removeUserNation(deleteInstance.player, deleteInstance.id);
      if (res && res.ok !== false) {
        setInstances((prev) => {
          const next = prev.filter((item) => item.id !== deleteInstance.id);
          setCache('instances_all_v2', next);
          return next;
        });
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteInstance.id);
          return next;
        });
        setDeleteInstance(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      const targets = instances.filter((item) => selectedIds.has(item.id));
      await Promise.allSettled(
        targets.map((item) => removeUserNation(item.player, item.id))
      );
      setInstances((prev) => {
        const next = prev.filter((item) => !selectedIds.has(item.id));
        setCache('instances_all_v2', next);
        return next;
      });
      setSelectedIds(new Set());
      setDeleteSelectedModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    setLocalQuery(searchQuery);
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [classFilter]);

  useEffect(() => {
    let active = true;
    void fetchNationInstances().then((data) => {
      if (active) {
        if (Array.isArray(data)) {
          setInstances(data);
        }
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const filteredInstances = useMemo(() => {
    const q = localQuery.trim().toLowerCase();
    if (!q && classFilter === 'all') return instances;

    return instances.filter((inst) => {
      const matchesSearch =
        !q ||
        inst.id.toLowerCase().includes(q) ||
        inst.description.toLowerCase().includes(q) ||
        inst.player.toLowerCase().includes(q) ||
        inst.identifier.toLowerCase().includes(q);

      const matchesClass = classFilter === 'all' || inst.class === classFilter.toLowerCase();
      return matchesSearch && matchesClass;
    });
  }, [instances, localQuery, classFilter]);

  const paginatedInstances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInstances.slice(start, start + pageSize);
  }, [filteredInstances, currentPage, pageSize]);

  const allPageSelected =
    paginatedInstances.length > 0 && paginatedInstances.every((inst) => selectedIds.has(inst.id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedInstances.forEach((inst) => next.delete(inst.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedInstances.forEach((inst) => next.add(inst.id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center flex-1">
          <div className="relative w-full sm:w-64">
            <Search
              className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', admin.muted)}
            />
            <Input
              value={localQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={cn('pl-9 h-9 rounded-lg bg-[var(--admin-card)] text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)]')}
              placeholder="Search instances like India"
            />
          </div>

          <Select value={classFilter} onValueChange={(val) => { setClassFilter(val); setCurrentPage(1); }}>
            <SelectTrigger className={cn('h-9 w-full sm:w-36 text-xs rounded-lg bg-[var(--admin-card)] text-[var(--admin-fg)] border-0 shadow-none')}>
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent className={cn(admin.elevated, admin.fg, 'border-0 shadow-lg')}>
              <SelectItem value="all">All Classes</SelectItem>
              {bot.rarityClasses.map((rarity) => (
                <SelectItem key={rarity} value={rarity} className="capitalize">
                  {formatRarity(rarity)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('text-xs', admin.muted)}>
              {selectedIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-3 text-xs bg-[var(--admin-card)] text-red-400/90 rounded-lg border-0 shadow-none',
                'hover:bg-red-500/10 hover:text-red-400'
              )}
              onClick={() => setDeleteSelectedModalOpen(true)}
            >
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      <Card className={cn('bg-[var(--admin-card)] overflow-x-auto rounded-xl', admin.card)}>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[var(--admin-border)]">
                  <th className="w-10 py-3.5 pl-5 sm:pl-6 pr-3 text-left">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded accent-zinc-500 cursor-pointer"
                    />
                  </th>
                  <th className={cn('py-3.5 px-4 text-left text-xs font-semibold', admin.muted)}>
                    Description
                  </th>
                  <th className={cn('py-3.5 px-4 text-left text-xs font-semibold', admin.muted)}>
                    Class
                  </th>
                  <th className={cn('py-3.5 px-4 text-left text-xs font-semibold', admin.muted)}>
                    Player
                  </th>
                  <th className={cn('py-3.5 px-4 text-left text-xs font-semibold', admin.muted)}>
                    Time to Catch
                  </th>
                  <th className={cn('py-3.5 pr-5 sm:pr-6 text-right text-xs font-semibold', admin.muted)}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--admin-border)] last:border-0 animate-pulse">
                      <td className="py-3.5 pl-5 sm:pl-6 pr-3">
                        <div className="h-4 w-4 rounded bg-[var(--admin-elevated)]" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 w-40 sm:w-48 rounded bg-[var(--admin-elevated)]" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-5 w-16 rounded-full bg-[var(--admin-elevated)]" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 w-24 sm:w-28 rounded bg-[var(--admin-elevated)]" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 w-16 rounded bg-[var(--admin-elevated)]" />
                      </td>
                      <td className="py-3.5 pr-5 sm:pr-6 text-right">
                        <div className="flex items-center justify-end">
                          <div className="h-7 w-14 rounded bg-[var(--admin-elevated)]" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  paginatedInstances.map((inst) => (
                    <tr
                      key={inst.id}
                      className={cn(
                        'border-b border-[var(--admin-border)] last:border-0 transition-colors',
                        admin.hoverRow,
                        selectedIds.has(inst.id) && 'bg-[var(--admin-elevated)]/60'
                      )}
                    >
                      <td className="py-3 pl-5 sm:pl-6 pr-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(inst.id)}
                          onChange={() => toggleSelect(inst.id)}
                          className="h-4 w-4 rounded accent-zinc-500 cursor-pointer"
                        />
                      </td>
                      <td className={cn('py-3 px-4 text-sm font-medium', admin.fg)}>
                        {inst.description}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="capitalize px-2 py-0.5 rounded-full bg-[var(--admin-elevated)] text-[var(--admin-fg)] text-[11px] font-medium">
                          {formatRarity(inst.class)}
                        </span>
                      </td>
                      <td className={cn('py-3 px-4 text-sm', admin.fg)}>{inst.player}</td>
                      <td className={cn('py-3 px-4 text-sm', admin.muted)}>
                        {formatTimeToCatch(inst.timeToCatch)}
                      </td>
                      <td className="py-3 pr-5 sm:pr-6 text-right">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              'h-7 px-2.5 text-xs bg-[var(--admin-elevated)] text-red-400/80',
                              'hover:bg-red-500/10 hover:text-red-400'
                            )}
                            onClick={() => setDeleteInstance(inst)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredInstances.length === 0 && (
            <div className="py-12 text-center space-y-1.5">
              <p className={cn('text-sm font-medium', admin.fg)}>
                {localQuery
                  ? `No nation instances found matching "${localQuery}"`
                  : classFilter !== 'all'
                    ? `No nation instances found in class "${formatRarity(classFilter as Parameters<typeof formatRarity>[0])}"`
                    : 'No nation instances found'}
              </p>
              <p className={cn('text-xs', admin.muted)}>
                {localQuery || classFilter !== 'all'
                  ? 'Try checking the spelling or resetting the filters.'
                  : 'Instances will appear here once nations are caught by players.'}
              </p>
            </div>
          )}

          {!isLoading && filteredInstances.length > 0 && (
            <TablePagination
              totalItems={filteredInstances.length}
              pageSize={pageSize}
              setPageSize={setPageSize}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        open={Boolean(deleteInstance)}
        title="Delete Nation Instance?"
        description={
          deleteInstance
            ? `Are you sure you want to delete instance #${deleteInstance.id} (${deleteInstance.description}) owned by ${deleteInstance.player}?`
            : ''
        }
        confirmText="Delete Instance"
        isLoading={isDeleting}
        onConfirm={handleConfirmSingleDelete}
        onClose={() => setDeleteInstance(null)}
      />

      <ConfirmModal
        open={deleteSelectedModalOpen}
        title={`Delete ${selectedIds.size} Selected Instance${selectedIds.size > 1 ? 's' : ''}?`}
        description={`Are you sure you want to permanently delete ${selectedIds.size} selected nation instance${selectedIds.size > 1 ? 's' : ''
          }? This action cannot be undone.`}
        confirmText="Delete Selected"
        isLoading={isDeleting}
        onConfirm={handleConfirmBulkDelete}
        onClose={() => setDeleteSelectedModalOpen(false)}
      />
    </div>
  );
}