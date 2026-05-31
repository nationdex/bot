import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PlaceholderNotice from '@/components/PlaceholderNotice';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tilt3D } from '@/components/ui/tilt-3d';
import { useIs3DEnabled, useReducedMotion } from '@/hooks/useReducedMotion';
import {
  bot,
  formatRarity,
  type LogTopic,
  placeholderCatalog,
  placeholderLogs,
  placeholderStats,
} from '@/lib/bot';
import { listItem, perspectiveDefault, springSnappy, staggerContainer } from '@/lib/motion';

const stats = [
  {
    id: 1,
    category: 'Users',
    label: 'Registered Users',
    value: placeholderStats.userCount.toLocaleString(),
    change: 'ForgeDB user vars',
    icon: ArrowUpRight,
  },
  {
    id: 2,
    category: 'Nations',
    label: `${bot.collectible.plural.charAt(0).toUpperCase()}${bot.collectible.plural.slice(1)} Caught`,
    value: placeholderStats.totalCaught.toLocaleString(),
    change: `${bot.vars.globalCatalog}.total_caught`,
    icon: ArrowUpRight,
  },
  {
    id: 3,
    category: 'Nations',
    label: 'Catalog Size',
    value: placeholderStats.catalogTotal.toLocaleString(),
    change: `${bot.vars.globalCatalog}.total`,
    icon: ArrowUpRight,
  },
  {
    id: 4,
    category: 'Servers',
    label: 'Active Servers',
    value: placeholderStats.guildCount.toLocaleString(),
    change: 'Guilds with spawnConfig',
    icon: ArrowUpRight,
  },
] as const;

type StatCategory = (typeof stats)[number]['category'];
type DashboardFilter = 'All' | StatCategory | 'Activity';

const filterOptions: DashboardFilter[] = ['All', 'Users', 'Nations', 'Servers', 'Activity'];

const filterHeadlines: Record<DashboardFilter, string> = {
  All: `${bot.name} overview — mirrors /info about stats.`,
  Users: 'Players and getUserData inventories.',
  Nations: `${bot.collectible.plural.charAt(0).toUpperCase()}${bot.collectible.plural.slice(1)} catches and ${bot.vars.globalCatalog} catalog.`,
  Servers: 'Guild spawnConfig and server activity.',
  Activity: 'Bot runtime and ForgeScript logs.',
};

const growthChartTitles: Record<DashboardFilter, string> = {
  All: 'Catch Growth',
  Users: 'New Players',
  Nations: 'Catch Growth',
  Servers: 'Spawn Activity',
  Activity: 'Catch Growth',
};

const topNations = placeholderCatalog.map((entry) => ({
  id: entry.id,
  name: entry.name,
  class: entry.class,
  globalCaught: entry.globalCaught,
}));

const levelColors: Record<string, string> = {
  info: 'text-blue-400 bg-blue-400/10',
  warn: 'text-yellow-400 bg-yellow-400/10',
  error: 'text-red-400 bg-red-400/10',
};

