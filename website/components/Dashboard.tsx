import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, FileText, Globe, Server, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AnimatedPanel } from '@/components/ui/animated-panel';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIs3DEnabled, useReducedMotion } from '@/hooks/useReducedMotion';
import { admin } from '@/lib/admin-classes';
import {
  bot,
  formatRarity,
  placeholderCatalog,
  placeholderLogs,
  placeholderStats,
} from '@/lib/bot';
import { fadeUp, listItem, springSnappy, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';

const stats = [
  {
    id: 1,
    label: 'Registered Users',
    value: placeholderStats.userCount.toLocaleString(),
    change: 'ForgeDB user vars',
    icon: Users,
  },
  {
    id: 2,
    label: `${bot.collectible.plural.charAt(0).toUpperCase()}${bot.collectible.plural.slice(1)} Caught`,
    value: placeholderStats.totalCaught.toLocaleString(),
    change: `${bot.vars.globalCatalog}.total_caught`,
    icon: Globe,
  },
  {
    id: 3,
    label: 'Catalog Size',
    value: placeholderStats.catalogTotal.toLocaleString(),
    change: `${bot.vars.globalCatalog}.total`,
    icon: ArrowUpRight,
  },
  {
    id: 4,
    label: 'Active Servers',
    value: placeholderStats.guildCount.toLocaleString(),
    change: 'Guilds with spawnConfig',
    icon: Server,
  },
] as const;

const trendCharts = [
  { id: 'new-players', title: 'New Players' },
  { id: 'spawn-activity', title: 'Spawn Activity' },
  { id: 'catch-growth', title: 'Catch Growth' },
] as const;

const chartMonths = ['Jun', 'Jul', 'Aug'] as const;
const chartHeights = [15, 20, 25];

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

type TimeRange = 'Month' | 'Annually';

function TimeRangeToggle({
  value,
  onChange,
  layoutId,
}: {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  layoutId: string;
}) {
  return (
    <div className="relative z-20 flex w-full rounded bg-[var(--admin-elevated)] p-0.5 sm:w-auto">
      {(['Month', 'Annually'] as const).map((range) => (
        <button
          type="button"
          key={range}
          onClick={() => onChange(range)}
          className={cn(
            'relative min-h-8 flex-1 cursor-pointer select-none rounded px-3 py-1.5 text-xs touch-manipulation sm:flex-none',
            value === range
              ? 'text-[var(--admin-accent-fg)]'
              : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
          )}
        >
          {value === range && (
            <motion.span
              layoutId={layoutId}
              className="pointer-events-none absolute inset-0 rounded bg-[var(--admin-accent)]"
              transition={springSnappy}
            />
          )}
          <span className="pointer-events-none relative z-10">{range}</span>
        </button>
      ))}
    </div>
  );
}

function TrendChartCard({
  title,
  timeRange,
  onTimeRangeChange,
  chartId,
  enterDelay = 0,
}: {
  title: string;
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
  chartId: string;
  enterDelay?: number;
}) {
  const reducedMotion = useReducedMotion();
  const enable3D = useIs3DEnabled();

  return (
    <AnimatedPanel enterDelay={enterDelay} maxTilt={5}>
      <Card className={cn(admin.card, 'h-full')}>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className={cn('text-sm font-medium', admin.muted)}>{title}</h3>
            <TimeRangeToggle
              value={timeRange}
              onChange={onTimeRangeChange}
              layoutId={`time-range-${chartId}`}
            />
          </div>

          <div className="space-y-3">
            {chartMonths.map((month, idx) => {
              const height = chartHeights[idx];
              const isAug = month === 'Aug';

              return (
                <div key={`${chartId}-${month}`} className="flex items-end gap-2 sm:gap-3">
                  <div className={cn('w-8 shrink-0 text-xs sm:w-10', admin.muted)}>{month}</div>
                  <div className="relative flex-1">
                    <motion.div
                      key={`${chartId}-${month}-${timeRange}`}
                      initial={
                        reducedMotion
                          ? false
                          : enable3D
                            ? { height: 0, opacity: 0, scaleY: 0.6 }
                            : { height: 0, opacity: 0 }
                      }
                      animate={{ height: `${height * 3}px`, opacity: 1, scaleY: 1 }}
                      transition={{ delay: 0.1 + idx * 0.08, ...springSnappy }}
                      style={{ transformOrigin: 'bottom' }}
                      className={cn(
                        'relative rounded-t',
                        isAug
                          ? 'bg-[var(--admin-accent)]'
                          : 'bg-[color-mix(in_srgb,var(--admin-fg)_18%,transparent)]'
                      )}
                    >
                      {isAug && chartId === 'catch-growth' && (
                        <div
                          className={cn(
                            'absolute left-1/2 -top-9 sm:-top-10 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-center text-[10px] leading-tight shadow-md',
                            'bg-yellow-500 text-[var(--admin-accent-fg)]'
                          )}
                        >
                          +22.9%
                          <br />
                          August, 2024
                          <br />
                          432,988
                        </div>
                      )}
                    </motion.div>
                  </div>
                  <div className={cn('w-6 shrink-0 text-right text-[10px] sm:w-8', admin.muted)}>
                    {height}%
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </AnimatedPanel>
  );
}

export default function Dashboard({ logSearchQuery = '' }: { logSearchQuery?: string }) {
  const [timeRanges, setTimeRanges] = useState<Record<string, TimeRange>>({
    'new-players': 'Annually',
    'spawn-activity': 'Annually',
    'catch-growth': 'Annually',
  });
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const reducedMotion = useReducedMotion();

  const filteredLogs = useMemo(() => {
    const byLevel =
      logFilter === 'all'
        ? placeholderLogs
        : placeholderLogs.filter((log) => log.level === logFilter);
    if (!logSearchQuery.trim()) return byLevel;
    const q = logSearchQuery.toLowerCase();
    return byLevel.filter(
      (log) =>
        log.message.toLowerCase().includes(q) ||
        log.topic.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q)
    );
  }, [logFilter, logSearchQuery]);

  const setChartTimeRange = (chartId: string, range: TimeRange) => {
    setTimeRanges((current) => ({ ...current, [chartId]: range }));
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4"
      >
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.id} variants={listItem} className="h-full">
              <AnimatedPanel enterDelay={i * 0.06} maxTilt={7}>
                <Card className={cn(admin.card, 'h-full')}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className={cn('text-xs font-medium sm:text-sm', admin.muted)}>
                        {stat.label}
                      </h3>
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                          admin.elevated
                        )}
                      >
                        <Icon className="h-4 w-4 text-[var(--admin-accent)]" />
                      </div>
                    </div>
                    <motion.p
                      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn('mb-1 text-xl font-bold tabular-nums sm:text-2xl', admin.fg)}
                    >
                      {stat.value}
                    </motion.p>
                    <p className={cn('font-mono text-xs', admin.muted)}>{stat.change}</p>
                  </CardContent>
                </Card>
              </AnimatedPanel>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        {trendCharts.map((chart, i) => (
          <TrendChartCard
            key={chart.id}
            chartId={chart.id}
            title={chart.title}
            timeRange={timeRanges[chart.id] ?? 'Annually'}
            onTimeRangeChange={(range) => setChartTimeRange(chart.id, range)}
            enterDelay={0.12 + i * 0.08}
          />
        ))}
      </div>

      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Card className={cn(admin.card)}>
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <h3 className={cn('text-sm font-medium capitalize', admin.muted)}>
                Top caught {bot.collectible.plural}
              </h3>
              <Select defaultValue="all">
                <SelectTrigger
                  className={cn('min-h-9 h-9 w-full cursor-pointer text-xs sm:w-36', admin.input)}
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
            </div>

            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr>
                    <th className={cn('pb-2 pr-4 text-left text-xs', admin.muted)}>ID</th>
                    <th className={cn('pb-2 pr-4 text-left text-xs capitalize', admin.muted)}>
                      {bot.collectible.singular}
                    </th>
                    <th className={cn('pb-2 pr-4 text-left text-xs', admin.muted)}>Class</th>
                    <th className={cn('pb-2 text-right text-xs', admin.muted)}>global_caught</th>
                  </tr>
                </thead>
                <tbody>
                  {[...topNations]
                    .sort((a, b) => b.globalCaught - a.globalCaught)
                    .map((entry, i) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.04 }}
                        className="border-t border-[var(--admin-border)]"
                      >
                        <td className={cn('py-2 pr-4 font-mono text-xs', admin.muted)}>
                          {entry.id}
                        </td>
                        <td className={cn('py-2 pr-4 text-xs font-medium sm:text-sm', admin.muted)}>
                          {entry.name}
                        </td>
                        <td className={cn('py-2 pr-4 text-xs capitalize', admin.muted)}>
                          {formatRarity(entry.class)}
                        </td>
                        <td className={cn('py-2 text-right text-sm', admin.fg)}>
                          {entry.globalCaught.toLocaleString()}
                        </td>
                      </motion.tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
        <Card className={cn(admin.card)}>
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <FileText className={cn('h-4 w-4', admin.muted)} />
                <h3 className={cn('text-sm font-medium', admin.muted)}>Activity Log</h3>
              </div>
              <div className="relative z-20 flex flex-wrap gap-2">
                {(['all', 'info', 'warn', 'error'] as const).map((level) => (
                  <button
                    type="button"
                    key={level}
                    onClick={() => setLogFilter(level)}
                    className={cn(
                      'relative min-h-9 cursor-pointer select-none rounded-md px-3 py-2 text-xs font-medium capitalize touch-manipulation transition-colors',
                      logFilter === level
                        ? 'text-[var(--admin-accent-fg)]'
                        : cn(admin.elevated, admin.muted, 'hover:text-[var(--admin-fg)]')
                    )}
                  >
                    {logFilter === level && (
                      <motion.span
                        layoutId="log-level-pill"
                        className="pointer-events-none absolute inset-0 rounded-md bg-[var(--admin-accent)]"
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
              className="max-h-[420px] space-y-1 overflow-y-auto"
            >
              <AnimatePresence initial={false}>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      variants={listItem}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className={cn(
                        'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors',
                        admin.hoverRow
                      )}
                    >
                      <span
                        className={cn(
                          'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
                          levelColors[log.level] ?? ''
                        )}
                      >
                        {log.level}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate text-sm', admin.fg)}>{log.message}</p>
                        <p className={cn('mt-0.5 text-[10px]', admin.muted)}>
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className={cn('py-6 text-center text-sm', admin.muted)}>
                    No logs for this filter.
                  </p>
                )}
              </AnimatePresence>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
