import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, FileText, Globe, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useIs3DEnabled, useReducedMotion } from "@/hooks/useReducedMotion";
import { admin } from "@/lib/admin-classes";
import {
	bot,
	formatRarity,
	type LogTopic,
	placeholderCatalog,
	placeholderLogs,
	placeholderStats,
} from "@/lib/bot";
import { listItem, perspectiveDefault, springSnappy, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

const stats = [
	{
		category: "Users",
		change: "ForgeDB user vars",
		icon: Users,
		id: 1,
		label: "Registered Users",
		value: placeholderStats.userCount.toLocaleString(),
	},
	{
		category: "Nations",
		change: `${bot.vars.globalCatalog}.total_caught`,
		icon: Globe,
		id: 2,
		label: `${bot.collectible.plural.charAt(0).toUpperCase()}${bot.collectible.plural.slice(1)} Caught`,
		value: placeholderStats.totalCaught.toLocaleString(),
	},
	{
		category: "Nations",
		change: `${bot.vars.globalCatalog}.total`,
		icon: ArrowUpRight,
		id: 3,
		label: "Catalog Size",
		value: placeholderStats.catalogTotal.toLocaleString(),
	},
	{
		category: "Servers",
		change: "Guilds with spawnConfig",
		icon: ArrowUpRight,
		id: 4,
		label: "Active Servers",
		value: placeholderStats.guildCount.toLocaleString(),
	},
] as const;

type StatCategory = (typeof stats)[number]["category"];
type DashboardFilter = "All" | StatCategory | "Activity";
type LogFilter = "all" | "info" | "warn" | "error";
type TimeRange = "Month" | "Annually";

const filterOptions: DashboardFilter[] = ["All", "Users", "Nations", "Servers", "Activity"];

const filterHeadlines: Record<DashboardFilter, string> = {
	Activity: "Bot runtime and ForgeScript logs.",
	All: `${bot.name} overview — mirrors /info about stats.`,
	Nations: `${bot.collectible.plural.charAt(0).toUpperCase()}${bot.collectible.plural.slice(1)} catches and ${bot.vars.globalCatalog} catalog.`,
	Servers: "Guild spawnConfig and server activity.",
	Users: "Players and getUserData inventories.",
};

const growthChartTitles: Record<DashboardFilter, string> = {
	Activity: "Catch Growth",
	All: "Catch Growth",
	Nations: "Catch Growth",
	Servers: "Spawn Activity",
	Users: "New Players",
};

const filterVisibility: Record<
	DashboardFilter,
	{ showGrowthChart: boolean; showLogs: boolean; showNationsChart: boolean; showStats: boolean }
> = {
	Activity: { showGrowthChart: false, showLogs: true, showNationsChart: false, showStats: false },
	All: { showGrowthChart: true, showLogs: true, showNationsChart: true, showStats: true },
	Nations: { showGrowthChart: true, showLogs: true, showNationsChart: true, showStats: true },
	Servers: { showGrowthChart: true, showLogs: true, showNationsChart: false, showStats: true },
	Users: { showGrowthChart: true, showLogs: true, showNationsChart: false, showStats: true },
};

const topNations = placeholderCatalog.map((entry) => ({
	class: entry.class,
	globalCaught: entry.globalCaught,
	id: entry.id,
	name: entry.name,
}));

const levelColors: Record<string, string> = {
	error: "text-red-400 bg-red-400/10",
	info: "text-blue-400 bg-blue-400/10",
	warn: "text-yellow-400 bg-yellow-400/10",
};

const growthBars = [
	{ height: 15, month: "Jun" },
	{ height: 20, month: "Jul" },
	{ height: 25, month: "Aug" },
] as const;

function getVisibleStats(filter: DashboardFilter) {
	if (filter === "All") return stats;
	if (filter === "Activity") return [];
	return stats.filter((stat) => stat.category === filter);
}

function getLogsForFilter(filter: DashboardFilter) {
	if (filter === "All" || filter === "Activity") return [...placeholderLogs];
	return placeholderLogs.filter((log) => log.topic === (filter as LogTopic));
}

function getStatsGridClass(count: number) {
	if (count === 1) return "grid-cols-1 max-w-sm";
	if (count === 2) return "grid-cols-1 sm:grid-cols-2";
	return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";
}

function filterLogsByQuery(logs: typeof placeholderLogs, query: string) {
	if (!query.trim()) return logs;
	const q = query.toLowerCase();
	return logs.filter(
		(log) =>
			log.message.toLowerCase().includes(q) ||
			log.topic.toLowerCase().includes(q) ||
			log.level.toLowerCase().includes(q),
	);
}

export default function Dashboard({ logSearchQuery = "" }: { logSearchQuery?: string }) {
	const [selectedFilter, setSelectedFilter] = useState<DashboardFilter>("All");
	const [timeRange, setTimeRange] = useState<TimeRange>("Annually");
	const [logFilter, setLogFilter] = useState<LogFilter>("all");

	useEffect(() => {
		if (logSearchQuery) {
			setSelectedFilter("All");
			setLogFilter("all");
		}
	}, [logSearchQuery]);

	const visibility = filterVisibility[selectedFilter];
	const visibleStats = getVisibleStats(selectedFilter);
	const logsForFilter = getLogsForFilter(selectedFilter);

	const filteredLogs = useMemo(() => {
		const byLevel =
			logFilter === "all" ? logsForFilter : logsForFilter.filter((log) => log.level === logFilter);
		return filterLogsByQuery(byLevel, logSearchQuery);
	}, [logsForFilter, logFilter, logSearchQuery]);

	return (
		<div className="w-full space-y-4 sm:space-y-6">
			<DashboardHeader selectedFilter={selectedFilter} setSelectedFilter={setSelectedFilter} />
			<StatsGrid
				selectedFilter={selectedFilter}
				showStats={visibility.showStats}
				visibleStats={visibleStats}
			/>
			<ChartsSection
				selectedFilter={selectedFilter}
				setTimeRange={setTimeRange}
				showGrowthChart={visibility.showGrowthChart}
				showNationsChart={visibility.showNationsChart}
				timeRange={timeRange}
			/>
			{visibility.showLogs && (
				<LogsSection
					filteredLogs={filteredLogs}
					logFilter={logFilter}
					selectedFilter={selectedFilter}
					setLogFilter={setLogFilter}
				/>
			)}
		</div>
	);
}

function DashboardHeader({
	selectedFilter,
	setSelectedFilter,
}: {
	selectedFilter: DashboardFilter;
	setSelectedFilter: (filter: DashboardFilter) => void;
}) {
	return (
		<div className="mb-4 sm:mb-6 space-y-3">
			<AnimatePresence mode="wait">
				<motion.div
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -6 }}
					initial={{ opacity: 0, y: 10 }}
					key={selectedFilter}
					transition={{ duration: 0.2 }}
				>
					<h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--admin-fg)] mb-2 px-1 sm:px-0">
						{filterHeadlines[selectedFilter]}
					</h1>
					<p className="text-xs text-[var(--admin-muted)] px-1 sm:px-0">
						{bot.name} v{bot.version} · prefixes {bot.prefixes.join(", ")}
					</p>
				</motion.div>
			</AnimatePresence>

			<div className="flex flex-wrap gap-2.5 px-1 sm:px-0">
				{filterOptions.map((filter) => (
					<FilterPill
						filter={filter}
						key={filter}
						onSelect={setSelectedFilter}
						selected={selectedFilter === filter}
					/>
				))}
			</div>
		</div>
	);
}

