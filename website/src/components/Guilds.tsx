import { m } from '@/lib/panel-motion';
import { Search } from '@/components/icons';
import { useEffect, useState } from 'preact/compat';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { admin } from '@/lib/admin-classes';
import { fetchGuildConfigs, getCache, type GuildConfigEntry } from '@/lib/api';
import { TablePagination } from '@/components/TablePagination';
import { useMotionPref } from '@/hooks/useReducedMotion';
import { listItem, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';

export default function GuildsPage({ searchQuery = '' }: { searchQuery?: string }) {
  const listReveal = useMotionPref('listReveal');
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [guilds, setGuilds] = useState<GuildConfigEntry[]>(() => getCache<GuildConfigEntry[]>('guilds_all') || []);
  const [isLoading, setIsLoading] = useState<boolean>(() => !getCache<GuildConfigEntry[]>('guilds_all')?.length);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setLocalQuery(searchQuery);
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    let active = true;
    void fetchGuildConfigs()
      .then((data) => {
        if (active && Array.isArray(data)) {
          setGuilds(data);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredGuilds = guilds.filter((item) => {
    const q = localQuery.toLowerCase();
    const matchesQuery =
      item.guildId.toLowerCase().includes(q) ||
      item.spawnChannel.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'enabled' && item.enabled) ||
      (statusFilter === 'disabled' && !item.enabled);
    return matchesQuery && matchesStatus;
  });

  const paginatedGuilds = filteredGuilds.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search
            className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', admin.muted)}
          />
          <Input
            value={localQuery}
            onChange={(e) => {
              setLocalQuery(e.currentTarget.value);
              setCurrentPage(1);
            }}
            className={cn('pl-9', admin.input)}
            placeholder="Search by Guild ID or Spawn Channel ID..."
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
          <SelectTrigger omitDefaults="h-10 text-sm" className={cn('h-9 w-full sm:w-36 text-xs', admin.input)}>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className={cn(admin.elevated, admin.fg)}>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card omitDefaults="rounded-lg" className={cn('bg-[var(--admin-card)] overflow-x-auto rounded-xl', admin.card)}>
        <CardContent omitDefaults="p-6 pt-0" className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[var(--admin-border)]">
                  <th className={cn('py-4 pl-5 sm:pl-6 pr-4 text-left text-xs font-semibold', admin.muted)}>
                    Guild ID
                  </th>
                  <th className={cn('py-4 px-4 text-left text-xs font-semibold', admin.muted)}>
                    Spawn Channel
                  </th>
                  <th className={cn('py-4 px-4 pr-5 sm:pr-6 text-left text-xs font-semibold', admin.muted)}>
                    Enabled
                  </th>
                </tr>
              </thead>
              {isLoading ? (
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-b border-[var(--admin-border)] last:border-0"
                    >
                      <td className="py-3 pl-5 sm:pl-6 pr-4">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="py-3 px-4 pr-5 sm:pr-6">
                        <Skeleton omitDefaults="rounded-md" className="h-5 w-16 rounded-full" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : listReveal ? (
                <m.tbody
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  key={localQuery + '-' + statusFilter + '-' + currentPage + '-' + pageSize}
                >
                  {paginatedGuilds.map((item) => (
                    <m.tr
                      key={item.id}
                      variants={listItem}
                      className={cn(
                        'border-b border-[var(--admin-border)] last:border-0 transition-colors',
                        admin.hoverRow
                      )}
                    >
                      <td className={cn('py-3 pl-5 sm:pl-6 pr-4 text-sm font-medium', admin.fg)}>
                        {item.guildId}
                      </td>
                      <td className={cn('py-3 px-4 text-sm', admin.fg)}>{item.spawnChannel}</td>
                      <td className={cn('py-3 px-4 pr-5 sm:pr-6 text-sm', admin.muted)}>
                        {item.enabled ? 'Enabled' : 'Disabled'}
                      </td>
                    </m.tr>
                  ))}
                </m.tbody>
              ) : (
                <tbody key={localQuery + '-' + statusFilter + '-' + currentPage + '-' + pageSize}>
                  {paginatedGuilds.map((item) => (
                    <tr
                      key={item.id}
                      className={cn(
                        'border-b border-[var(--admin-border)] last:border-0 transition-colors',
                        admin.hoverRow
                      )}
                    >
                      <td className={cn('py-3 pl-5 sm:pl-6 pr-4 text-sm font-medium', admin.fg)}>
                        {item.guildId}
                      </td>
                      <td className={cn('py-3 px-4 text-sm', admin.fg)}>{item.spawnChannel}</td>
                      <td className={cn('py-3 px-4 pr-5 sm:pr-6 text-sm', admin.muted)}>
                        {item.enabled ? 'Enabled' : 'Disabled'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>

          {!isLoading && filteredGuilds.length === 0 && (
            <p className={cn('py-8 text-center text-sm', admin.muted)}>No guild configs found.</p>
          )}

          <TablePagination
            totalItems={filteredGuilds.length}
            pageSize={pageSize}
            setPageSize={setPageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}