import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Globe, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMotionPref } from '@/hooks/useReducedMotion';
import { admin } from '@/lib/admin-classes';
import { fetchCollectibles, fetchNationInstances, fetchStats, fetchUserData, getCache, type BotStats, type CollectibleEntry, type NationInstanceEntry, type UserEntry } from '@/lib/api';
import { bot, formatRarity, type RarityClass } from '@/lib/bot';
import { listItem, springSnappy, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';
import TablePagination from './TablePagination';

type StatCategory = 'Users' | 'Nations' | 'Servers';
type DashboardFilter = 'All' | StatCategory;

const filterOptions: DashboardFilter[] = ['All', 'Users', 'Nations', 'Servers'];

const growthChartTitles: Record<DashboardFilter, string> = {
  All: 'Catch Growth',
  Users: 'New Players',
  Nations: 'Catch Growth',
  Servers: 'Spawn Activity'
};

const getUnitLabel = (count: number, filter: DashboardFilter) => {
  if (filter === 'Users') {
    return count === 1 ? 'Player' : 'Players';
  }
  if (filter === 'Servers') {
    return count === 1 ? 'Server' : 'Servers';
  }
  return count === 1 ? bot.collectible.singular : bot.collectible.plural;
};

function getNationInstanceCatchTime(inst: NationInstanceEntry): number | null {
  const raw = inst.rawParsed || {};
  const candidates = [
    raw.timestamp,
    raw.caught_at,
    raw.caughtAt,
    raw.created_at,
    raw.createdAt,
    raw.date,
    raw.time,
    inst.timeToCatch,
  ];

  for (const val of candidates) {
    if (val === null || val === undefined || val === '' || val === 'N/A') continue;
    if (typeof val === 'number') {
      if (val > 1e11) return val;
      if (val > 1e8) return val * 1000;
    }
    if (typeof val === 'string') {
      const num = Number(val);
      if (!Number.isNaN(num) && num > 1e8) {
        return num > 1e11 ? num : num * 1000;
      }
      const parsed = Date.parse(val);
      if (!Number.isNaN(parsed) && !Number.isNaN(new Date(parsed).getTime())) {
        return parsed;
      }
    }
  }

  const snowflakeCandidates = [
    inst.id,
    raw.message_id,
    raw.messageId,
    raw.caught_in,
    raw.channel,
  ];

  for (const sf of snowflakeCandidates) {
    if (typeof sf === 'string' && /^\d{17,20}$/.test(sf)) {
      try {
        const ms = Number((BigInt(sf) >> 22n) + 1420070400000n);
        if (ms > 1420070400000 && ms <= Date.now() + 86400000) {
          return ms;
        }
      } catch {}
    }
  }

  return null;
}

export default function Dashboard({ logSearchQuery = '' }: { logSearchQuery?: string }) {
  const [selectedFilter, setSelectedFilter] = useState<DashboardFilter>('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'Month' | 'Annually'>('Month');
  const [liveStats, setLiveStats] = useState<BotStats>(() => {
    const cached = getCache<BotStats>('stats');
    return cached || {
      userCount: 0,
      totalCaught: 0,
      catalogTotal: 0,
      guildCount: 0,
    };
  });
  const [topNations, setTopNations] = useState<
    Array<{ id: string; name: string; class: RarityClass; globalCaught: number }>
  >(() => {
    const cached = getCache<CollectibleEntry[]>('collectibles_all');
    return cached ? cached.map((e) => ({ id: e.id, name: e.name, class: e.class, globalCaught: e.globalCaught })) : [];
  });
  const [topUsers, setTopUsers] = useState<UserEntry[]>(() => {
    return getCache<UserEntry[]>('users_all') || [];
  });
  const [instances, setInstances] = useState<NationInstanceEntry[]>(() => {
    return getCache<NationInstanceEntry[]>('instances_all_v2') || [];
  });
  const [isLoadingInstances, setIsLoadingInstances] = useState<boolean>(() => {
    return !getCache<NationInstanceEntry[]>('instances_all_v2');
  });
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(() => {
    return !getCache<UserEntry[]>('users_all');
  });

  const isChartLoading =
    (selectedFilter === 'All' || selectedFilter === 'Nations')
      ? isLoadingInstances
      : selectedFilter === 'Users'
      ? isLoadingUsers
      : false;

  const listReveal = useMotionPref('listReveal');
  const hoverFeedback = useMotionPref('hoverFeedback');
  const chartMotion = useMotionPref('chartMotion');

  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const [nationsPage, setNationsPage] = useState(1);
  const [nationsRowsPerPage, setNationsRowsPerPage] = useState(5);
  const [usersPage, setUsersPage] = useState(1);
  const [usersRowsPerPage, setUsersRowsPerPage] = useState(5);

  useEffect(() => {
    setNationsPage(1);
  }, [selectedClassFilter, selectedFilter]);

  useEffect(() => {
    setUsersPage(1);
  }, [selectedFilter]);

  const filteredTopNations = useMemo(() => {
    return [...topNations]
      .filter((entry) => (selectedClassFilter === 'all' ? true : entry.class === selectedClassFilter))
      .sort((a, b) => (b.globalCaught || 0) - (a.globalCaught || 0));
  }, [topNations, selectedClassFilter]);

  const paginatedTopNations = useMemo(() => {
    const start = (nationsPage - 1) * nationsRowsPerPage;
    return filteredTopNations.slice(start, start + nationsRowsPerPage);
  }, [filteredTopNations, nationsPage, nationsRowsPerPage]);

  const sortedTopUsers = useMemo(() => {
    return [...topUsers]
      .filter((u) => u.total > 0 || u.totalValue > 0)
      .sort((a, b) => b.total - a.total || b.totalValue - a.totalValue);
  }, [topUsers]);

  const paginatedTopUsers = useMemo(() => {
    const start = (usersPage - 1) * usersRowsPerPage;
    return sortedTopUsers.slice(start, start + usersRowsPerPage);
  }, [sortedTopUsers, usersPage, usersRowsPerPage]);

  useEffect(() => {
    let active = true;
    void fetchStats().then((data) => {
      if (active && data) {
        setLiveStats((prev) => ({
          userCount: data.userCount !== undefined ? data.userCount : prev.userCount,
          totalCaught: data.totalCaught !== undefined ? data.totalCaught : prev.totalCaught,
          catalogTotal: data.catalogTotal !== undefined ? data.catalogTotal : prev.catalogTotal,
          guildCount: data.guildCount !== undefined ? data.guildCount : prev.guildCount,
        }));
      }
    });
    void fetchCollectibles().then((data) => {
      if (active && Array.isArray(data) && data.length > 0) {
        setTopNations(
          data.map((entry) => ({
            id: entry.id,
            name: entry.name,
            class: entry.class,
            globalCaught: entry.globalCaught,
          }))
        );
      }
    });
    void fetchUserData().then((data) => {
      if (active) {
        if (Array.isArray(data) && data.length > 0) {
          setTopUsers(data);
        }
        setIsLoadingUsers(false);
      }
    });
    void fetchNationInstances().then((data) => {
      if (active) {
        if (Array.isArray(data) && data.length > 0) {
          setInstances(data);
        }
        setIsLoadingInstances(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const chartData = useMemo(() => {
    const formatPct = (val: number) => {
      if (val === 0) return '0.0%';
      return val > 0 ? `+${val.toFixed(1)}%` : `${val.toFixed(1)}%`;
    };

    const now = new Date();
    let label0 = '';
    let label1 = '';
    let label2 = '';

    if (timeRange === 'Month') {
      const d0 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const d1 = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const d2 = new Date(now.getFullYear(), now.getMonth(), 1);

      label0 = d0.toLocaleString('en-US', { month: 'short' });
      label1 = d1.toLocaleString('en-US', { month: 'short' });
      label2 = d2.toLocaleString('en-US', { month: 'short' });
    } else {
      const currentYear = now.getFullYear();
      label0 = String(currentYear - 2);
      label1 = String(currentYear - 1);
      label2 = String(currentYear);
    }

    let t0 = 0;
    let t1 = 0;
    let t2 = 0;
    let t3 = 0;

    if (timeRange === 'Month') {
      t0 = new Date(now.getFullYear(), now.getMonth() - 2, 1).getTime();
      t1 = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      t2 = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      t3 = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    } else {
      t0 = new Date(now.getFullYear() - 2, 0, 1).getTime();
      t1 = new Date(now.getFullYear() - 1, 0, 1).getTime();
      t2 = new Date(now.getFullYear(), 0, 1).getTime();
      t3 = new Date(now.getFullYear() + 1, 0, 1).getTime();
    }

    let c0 = 0;
    let c1 = 0;
    let c2 = 0;

    if (selectedFilter === 'All' || selectedFilter === 'Nations') {
      for (const inst of instances) {
        const ts = getNationInstanceCatchTime(inst);
        if (ts !== null) {
          if (ts >= t0 && ts < t1) c0++;
          else if (ts >= t1 && ts < t2) c1++;
          else if (ts >= t2 && ts < t3) c2++;
        } else {
          c2++;
        }
      }
    } else if (selectedFilter === 'Users') {
      for (const u of topUsers) {
        if (u.caughtAt) {
          const ts = Date.parse(u.caughtAt);
          if (!Number.isNaN(ts)) {
            if (ts >= t0 && ts < t1) c0++;
            else if (ts >= t1 && ts < t2) c1++;
            else if (ts >= t2 && ts < t3) c2++;
          }
        }
      }
    } else if (selectedFilter === 'Servers') {
      c2 = liveStats.guildCount || 0;
    }

    const baseline0 = c0 > 0 ? Math.max(1, Math.round(c0 * 0.85)) : 0;
    const pct0 = baseline0 > 0 ? Math.round(((c0 - baseline0) / baseline0) * 1000) / 10 : 0;
    const pct1 = c0 > 0 ? Math.round(((c1 - c0) / c0) * 1000) / 10 : (c1 > 0 ? 100 : 0);
    const pct2 = c1 > 0 ? Math.round(((c2 - c1) / c1) * 1000) / 10 : (c2 > 0 ? 100 : 0);

    return [
      { label: label0, count: c0, pct: formatPct(pct0), numGrowth: pct0, isLatest: false },
      { label: label1, count: c1, pct: formatPct(pct1), numGrowth: pct1, isLatest: false },
      { label: label2, count: c2, pct: formatPct(pct2), numGrowth: pct2, isLatest: true },
    ];
  }, [liveStats, selectedFilter, timeRange, instances, topUsers]);

  useEffect(() => {
    if (logSearchQuery) {
      setSelectedFilter('All');
    }
  }, [logSearchQuery]);

  const stats = [
    {
      id: 1,
      category: 'Users' as const,
      label: 'Registered Users',
      value: liveStats.userCount.toLocaleString(),
      icon: Users,
    },
    {
      id: 2,
      category: 'Nations' as const,
      label: `${bot.collectible.plural.charAt(0).toUpperCase()}${bot.collectible.plural.slice(1)} Caught`,
      value: liveStats.totalCaught.toLocaleString(),
      icon: Globe,
    },
    {
      id: 3,
      category: 'Nations' as const,
      label: 'Catalog Size',
      value: liveStats.catalogTotal.toLocaleString(),
      icon: ArrowUpRight,
    },
    {
      id: 4,
      category: 'Servers' as const,
      label: 'Active Servers',
      value: liveStats.guildCount.toLocaleString(),
      icon: ArrowUpRight,
    },
  ];

  const visibleStats =
    selectedFilter === 'All'
      ? stats
      : stats.filter((stat) => stat.category === selectedFilter);

  const showNationsTable = selectedFilter === 'All' || selectedFilter === 'Nations';
  const showUsersTable = selectedFilter === 'Users';
  const showGrowthChart =
    selectedFilter === 'All' ||
    selectedFilter === 'Users' ||
    selectedFilter === 'Nations' ||
    selectedFilter === 'Servers';
  const showStats = visibleStats.length > 0;
  const showLeftTable = showNationsTable || showUsersTable;
  const showCharts = showLeftTable || showGrowthChart;

  const growthChartSpan = showLeftTable ? '' : 'lg:col-span-3';

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6 space-y-3">

        <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-[var(--admin-card)] w-fit flex-wrap">
          {filterOptions.map((filter) => (
            <button
              type="button"
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={cn(
                'relative px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors flex items-center justify-center cursor-pointer select-none touch-manipulation',
                selectedFilter === filter
                  ? 'text-[var(--admin-accent-fg)]'
                  : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
              )}
            >
              {selectedFilter === filter &&
                (hoverFeedback ? (
                  <motion.span
                    layoutId="dashboard-filter-pill"
                    className="absolute inset-0 rounded-full bg-[var(--admin-accent)] z-0"
                    transition={springSnappy}
                  />
                ) : (
                  <span className="absolute inset-0 rounded-full bg-[var(--admin-accent)] z-0" />
                ))}
              <span className="relative z-10">{filter}</span>
            </button>
          ))}
        </div>
      </div>

      {listReveal ? (
        <AnimatePresence mode="popLayout">
          {showStats && (
            <motion.div
              key={`stats-${selectedFilter}`}
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
              className={`grid gap-3 sm:gap-4 ${visibleStats.length === 1
                ? 'grid-cols-1 max-w-sm'
                : visibleStats.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
                }`}
            >
              {visibleStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={stat.id} variants={listItem} className="h-full">
                    <Card className="bg-[var(--admin-card)] hover:border-[var(--admin-border)] transition-colors h-full">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-3 gap-3">
                          <h3 className="text-xs sm:text-sm font-medium text-[var(--admin-muted)]">
                            {stat.label}
                          </h3>
                          <div
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                              admin.elevated
                            )}
                          >
                            <Icon className="h-4 w-4 text-[var(--admin-accent)]" />
                          </div>
                        </div>
                        {listReveal ? (
                          <motion.p
                            key={stat.value}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-xl sm:text-2xl font-bold text-[var(--admin-fg)] mb-1 tabular-nums"
                          >
                            {stat.value}
                          </motion.p>
                        ) : (
                          <p className="text-xl sm:text-2xl font-bold text-[var(--admin-fg)] mb-1 tabular-nums">
                            {stat.value}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        showStats && (
          <div
            className={`grid gap-3 sm:gap-4 ${visibleStats.length === 1
              ? 'grid-cols-1 max-w-sm'
              : visibleStats.length === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
              }`}
          >
            {visibleStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.id}
                  className="bg-[var(--admin-card)] hover:border-[var(--admin-border)] transition-colors h-full"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <h3 className="text-xs sm:text-sm font-medium text-[var(--admin-muted)]">
                        {stat.label}
                      </h3>
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          admin.elevated
                        )}
                      >
                        <Icon className="h-4 w-4 text-[var(--admin-accent)]" />
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-[var(--admin-fg)] mb-1 tabular-nums">
                      {stat.value}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch">
          {showNationsTable && (
            <Card className="lg:col-span-2 bg-[var(--admin-card)] overflow-hidden rounded-xl hover:border-[var(--admin-border)] transition-colors h-full flex flex-col justify-between">
              <CardContent className="p-0 flex flex-col flex-1 justify-between">
                <div className="p-4 sm:p-5 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-[var(--admin-muted)] capitalize">
                    Top caught {bot.collectible.plural}
                  </h3>
                  <div className="relative z-20 w-full sm:w-auto">
                    <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                      <SelectTrigger className="min-h-9 w-full cursor-pointer touch-manipulation bg-[var(--admin-elevated)] text-[var(--admin-fg)] text-xs sm:min-w-[9rem] sm:w-auto h-9">
                        <SelectValue placeholder="All classes" />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--admin-elevated)]">
                        <SelectItem value="all">All classes</SelectItem>
                        {bot.rarityClasses.map((rarity) => (
                          <SelectItem key={rarity} value={rarity} className="capitalize">
                            {formatRarity(rarity)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="overflow-x-auto w-full flex-1">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b border-[var(--admin-border)]">
                        <th className="text-left text-xs text-[var(--admin-muted)] py-2.5 pl-4 sm:pl-5 pr-4">
                          ID
                        </th>
                        <th className="text-left text-xs text-[var(--admin-muted)] py-2.5 px-4 capitalize">
                          {bot.collectible.singular}
                        </th>
                        <th className="text-left text-xs text-[var(--admin-muted)] py-2.5 px-4">
                          Class
                        </th>
                        <th className="text-right text-xs text-[var(--admin-muted)] py-2.5 pr-4 sm:pr-5">
                          Caught
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        if (paginatedTopNations.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-sm text-[var(--admin-muted)]">
                                No data
                              </td>
                            </tr>
                          );
                        }

                        return paginatedTopNations.map((entry, i) => {
                          const row = (
                            <>
                              <td className="py-2.5 pl-4 sm:pl-5 pr-4 text-xs text-[var(--admin-muted)]">
                                {entry.id}
                              </td>
                              <td className="text-xs sm:text-sm text-[var(--admin-muted)] py-2.5 px-4 font-medium" title={entry.name}>
                                {entry.name}
                              </td>
                              <td className="py-2.5 px-4 text-xs text-[var(--admin-muted)] capitalize">
                                {formatRarity(entry.class)}
                              </td>
                              <td className="py-2.5 pr-4 sm:pr-5 text-right text-sm text-[var(--admin-fg)]">
                                {entry.globalCaught.toLocaleString()}
                              </td>
                            </>
                          );

                          return chartMotion ? (
                            <motion.tr
                              key={entry.id}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.45 + i * 0.06 }}
                              className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-elevated)] transition-colors"
                            >
                              {row}
                            </motion.tr>
                          ) : (
                            <tr key={entry.id} className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-elevated)] transition-colors">
                              {row}
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  totalItems={filteredTopNations.length}
                  pageSize={nationsRowsPerPage}
                  setPageSize={setNationsRowsPerPage}
                  currentPage={nationsPage}
                  setCurrentPage={setNationsPage}
                />
              </CardContent>
            </Card>
          )}

          {showUsersTable && (
            <Card className="lg:col-span-2 bg-[var(--admin-card)] overflow-hidden rounded-xl hover:border-[var(--admin-border)] transition-colors h-full flex flex-col justify-between">
              <CardContent className="p-0 flex flex-col flex-1 justify-between">
                <div className="p-4 sm:p-5 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-[var(--admin-muted)]">
                    Top players
                  </h3>
                </div>

                <div className="overflow-x-auto w-full flex-1">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b border-[var(--admin-border)]">
                        <th className="text-left text-xs text-[var(--admin-muted)] py-2.5 pl-4 sm:pl-5 pr-4">
                          Discord ID
                        </th>
                        <th className="text-right text-xs text-[var(--admin-muted)] py-2.5 px-4">
                          Total
                        </th>
                        <th className="text-right text-xs text-[var(--admin-muted)] py-2.5 px-4">
                          Unique
                        </th>
                        <th className="text-right text-xs text-[var(--admin-muted)] py-2.5 pr-4 sm:pr-5">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        if (paginatedTopUsers.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-sm text-[var(--admin-muted)]">
                                No data
                              </td>
                            </tr>
                          );
                        }

                        return paginatedTopUsers.map((user, i) => {
                          const row = (
                            <>
                              <td className="py-2.5 pl-4 sm:pl-5 pr-4 text-xs font-medium text-[var(--admin-fg)]" title={user.username || user.discordId}>
                                {user.discordId}
                              </td>
                              <td className="py-2.5 px-4 text-right text-xs text-[var(--admin-fg)] tabular-nums font-semibold">
                                {user.total.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 text-right text-xs text-[var(--admin-muted)] tabular-nums">
                                {user.unique.toLocaleString()}
                              </td>
                              <td className="py-2.5 pr-4 sm:pr-5 text-right text-xs text-[var(--admin-muted)] tabular-nums">
                                {user.totalValue.toLocaleString()}
                              </td>
                            </>
                          );

                          return chartMotion ? (
                            <motion.tr
                              key={user.discordId}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.45 + i * 0.06 }}
                              className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-elevated)] transition-colors"
                            >
                              {row}
                            </motion.tr>
                          ) : (
                            <tr key={user.discordId} className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-elevated)] transition-colors">
                              {row}
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  totalItems={sortedTopUsers.length}
                  pageSize={usersRowsPerPage}
                  setPageSize={setUsersRowsPerPage}
                  currentPage={usersPage}
                  setCurrentPage={setUsersPage}
                />
              </CardContent>
            </Card>
          )}

          {showGrowthChart && (
            <Card
              className={`${growthChartSpan} bg-[var(--admin-card)] hover:border-[var(--admin-border)] transition-colors h-full flex flex-col justify-between`}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h3 className="text-sm font-medium text-[var(--admin-muted)]">
                    {growthChartTitles[selectedFilter]}
                  </h3>

                  <div className="relative z-20 inline-flex items-center gap-1 p-1 rounded-full bg-[var(--admin-elevated)] w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setTimeRange('Month')}
                      className={cn(
                        'relative px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex-1 sm:flex-none flex items-center justify-center cursor-pointer select-none touch-manipulation',
                        timeRange === 'Month'
                          ? 'text-[var(--admin-accent-fg)]'
                          : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
                      )}
                    >
                      {timeRange === 'Month' &&
                        (hoverFeedback ? (
                          <motion.span
                            layoutId="time-range-pill"
                            className="absolute inset-0 rounded-full bg-[var(--admin-accent)] z-0"
                            transition={springSnappy}
                          />
                        ) : (
                          <span className="absolute inset-0 rounded-full bg-[var(--admin-accent)] z-0" />
                        ))}
                      <span className="relative z-10">Month</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTimeRange('Annually')}
                      className={cn(
                        'relative px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex-1 sm:flex-none flex items-center justify-center cursor-pointer select-none touch-manipulation',
                        timeRange === 'Annually'
                          ? 'text-[var(--admin-accent-fg)]'
                          : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
                      )}
                    >
                      {timeRange === 'Annually' &&
                        (hoverFeedback ? (
                          <motion.span
                            layoutId="time-range-pill"
                            className="absolute inset-0 rounded-full bg-[var(--admin-accent)] z-0"
                            transition={springSnappy}
                          />
                        ) : (
                          <span className="absolute inset-0 rounded-full bg-[var(--admin-accent)] z-0" />
                        ))}
                      <span className="relative z-10">Annually</span>
                    </button>
                  </div>
                </div>

                {isChartLoading ? (
                  <>
                    <div className="my-2 p-3 rounded-lg bg-[var(--admin-elevated)] flex items-center justify-between animate-pulse">
                      <div className="space-y-1.5">
                        <div className="h-2.5 w-24 rounded bg-[var(--admin-card)]" />
                        <div className="h-5 w-32 rounded bg-[var(--admin-card)]" />
                      </div>
                      <div className="h-6 w-14 rounded-full bg-[var(--admin-card)]" />
                    </div>

                    <div className="flex-1 flex flex-col justify-end pt-3 pb-0 animate-pulse">
                      <div className="flex-1 w-full flex items-end justify-between gap-4 px-3 border-b border-[var(--admin-border)] min-h-[140px]">
                        <div className="flex-1 flex flex-col items-center h-full justify-end">
                          <div className="w-full max-w-[52px] h-[35%] rounded-t bg-[var(--admin-elevated)]" />
                        </div>
                        <div className="flex-1 flex flex-col items-center h-full justify-end">
                          <div className="w-full max-w-[52px] h-[60%] rounded-t bg-[var(--admin-elevated)]" />
                        </div>
                        <div className="flex-1 flex flex-col items-center h-full justify-end">
                          <div className="w-full max-w-[52px] h-[85%] rounded-t bg-[var(--admin-elevated)]" />
                        </div>
                      </div>

                      <div className="flex justify-between gap-4 px-3 pt-2 text-xs font-medium text-center">
                        <div className="flex-1 flex justify-center">
                          <div className="h-3 w-8 rounded bg-[var(--admin-elevated)]" />
                        </div>
                        <div className="flex-1 flex justify-center">
                          <div className="h-3 w-8 rounded bg-[var(--admin-elevated)]" />
                        </div>
                        <div className="flex-1 flex justify-center">
                          <div className="h-3 w-8 rounded bg-[var(--admin-elevated)]" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {(() => {
                      const latestIndex = chartData.findIndex((d) => d.isLatest);
                      const activeIndex = hoveredBarIndex !== null ? hoveredBarIndex : (latestIndex >= 0 ? latestIndex : chartData.length - 1);
                      const activeItem = chartData[activeIndex] || chartData[chartData.length - 1];

                      return (
                        <div className="my-2 p-3 rounded-lg bg-[var(--admin-elevated)] flex items-center justify-between">
                          <div>
                            <p className="text-[11px] text-[var(--admin-muted)] font-medium">
                              {activeItem?.label ? `${activeItem.label} Growth Rate` : 'Growth Rate'}
                            </p>
                            <p className="text-sm sm:text-base font-bold text-[var(--admin-fg)] mt-0.5">
                              {activeItem ? `${activeItem.count.toLocaleString()} ${getUnitLabel(activeItem.count, selectedFilter)}` : '0 Catches'}
                            </p>
                          </div>
                          {activeItem && activeItem.pct && (
                            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${activeItem.numGrowth >= 0
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                              }`}>
                              {activeItem.pct}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex-1 flex flex-col justify-end pt-3 pb-0">
                      <div className="flex-1 w-full flex items-end justify-between gap-4 px-3 border-b border-[var(--admin-border)] min-h-[140px]">
                        {(() => {
                          const latestIndex = chartData.findIndex((d) => d.isLatest);
                          const activeIndex = hoveredBarIndex !== null ? hoveredBarIndex : (latestIndex >= 0 ? latestIndex : chartData.length - 1);

                          return chartData.map((item, idx) => {
                            const maxVal = Math.max(...chartData.map((d) => d.count), 1);
                            const heightPercent = Math.max(12, Math.min(100, Math.round((item.count / maxVal) * 100)));
                            const isHovered = hoveredBarIndex === idx;
                            const isActive = activeIndex === idx;

                            const barColorClass = isActive
                              ? (isHovered ? 'bg-purple-400' : 'bg-purple-500')
                              : (isHovered ? 'bg-[var(--admin-fg)]/20' : 'bg-[var(--admin-elevated)]');

                            return (
                              <div
                                key={item.label}
                                onMouseEnter={() => setHoveredBarIndex(idx)}
                                onMouseLeave={() => setHoveredBarIndex(null)}
                                onTouchStart={() => setHoveredBarIndex(idx)}
                                className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer"
                              >
                                <div className="w-full max-w-[52px] flex items-end justify-center h-full">
                                  {chartMotion ? (
                                    <motion.div
                                      key={`${item.label}-${timeRange}-${selectedFilter}`}
                                      initial={{ height: 0 }}
                                      animate={{ height: `${heightPercent}%` }}
                                      transition={{ delay: 0.1 + idx * 0.06, ...springSnappy }}
                                      className={`w-full rounded-t relative transition-colors duration-150 ${barColorClass}`}
                                    >
                                      <AnimatePresence>
                                        {isHovered && (
                                          <motion.div
                                            initial={{ opacity: 0, y: 2 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 2 }}
                                            transition={{ duration: 0.1 }}
                                            className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[var(--admin-elevated)] text-[var(--admin-fg)] text-xs font-semibold px-2 py-0.5 rounded pointer-events-none whitespace-nowrap z-30 flex items-center gap-1.5 border border-[var(--admin-border)]"
                                          >
                                            <span>{item.count.toLocaleString()} {getUnitLabel(item.count, selectedFilter)}</span>
                                            {item.pct && (
                                              <span className={item.numGrowth >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                                                ({item.pct})
                                              </span>
                                            )}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </motion.div>
                                  ) : (
                                    <div
                                      style={{ height: `${heightPercent}%` }}
                                      className={`w-full rounded-t relative transition-colors duration-150 ${barColorClass}`}
                                    >
                                      <AnimatePresence>
                                        {isHovered && (
                                          <motion.div
                                            initial={{ opacity: 0, y: 2 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 2 }}
                                            transition={{ duration: 0.1 }}
                                            className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[var(--admin-elevated)] text-[var(--admin-fg)] text-xs font-semibold px-2 py-0.5 rounded pointer-events-none whitespace-nowrap z-30 flex items-center gap-1.5 border border-[var(--admin-border)]"
                                          >
                                            <span>{item.count.toLocaleString()} {getUnitLabel(item.count, selectedFilter)}</span>
                                            {item.pct && (
                                              <span className={item.numGrowth >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                                                ({item.pct})
                                              </span>
                                            )}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      <div className="flex justify-between gap-4 px-3 pt-2 text-xs font-medium text-center">
                        {chartData.map((item, idx) => {
                          const latestIndex = chartData.findIndex((d) => d.isLatest);
                          const activeIndex = hoveredBarIndex !== null ? hoveredBarIndex : (latestIndex >= 0 ? latestIndex : chartData.length - 1);
                          const isActive = activeIndex === idx;

                          return (
                            <div
                              key={item.label}
                              className={`flex-1 transition-colors duration-150 ${isActive ? 'text-[var(--admin-fg)] font-bold' : 'text-[var(--admin-muted)]'
                                }`}
                            >
                              {item.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}