function FilterPill({
	filter,
	onSelect,
	selected,
}: {
	filter: DashboardFilter;
	onSelect: (filter: DashboardFilter) => void;
	selected: boolean;
}) {
	return (
		<button
			className={`relative min-h-9 cursor-pointer select-none rounded-full px-4 py-2 text-sm font-medium transition-colors touch-manipulation ${
				selected
					? "text-[var(--admin-accent-fg)]"
					: "bg-[var(--admin-card)] text-[var(--admin-muted)] hover:bg-[var(--admin-elevated)] hover:text-[var(--admin-fg)] active:bg-[color-mix(in_srgb,var(--admin-fg)_8%,var(--admin-card))]"
			}`}
			onClick={() => onSelect(filter)}
			type="button"
		>
			{selected && (
				<motion.span
					className="pointer-events-none absolute inset-0 rounded-full bg-[var(--admin-accent)]"
					layoutId="dashboard-filter-pill"
					transition={springSnappy}
				/>
			)}
			<span className="pointer-events-none relative z-10">{filter}</span>
		</button>
	);
}

function StatsGrid({
	selectedFilter,
	showStats,
	visibleStats,
}: {
	selectedFilter: DashboardFilter;
	showStats: boolean;
	visibleStats: typeof stats;
}) {
	const reducedMotion = useReducedMotion();

	return (
		<AnimatePresence mode="popLayout">
			{showStats && (
				<motion.div
					animate="show"
					className={`grid gap-3 sm:gap-4 ${getStatsGridClass(visibleStats.length)}`}
					exit={{ opacity: 0, transition: { duration: 0.15 }, y: -8 }}
					initial="hidden"
					key={`stats-${selectedFilter}`}
					variants={staggerContainer}
				>
					{visibleStats.map((stat) => (
						<StatCard key={stat.id} reducedMotion={reducedMotion} stat={stat} />
					))}
				</motion.div>
			)}
		</AnimatePresence>
	);
}

