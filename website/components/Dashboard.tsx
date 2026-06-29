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
import {
	listItem,
	perspectiveDefault,
	springSnappy,
	staggerContainer,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

const stats = [
	{
		id: 1,
		category: "Users",
		label: "Registered Users",
		value: placeholderStats.userCount.toLocaleString(),
		change: "ForgeDB user vars",
		icon: Users,
	},
	{
		id: 2,
		category: "Nations",
		label: `${bot.collectible.plural.charAt(0).toUpperCase()}${bot.collectible.plural.slice(1)} Caught`,
		value: placeholderStats.totalCaught.toLocaleString(),
		change: `${bot.vars.globalCatalog}.total_caught`,
		icon: Globe,
	},
	{
		id: 3,
		category: "Nations",
		label: "Catalog Size",
		value: placeholderStats.catalogTotal.toLocaleString(),
		change: `${bot.vars.globalCatalog}.total`,
		icon: ArrowUpRight,
	},
	{
		id: 4,
		category: "Servers",
		label: "Active Servers",
		value: placeholderStats.guildCount.toLocaleString(),
		change: "Guilds with spawnConfig",
		icon: ArrowUpRight,
	},
] as const;

type StatCategory = (typeof stats)[number]["category"];
type DashboardFilter = "All" | StatCategory | "Activity";

const filterOptions: DashboardFilter[] = [
	"All",
	"Users",
	"Nations",
	"Servers",
	"Activity",
];

const filterHeadlines: Record<DashboardFilter, string> = {
	All: `${bot.name} overview — mirrors /info about stats.`,
	Users: "Players and getUserData inventories.",
	Nations: `${bot.collectible.plural.charAt(0).toUpperCase()}${bot.collectible.plural.slice(1)} catches and ${bot.vars.globalCatalog} catalog.`,
	Servers: "Guild spawnConfig and server activity.",
	Activity: "Bot runtime and ForgeScript logs.",
};

const growthChartTitles: Record<DashboardFilter, string> = {
	All: "Catch Growth",
	Users: "New Players",
	Nations: "Catch Growth",
	Servers: "Spawn Activity",
	Activity: "Catch Growth",
};

const topNations = placeholderCatalog.map((entry) => ({
	id: entry.id,
	name: entry.name,
	class: entry.class,
	globalCaught: entry.globalCaught,
}));

const levelColors: Record<string, string> = {
	info: "text-blue-400 bg-blue-400/10",
	warn: "text-yellow-400 bg-yellow-400/10",
	error: "text-red-400 bg-red-400/10",
};

export default function Dashboard({
	logSearchQuery = "",
}: {
	logSearchQuery?: string;
}) {
	const [selectedFilter, setSelectedFilter] = useState<DashboardFilter>("All");
	const [timeRange, setTimeRange] = useState("Annually");
	const [logFilter, setLogFilter] = useState<"all" | "info" | "warn" | "error">(
		"all",
	);
	const reducedMotion = useReducedMotion();
	const enable3D = useIs3DEnabled();

	useEffect(() => {
		if (logSearchQuery) {
			setSelectedFilter("All");
			setLogFilter("all");
		}
	}, [logSearchQuery]);

	const visibleStats =
		selectedFilter === "All"
			? stats
			: selectedFilter === "Activity"
				? []
				: stats.filter((stat) => stat.category === selectedFilter);

	const showNationsChart =
		selectedFilter === "All" || selectedFilter === "Nations";
	const showGrowthChart =
		selectedFilter === "All" ||
		selectedFilter === "Users" ||
		selectedFilter === "Nations" ||
		selectedFilter === "Servers";
	const showStats = visibleStats.length > 0;
	const showCharts = showNationsChart || showGrowthChart;
	const showLogs =
		selectedFilter === "All" ||
		selectedFilter === "Activity" ||
		selectedFilter === "Users" ||
		selectedFilter === "Nations" ||
		selectedFilter === "Servers";

	const logsForFilter: typeof placeholderLogs =
		selectedFilter === "All" || selectedFilter === "Activity"
			? [...placeholderLogs]
			: placeholderLogs.filter(
					(log) => log.topic === (selectedFilter as LogTopic),
				);

	const filteredLogs = useMemo(() => {
		const byLevel =
			logFilter === "all"
				? logsForFilter
				: logsForFilter.filter((log) => log.level === logFilter);
		if (!logSearchQuery.trim()) return byLevel;
		const q = logSearchQuery.toLowerCase();
		return byLevel.filter(
			(log) =>
				log.message.toLowerCase().includes(q) ||
				log.topic.toLowerCase().includes(q) ||
				log.level.toLowerCase().includes(q),
		);
	}, [logsForFilter, logFilter, logSearchQuery]);

	const growthChartSpan = showNationsChart ? "" : "lg:col-span-3";

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
						<button
							type="button"
							key={filter}
							onClick={() => setSelectedFilter(filter)}
							className={`relative min-h-9 cursor-pointer select-none rounded-full px-4 py-2 text-sm font-medium transition-colors touch-manipulation ${
								selectedFilter === filter
									? "text-[var(--admin-accent-fg)]"
									: "bg-[var(--admin-card)] text-[var(--admin-muted)] hover:bg-[var(--admin-elevated)] hover:text-[var(--admin-fg)] active:bg-[color-mix(in_srgb,var(--admin-fg)_8%,var(--admin-card))]"
							}`}
						>
							{selectedFilter === filter && (
								<motion.span
									layoutId="dashboard-filter-pill"
									className="pointer-events-none absolute inset-0 rounded-full bg-[var(--admin-accent)]"
									transition={springSnappy}
								/>
							)}
							<span className="pointer-events-none relative z-10">
								{filter}
							</span>
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
								? "grid-cols-1 max-w-sm"
								: visibleStats.length === 2
									? "grid-cols-1 sm:grid-cols-2"
									: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
						}`}
					>
						{visibleStats.map((stat) => {
							const Icon = stat.icon;
							return (
								<motion.div
									key={stat.id}
									variants={listItem}
									className="h-full"
								>
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
												key={stat.value}
												initial={reducedMotion ? false : { opacity: 0, y: 6 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: 0.2 }}
												className="text-xl sm:text-2xl font-bold text-[var(--admin-fg)] mb-1 tabular-nums"
											>
												{stat.value}
											</motion.p>
											{stat.change && (
												<p className="text-xs text-[var(--admin-muted)] font-mono">
													{stat.change}
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

			{showCharts && (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 items-start">
					{showNationsChart && (
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
													<SelectItem
														key={rarity}
														value={rarity}
														className="capitalize"
													>
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
												<th className="text-left text-xs text-[var(--admin-muted)] pb-2 pr-4">
													ID
												</th>
												<th className="text-left text-xs text-[var(--admin-muted)] pb-2 pr-4 capitalize">
													{bot.collectible.singular}
												</th>
												<th className="text-left text-xs text-[var(--admin-muted)] pb-2 pr-4">
													Class
												</th>
												<th className="text-right text-xs text-[var(--admin-muted)] pb-2">
													global_caught
												</th>
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
														className="border-t border-[var(--admin-border)]"
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
					)}

					{showGrowthChart && (
						<Card
							className={`${growthChartSpan} bg-[var(--admin-card)] border-[var(--admin-border)] hover:border-[var(--admin-border)] transition-colors h-full`}
						>
							<CardContent className="p-4 sm:p-5">
								<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
									<h3 className="text-sm font-medium text-[var(--admin-muted)]">
										{growthChartTitles[selectedFilter]}
									</h3>

									<div className="relative z-20 flex w-full rounded bg-[var(--admin-elevated)] p-0.5 sm:w-auto">
										<button
											type="button"
											onClick={() => setTimeRange("Month")}
											className={`relative min-h-8 flex-1 cursor-pointer select-none rounded px-3 py-1.5 text-xs touch-manipulation sm:flex-none ${
												timeRange === "Month"
													? "text-[var(--admin-accent-fg)]"
													: "text-[var(--admin-muted)] hover:text-[var(--admin-fg)]"
											}`}
										>
											{timeRange === "Month" && (
												<motion.span
													layoutId="time-range-pill"
													className="pointer-events-none absolute inset-0 rounded bg-[var(--admin-accent)]"
													transition={springSnappy}
												/>
											)}
											<span className="pointer-events-none relative z-10">
												Month
											</span>
										</button>

										<button
											type="button"
											onClick={() => setTimeRange("Annually")}
											className={`relative min-h-8 flex-1 cursor-pointer select-none rounded px-3 py-1.5 text-xs touch-manipulation sm:flex-none ${
												timeRange === "Annually"
													? "text-[var(--admin-accent-fg)]"
													: "text-[var(--admin-muted)] hover:text-[var(--admin-fg)]"
											}`}
										>
											{timeRange === "Annually" && (
												<motion.span
													layoutId="time-range-pill"
													className="pointer-events-none absolute inset-0 rounded bg-[var(--admin-accent)]"
													transition={springSnappy}
												/>
											)}
											<span className="pointer-events-none relative z-10">
												Annually
											</span>
										</button>
									</div>
								</div>

								{/* CHART */}
								<div className="space-y-3 sm:space-y-4">
									{["Jun", "Jul", "Aug"].map((month, idx) => {
										const height = [15, 20, 25][idx];
										const isAug = month === "Aug";

										return (
											<div
												key={month}
												className="flex items-end gap-2 sm:gap-3"
											>
												<div className="w-8 sm:w-10 text-xs text-[var(--admin-muted)] shrink-0">
													{month}
												</div>

												<div
													className="flex-1 relative preserve-3d"
													style={{ perspective: 600 }}
												>
													<motion.div
														key={`${month}-${timeRange}-${selectedFilter}`}
														initial={
															reducedMotion
																? { height: 0, opacity: 0 }
																: enable3D
																	? { height: 0, opacity: 0, rotateX: 88 }
																	: { height: 0, opacity: 0 }
														}
														animate={{
															height: `${height * 3}px`,
															opacity: 1,
															rotateX: 0,
														}}
														transition={{
															delay: 0.55 + idx * 0.1,
															...springSnappy,
														}}
														style={{
															transformOrigin: "bottom",
															...(enable3D
																? { transformPerspective: perspectiveDefault }
																: {}),
														}}
														className={`preserve-3d gpu-layer relative rounded-t ${
															isAug ? "bg-purple-400" : "bg-gray-700"
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
                      bg-yellow-500 text-[var(--admin-accent-fg)]
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

												<div className="w-6 sm:w-8 text-[10px] text-[var(--admin-muted)] text-right shrink-0">
													{height}%
												</div>
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{showLogs && (
				<Card className="bg-[var(--admin-card)] border-[var(--admin-border)] hover:border-[var(--admin-border)] transition-colors">
					<CardContent className="p-4 sm:p-5 space-y-4">
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<FileText className="w-4 h-4 text-[var(--admin-muted)]" />
								<h3 className="text-sm font-medium text-[var(--admin-muted)]">
									{selectedFilter === "Activity" || selectedFilter === "All"
										? "Activity Log"
										: `${selectedFilter} Log`}
								</h3>
							</div>
							<div className="relative z-20 flex flex-wrap gap-2">
								{(["all", "info", "warn", "error"] as const).map((level) => (
									<button
										type="button"
										key={level}
										onClick={() => setLogFilter(level)}
										className={`relative min-h-9 cursor-pointer select-none rounded-md px-3 py-2 text-xs font-medium capitalize touch-manipulation transition-colors ${
											logFilter === level
												? "text-[var(--admin-accent-fg)]"
												: "bg-[var(--admin-elevated)] text-[var(--admin-muted)] hover:opacity-90 hover:text-[var(--admin-fg)] active:bg-[color-mix(in_srgb,var(--admin-fg)_10%,var(--admin-elevated))]"
										}`}
									>
										{logFilter === level && (
											<motion.span
												layoutId="log-level-pill"
												className="pointer-events-none absolute inset-0 rounded-md bg-[var(--admin-accent)]"
												transition={springSnappy}
											/>
										)}
										<span className="pointer-events-none relative z-10">
											{level}
										</span>
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
												"flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
												admin.hoverRow,
											)}
										>
											<span
												className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${levelColors[log.level] ?? ""}`}
											>
												{log.level}
											</span>
											<div className="flex-1 min-w-0">
												<p className="text-sm text-[var(--admin-fg)] truncate">
													{log.message}
												</p>
												<p className="text-[10px] text-[var(--admin-muted)] mt-0.5">
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
										className="text-sm text-[var(--admin-muted)] py-6 text-center"
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