export default function Dashboard({ logSearchQuery = '' }: { logSearchQuery?: string }) {
  const [selectedFilter, setSelectedFilter] = useState<DashboardFilter>('All');
  const [timeRange, setTimeRange] = useState('Annually');
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const reducedMotion = useReducedMotion();
  const enable3D = useIs3DEnabled();

  useEffect(() => {
    if (logSearchQuery) {
      setSelectedFilter('All');
      setLogFilter('all');
    }
  }, [logSearchQuery]);

  const visibleStats =
    selectedFilter === 'All'
      ? stats
      : selectedFilter === 'Activity'
        ? []
        : stats.filter((stat) => stat.category === selectedFilter);

  const showNationsChart = selectedFilter === 'All' || selectedFilter === 'Nations';
  const showGrowthChart =
    selectedFilter === 'All' ||
    selectedFilter === 'Users' ||
    selectedFilter === 'Nations' ||
    selectedFilter === 'Servers';
  const showStats = visibleStats.length > 0;
  const showCharts = showNationsChart || showGrowthChart;
  const showLogs =
    selectedFilter === 'All' ||
    selectedFilter === 'Activity' ||
    selectedFilter === 'Users' ||
    selectedFilter === 'Nations' ||
    selectedFilter === 'Servers';

  const logsForFilter: typeof placeholderLogs =
    selectedFilter === 'All' || selectedFilter === 'Activity'
      ? [...placeholderLogs]
      : placeholderLogs.filter((log) => log.topic === (selectedFilter as LogTopic));

  const filteredLogs = useMemo(() => {
    const byLevel =
      logFilter === 'all' ? logsForFilter : logsForFilter.filter((log) => log.level === logFilter);
    if (!logSearchQuery.trim()) return byLevel;
    const q = logSearchQuery.toLowerCase();
    return byLevel.filter(
      (log) =>
        log.message.toLowerCase().includes(q) ||
        log.topic.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q)
    );
  }, [logsForFilter, logFilter, logSearchQuery]);

  const growthChartSpan = showNationsChart ? '' : 'lg:col-span-3';

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6 space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedFilter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 px-1 sm:px-0">
              {filterHeadlines[selectedFilter]}
            </h1>
            <p className="text-xs text-white/40 px-1 sm:px-0">
              {bot.name} v{bot.version} · prefixes {bot.prefixes.join(', ')}
            </p>
          </motion.div>
        </AnimatePresence>

        <PlaceholderNotice />

        <div className="flex flex-wrap gap-2.5 px-1 sm:px-0">
          {filterOptions.map((filter) => (
            <button
              type="button"
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`relative min-h-9 cursor-pointer select-none rounded-full px-4 py-2 text-sm font-medium transition-colors touch-manipulation ${
                selectedFilter === filter
                  ? 'text-[#0F0F0F]'
                  : 'bg-[#1A1A1A] text-white/70 hover:bg-[#252525] hover:text-white active:bg-[#2a2a2a]'
              }`}
            >
              {selectedFilter === filter && (
                <motion.span
                  layoutId="dashboard-filter-pill"
                  className="pointer-events-none absolute inset-0 rounded-full bg-white"
                  transition={springSnappy}
                />
              )}
              <span className="pointer-events-none relative z-10">{filter}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {showStats && (
          <motion.div
            key={`stats-${selectedFilter}`}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            className={`grid gap-3 sm:gap-4 ${
              visibleStats.length === 1
                ? 'grid-cols-1 max-w-sm'
                : visibleStats.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
            }`}
          >
            {visibleStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Tilt3D key={stat.id} enterDelay={i * 0.08} maxTilt={9} className="h-full">
                  <Card className="bg-[#1A1A1A] border-[#252525] hover:border-[#333] transition-colors h-full">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xs sm:text-sm font-medium text-white/70">
                          {stat.label}
                        </h3>
                        <motion.div
                          whileHover={
                            reducedMotion
                              ? undefined
                              : enable3D
                                ? { rotate: 45, scale: 1.1, rotateX: 12 }
                                : { rotate: 45, scale: 1.1 }
                          }
                          style={enable3D ? { transformPerspective: 500 } : undefined}
                          className="preserve-3d w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0"
                        >
                          <Icon className="w-3 h-3 text-white/50" />
                        </motion.div>
                      </div>
                      <motion.p
                        key={stat.value}
                        initial={
                          reducedMotion
                            ? false
                            : enable3D
                              ? { opacity: 0, scale: 0.9, rotateX: 20 }
                              : { opacity: 0, scale: 0.9 }
                        }
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        style={enable3D ? { transformPerspective: 600 } : undefined}
                        className="preserve-3d text-xl sm:text-2xl font-bold text-white mb-1"
                      >
                        {stat.value}
                      </motion.p>
                      {stat.change && (
                        <p className="text-xs text-white/40 font-mono">{stat.change}</p>
                      )}
                    </CardContent>
                  </Card>
                </Tilt3D>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 items-start">
          {showNationsChart && (
            <Tilt3D enterDelay={0.35} maxTilt={6} lift={6} className="lg:col-span-2">
              <Card className="bg-[#1A1A1A] border-[#252525] hover:border-[#333] transition-colors h-full">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                    <h3 className="text-sm font-medium text-white/70 capitalize">
                      Top caught {bot.collectible.plural}
                    </h3>
                    <Select defaultValue="all">
                      <SelectTrigger className="bg-[#252525] text-white text-xs border-[#333] w-full sm:w-auto h-8">
                        <SelectValue placeholder="All classes" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#252525] border-[#333]">
                        <SelectItem value="all">All classes</SelectItem>
                        {bot.rarityClasses.map((rarity) => (
                          <SelectItem key={rarity} value={rarity} className="capitalize">
                            {formatRarity(rarity)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <table className="w-full min-w-[400px]">
                      <thead>
                        <tr>
                          <th className="text-left text-xs text-white/50 pb-2 pr-4">ID</th>
                          <th className="text-left text-xs text-white/50 pb-2 pr-4 capitalize">
                            {bot.collectible.singular}
                          </th>
                          <th className="text-left text-xs text-white/50 pb-2 pr-4">Class</th>
                          <th className="text-right text-xs text-white/50 pb-2">global_caught</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...topNations]
                          .sort((a, b) => b.globalCaught - a.globalCaught)
                          .map((entry, i) => (
                            <motion.tr
                              key={entry.id}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.45 + i * 0.06 }}
                              className="border-t border-[#252525]"
                            >
                              <td className="py-2 pr-4 font-mono text-xs text-white/50">
                                {entry.id}
                              </td>
                              <td className="text-xs sm:text-sm text-white/70 py-2 pr-4 font-medium">
                                {entry.name}
                              </td>
                              <td className="py-2 pr-4 text-xs text-white/50 capitalize">
                                {formatRarity(entry.class)}
                              </td>
                              <td className="py-2 text-right text-sm text-white">
                                {entry.globalCaught.toLocaleString()}
                              </td>
                            </motion.tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </Tilt3D>
          )}

          {showGrowthChart && (
            <Tilt3D enterDelay={0.42} maxTilt={6} lift={6} className={growthChartSpan}>
              <Card className="bg-[#1A1A1A] border-[#252525] hover:border-[#333] transition-colors h-full">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h3 className="text-sm font-medium text-white/70">
                      {growthChartTitles[selectedFilter]}
                    </h3>

                    <div className="relative z-20 flex w-full rounded bg-[#252525] p-0.5 sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setTimeRange('Month')}
                        className={`relative min-h-8 flex-1 cursor-pointer select-none rounded px-3 py-1.5 text-xs touch-manipulation sm:flex-none ${
                          timeRange === 'Month'
                            ? 'text-[#0F0F0F]'
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        {timeRange === 'Month' && (
                          <motion.span
                            layoutId="time-range-pill"
                            className="pointer-events-none absolute inset-0 rounded bg-white"
                            transition={springSnappy}
                          />
                        )}
                        <span className="pointer-events-none relative z-10">Month</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTimeRange('Annually')}
                        className={`relative min-h-8 flex-1 cursor-pointer select-none rounded px-3 py-1.5 text-xs touch-manipulation sm:flex-none ${
                          timeRange === 'Annually'
                            ? 'text-[#0F0F0F]'
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        {timeRange === 'Annually' && (
                          <motion.span
                            layoutId="time-range-pill"
                            className="pointer-events-none absolute inset-0 rounded bg-white"
                            transition={springSnappy}
                          />
                        )}
                        <span className="pointer-events-none relative z-10">Annually</span>
                      </button>
                    </div>
                  </div>

                  {/* CHART */}
                  <div className="space-y-3 sm:space-y-4">
                    {['Jun', 'Jul', 'Aug'].map((month, idx) => {
                      const height = [15, 20, 25][idx];
                      const isAug = month === 'Aug';

                      return (
                        <div key={month} className="flex items-end gap-2 sm:gap-3">
                          <div className="w-8 sm:w-10 text-xs text-white/50 shrink-0">{month}</div>

                          <div className="flex-1 relative preserve-3d" style={{ perspective: 600 }}>
                            <motion.div
                              key={`${month}-${timeRange}-${selectedFilter}`}
                              initial={
                                reducedMotion
                                  ? { height: 0, opacity: 0 }
                                  : enable3D
                                    ? { height: 0, opacity: 0, rotateX: 88 }
                                    : { height: 0, opacity: 0 }
                              }
                              animate={{ height: `${height * 3}px`, opacity: 1, rotateX: 0 }}
                              transition={{ delay: 0.55 + idx * 0.1, ...springSnappy }}
                              style={{
                                transformOrigin: 'bottom',
                                ...(enable3D ? { transformPerspective: perspectiveDefault } : {}),
                              }}
                              className={`preserve-3d gpu-layer relative rounded-t ${
                                isAug ? 'bg-purple-400' : 'bg-gray-700'
                              }`}
                            >
                              {isAug && (
                                <motion.div
                                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  transition={{ delay: 0.9 }}
                                  className="
                      absolute left-1/2 -translate-x-1/2
                      -top-9 sm:-top-10
                      bg-yellow-500 text-[#0F0F0F]
                      text-[10px] px-2 py-1 rounded
                      text-center leading-tight
                      whitespace-nowrap
                      shadow-md
                    "
                                >
                                  +22.9%
                                  <br />
                                  August, 2024
                                  <br />
                                  432,988
                                </motion.div>
                              )}
                            </motion.div>
                          </div>

                          <div className="w-6 sm:w-8 text-[10px] text-white/30 text-right shrink-0">
                            {height}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </Tilt3D>
          )}
        </div>
      )}

      {showLogs && (
        <Card className="bg-[#1A1A1A] border-[#252525] hover:border-[#333] transition-colors">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-white/70" />
                <h3 className="text-sm font-medium text-white/70">
                  {selectedFilter === 'Activity' || selectedFilter === 'All'
                    ? 'Activity Log'
                    : `${selectedFilter} Log`}
                </h3>
              </div>
              <div className="relative z-20 flex flex-wrap gap-2">
                {(['all', 'info', 'warn', 'error'] as const).map((level) => (
                  <button
                    type="button"
                    key={level}
                    onClick={() => setLogFilter(level)}
                    className={`relative min-h-9 cursor-pointer select-none rounded-md px-3 py-2 text-xs font-medium capitalize touch-manipulation transition-colors ${
                      logFilter === level
                        ? 'text-[#0F0F0F]'
                        : 'bg-[#252525] text-white/60 hover:bg-[#2a2a2a] hover:text-white active:bg-[#333]'
                    }`}
                  >
                    {logFilter === level && (
                      <motion.span
                        layoutId="log-level-pill"
                        className="pointer-events-none absolute inset-0 rounded-md bg-white"
                        transition={springSnappy}
                      />
                    )}
                    <span className="pointer-events-none relative z-10">{level}</span>
                  </button>
                ))}
              </div>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-1 max-h-[420px] overflow-y-auto"
            >
              <AnimatePresence mode="popLayout">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      layout
                      variants={listItem}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      whileHover={
                        reducedMotion
                          ? { x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }
                          : enable3D
                            ? { x: 4, rotateY: 2, backgroundColor: 'rgba(255,255,255,0.05)' }
                            : { x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }
                      }
                      style={enable3D ? { transformPerspective: 800 } : undefined}
                      className="preserve-3d flex items-start gap-3 py-2.5 px-3 rounded-lg transition-colors"
                    >
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${levelColors[log.level] ?? ''}`}
                      >
                        {log.level}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{log.message}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-white/40 py-6 text-center"
                  >
                    No logs for this filter.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