function StatCard({
	reducedMotion,
	stat,
}: {
	reducedMotion: boolean;
	stat: (typeof stats)[number];
}) {
	const Icon = stat.icon;

	return (
		<motion.div className="h-full" variants={listItem}>
			<Card className="bg-[var(--admin-card)] border-[var(--admin-border)] hover:border-[var(--admin-border)] transition-colors h-full">
				<CardContent className="p-4 sm:p-5">
					<div className="flex items-start justify-between mb-3 gap-3">
						<h3 className="text-xs sm:text-sm font-medium text-[var(--admin-muted)]">
							{stat.label}
						</h3>
						<div
							className={cn(
								"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
								admin.elevated,
							)}
						>
							<Icon className="h-4 w-4 text-[var(--admin-accent)]" />
						</div>
					</div>
					<motion.p
						animate={{ opacity: 1, y: 0 }}
						className="text-xl sm:text-2xl font-bold text-[var(--admin-fg)] mb-1 tabular-nums"
						initial={reducedMotion ? false : { opacity: 0, y: 6 }}
						key={stat.value}
						transition={{ duration: 0.2 }}
					>
						{stat.value}
					</motion.p>
					{stat.change && (
						<p className="text-xs text-[var(--admin-muted)] font-mono">{stat.change}</p>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
}

function ChartsSection({
	selectedFilter,
	setTimeRange,
	showGrowthChart,
	showNationsChart,
	timeRange,
}: {
	selectedFilter: DashboardFilter;
	setTimeRange: (range: TimeRange) => void;
	showGrowthChart: boolean;
	showNationsChart: boolean;
	timeRange: TimeRange;
}) {
	if (!showNationsChart && !showGrowthChart) return null;

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 items-start">
			{showNationsChart && <NationsChart />}
			{showGrowthChart && (
				<GrowthChart
					className={showNationsChart ? "" : "lg:col-span-3"}
					selectedFilter={selectedFilter}
					setTimeRange={setTimeRange}
					timeRange={timeRange}
				/>
			)}
		</div>
	);
}

function NationsChart() {
	return (
		<Card className="lg:col-span-2 bg-[var(--admin-card)] border-[var(--admin-border)] hover:border-[var(--admin-border)] transition-colors h-full">
			<CardContent className="p-4 sm:p-5">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
					<h3 className="text-sm font-medium text-[var(--admin-muted)] capitalize">
						Top caught {bot.collectible.plural}
					</h3>
					<div className="relative z-20 w-full sm:w-auto">
						<Select defaultValue="all">
							<SelectTrigger className="min-h-9 w-full cursor-pointer touch-manipulation bg-[var(--admin-elevated)] text-[var(--admin-fg)] text-xs border-[var(--admin-border)] sm:min-w-[9rem] sm:w-auto h-9">
								<SelectValue placeholder="All classes" />
							</SelectTrigger>
							<SelectContent className="bg-[var(--admin-elevated)] border-[var(--admin-border)]">
								<SelectItem value="all">All classes</SelectItem>
								{bot.rarityClasses.map((rarity) => (
									<SelectItem className="capitalize" key={rarity} value={rarity}>
										{formatRarity(rarity)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
					<table className="w-full min-w-[400px]">
						<thead>
							<tr>
								<th className="text-left text-xs text-[var(--admin-muted)] pb-2 pr-4">ID</th>
								<th className="text-left text-xs text-[var(--admin-muted)] pb-2 pr-4 capitalize">
									{bot.collectible.singular}
								</th>
								<th className="text-left text-xs text-[var(--admin-muted)] pb-2 pr-4">Class</th>
								<th className="text-right text-xs text-[var(--admin-muted)] pb-2">global_caught</th>
							</tr>
						</thead>
						<tbody>
							{[...topNations]
								.sort((a, b) => b.globalCaught - a.globalCaught)
								.map((entry, i) => (
									<motion.tr
										animate={{ opacity: 1, x: 0 }}
										className="border-t border-[var(--admin-border)]"
										initial={{ opacity: 0, x: -12 }}
										key={entry.id}
										transition={{ delay: 0.45 + i * 0.06 }}
									>
										<td className="py-2 pr-4 font-mono text-xs text-[var(--admin-muted)]">
											{entry.id}
										</td>
										<td className="text-xs sm:text-sm text-[var(--admin-muted)] py-2 pr-4 font-medium">
											{entry.name}
										</td>
										<td className="py-2 pr-4 text-xs text-[var(--admin-muted)] capitalize">
											{formatRarity(entry.class)}
										</td>
										<td className="py-2 text-right text-sm text-[var(--admin-fg)]">
											{entry.globalCaught.toLocaleString()}
										</td>
									</motion.tr>
								))}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}

function GrowthChart({
	className,
	selectedFilter,
	setTimeRange,
	timeRange,
}: {
	className?: string;
	selectedFilter: DashboardFilter;
	setTimeRange: (range: TimeRange) => void;
	timeRange: TimeRange;
}) {
	return (
		<Card
			className={cn(
				"bg-[var(--admin-card)] border-[var(--admin-border)] hover:border-[var(--admin-border)] transition-colors h-full",
				className,
			)}
		>
			<CardContent className="p-4 sm:p-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
					<h3 className="text-sm font-medium text-[var(--admin-muted)]">
						{growthChartTitles[selectedFilter]}
					</h3>

					<div className="relative z-20 flex w-full rounded bg-[var(--admin-elevated)] p-0.5 sm:w-auto">
						<TimeRangeButton
							current={timeRange}
							label="Month"
							onSelect={setTimeRange}
							value="Month"
						/>
						<TimeRangeButton
							current={timeRange}
							label="Annually"
							onSelect={setTimeRange}
							value="Annually"
						/>
					</div>
				</div>

				<div className="space-y-3 sm:space-y-4">
					{growthBars.map((bar, idx) => (
						<GrowthBar
							idx={idx}
							key={bar.month}
							{...bar}
							selectedFilter={selectedFilter}
							timeRange={timeRange}
						/>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function TimeRangeButton({
	current,
	label,
	onSelect,
	value,
}: {
	current: TimeRange;
	label: string;
	onSelect: (value: TimeRange) => void;
	value: TimeRange;
}) {
	const selected = current === value;

	return (
		<button
			className={`relative min-h-8 flex-1 cursor-pointer select-none rounded px-3 py-1.5 text-xs touch-manipulation sm:flex-none ${
				selected
					? "text-[var(--admin-accent-fg)]"
					: "text-[var(--admin-muted)] hover:text-[var(--admin-fg)]"
			}`}
			onClick={() => onSelect(value)}
			type="button"
		>
			{selected && (
				<motion.span
					className="pointer-events-none absolute inset-0 rounded bg-[var(--admin-accent)]"
					layoutId="time-range-pill"
					transition={springSnappy}
				/>
			)}
			<span className="pointer-events-none relative z-10">{label}</span>
		</button>
	);
}

function GrowthBar({
	height,
	idx,
	month,
	selectedFilter,
	timeRange,
}: {
	height: number;
	idx: number;
	month: string;
	selectedFilter: DashboardFilter;
	timeRange: TimeRange;
}) {
	const reducedMotion = useReducedMotion();
	const enable3D = useIs3DEnabled();
	const isAug = month === "Aug";

	return (
		<div className="flex items-end gap-2 sm:gap-3">
			<div className="w-8 sm:w-10 text-xs text-[var(--admin-muted)] shrink-0">{month}</div>

			<div className="flex-1 relative preserve-3d" style={{ perspective: 600 }}>
				<motion.div
					animate={{ height: `${height * 3}px`, opacity: 1, rotateX: 0 }}
					className={`preserve-3d gpu-layer relative rounded-t ${isAug ? "bg-purple-400" : "bg-gray-700"}`}
					initial={
						reducedMotion
							? { height: 0, opacity: 0 }
							: enable3D
								? { height: 0, opacity: 0, rotateX: 88 }
								: { height: 0, opacity: 0 }
					}
					key={`${month}-${timeRange}-${selectedFilter}`}
					style={{
						transformOrigin: "bottom",
						...(enable3D ? { transformPerspective: perspectiveDefault } : {}),
					}}
					transition={{ delay: 0.55 + idx * 0.1, ...springSnappy }}
				>
					{isAug && (
						<motion.div
							animate={{ opacity: 1, scale: 1, y: 0 }}
							className="
                      absolute left-1/2 -translate-x-1/2
                      -top-9 sm:-top-10
                      bg-yellow-500 text-[var(--admin-accent-fg)]
                      text-[10px] px-2 py-1 rounded
                      text-center leading-tight
                      whitespace-nowrap
                      shadow-md
                    "
							initial={{ opacity: 0, scale: 0.9, y: 6 }}
							transition={{ delay: 0.9 }}
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

			<div className="w-6 sm:w-8 text-[10px] text-[var(--admin-muted)] text-right shrink-0">
				{height}%
			</div>
		</div>
	);
}

function LogsSection({
	filteredLogs,
	logFilter,
	selectedFilter,
	setLogFilter,
}: {
	filteredLogs: typeof placeholderLogs;
	logFilter: LogFilter;
	selectedFilter: DashboardFilter;
	setLogFilter: (filter: LogFilter) => void;
}) {
	const logTitle =
		selectedFilter === "Activity" || selectedFilter === "All"
			? "Activity Log"
			: `${selectedFilter} Log`;

	return (
		<Card className="bg-[var(--admin-card)] border-[var(--admin-border)] hover:border-[var(--admin-border)] transition-colors">
			<CardContent className="p-4 sm:p-5 space-y-4">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<FileText className="w-4 h-4 text-[var(--admin-muted)]" />
						<h3 className="text-sm font-medium text-[var(--admin-muted)]">{logTitle}</h3>
					</div>
					<div className="relative z-20 flex flex-wrap gap-2">
						{(["all", "info", "warn", "error"] as const).map((level) => (
							<LogFilterButton
								key={level}
								level={level}
								selected={logFilter === level}
								setLogFilter={setLogFilter}
							/>
						))}
					</div>
				</div>

				<motion.div
					animate="show"
					className="space-y-1 max-h-[420px] overflow-y-auto"
					initial="hidden"
					variants={staggerContainer}
				>
					<AnimatePresence initial={false}>
						{filteredLogs.length > 0 ? (
							filteredLogs.map((log) => <LogRow key={log.id} log={log} />)
						) : (
							<motion.p
								animate={{ opacity: 1 }}
								className="text-sm text-[var(--admin-muted)] py-6 text-center"
								initial={{ opacity: 0 }}
								key="empty"
							>
								No logs for this filter.
							</motion.p>
						)}
					</AnimatePresence>
				</motion.div>
			</CardContent>
		</Card>
	);
}

function LogFilterButton({
	level,
	selected,
	setLogFilter,
}: {
	level: LogFilter;
	selected: boolean;
	setLogFilter: (filter: LogFilter) => void;
}) {
	return (
		<button
			className={`relative min-h-9 cursor-pointer select-none rounded-md px-3 py-2 text-xs font-medium capitalize touch-manipulation transition-colors ${
				selected
					? "text-[var(--admin-accent-fg)]"
					: "bg-[var(--admin-elevated)] text-[var(--admin-muted)] hover:opacity-90 hover:text-[var(--admin-fg)] active:bg-[color-mix(in_srgb,var(--admin-fg)_10%,var(--admin-elevated))]"
			}`}
			onClick={() => setLogFilter(level)}
			type="button"
		>
			{selected && (
				<motion.span
					className="pointer-events-none absolute inset-0 rounded-md bg-[var(--admin-accent)]"
					layoutId="log-level-pill"
					transition={springSnappy}
				/>
			)}
			<span className="pointer-events-none relative z-10">{level}</span>
		</button>
	);
}

function LogRow({ log }: { log: (typeof placeholderLogs)[number] }) {
	return (
		<motion.div
			animate="show"
			className={cn(
				"flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
				admin.hoverRow,
			)}
			exit="exit"
			initial="hidden"
			variants={listItem}
		>
			<span
				className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${levelColors[log.level] ?? ""}`}
			>
				{log.level}
			</span>
			<div className="flex-1 min-w-0">
				<p className="text-sm text-[var(--admin-fg)] truncate">{log.message}</p>
				<p className="text-[10px] text-[var(--admin-muted)] mt-0.5">
					{new Date(log.timestamp).toLocaleString()}
				</p>
			</div>
		</motion.div>
	);
}
