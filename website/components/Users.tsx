import { AnimatePresence, motion } from "framer-motion";
import { Search, Users as UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { admin } from "@/lib/admin-classes";
import { bot, collectibleLabel, placeholderUsers } from "@/lib/bot";
import { listItem, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

export default function UsersPage({
	searchQuery = "",
}: {
	searchQuery?: string;
}) {
	const [localQuery, setLocalQuery] = useState(searchQuery);

	useEffect(() => {
		setLocalQuery(searchQuery);
	}, [searchQuery]);

	const filteredUsers = placeholderUsers.filter(
		(user) =>
			user.username.toLowerCase().includes(localQuery.toLowerCase()) ||
			user.discordId.includes(localQuery),
	);

	return (
		<div className="w-full space-y-4 sm:space-y-6">
			<div className="mb-4 sm:mb-6 space-y-3">
				<div>
					<h1
						className={cn(
							"mb-2 text-xl font-bold sm:text-2xl md:text-3xl",
							admin.fg,
						)}
					>
						Users
					</h1>
					<p className={cn("text-sm", admin.muted)}>
						Browse player inventories from{" "}
						<code className="opacity-80">
							getUserVar[{bot.vars.userInventory}]
						</code>{" "}
						— total, unique, rarity counts, and privacy settings.
					</p>
				</div>
			</div>

			<Card className={cn(admin.card)}>
				<CardContent className="space-y-4 p-5">
					<div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
						<div className="flex items-center gap-2">
							<UsersIcon className={cn("h-4 w-4", admin.muted)} />
							<h3 className={cn("text-sm font-medium", admin.muted)}>
								Player inventories
							</h3>
						</div>
						<div className="relative w-full sm:w-64">
							<Search
								className={cn(
									"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
									admin.muted,
								)}
							/>
							<Input
								value={localQuery}
								onChange={(e) => setLocalQuery(e.target.value)}
								className={cn("pl-9", admin.input)}
								placeholder="Search by username or Discord ID..."
							/>
						</div>
					</div>

					<div className="-mx-5 overflow-x-auto px-5">
						<table className="w-full min-w-[640px]">
							<thead>
								<tr className="border-b border-[var(--admin-border)]">
									<th
										className={cn("pb-3 pr-4 text-left text-xs", admin.muted)}
									>
										Username
									</th>
									<th
										className={cn("pb-3 pr-4 text-left text-xs", admin.muted)}
									>
										Discord ID
									</th>
									<th
										className={cn("pb-3 pr-4 text-left text-xs", admin.muted)}
									>
										Total
									</th>
									<th
										className={cn("pb-3 pr-4 text-left text-xs", admin.muted)}
									>
										Unique
									</th>
									<th
										className={cn("pb-3 pr-4 text-left text-xs", admin.muted)}
									>
										Value
									</th>
									<th
										className={cn("pb-3 pr-4 text-left text-xs", admin.muted)}
									>
										Privacy
									</th>
									<th
										className={cn("pb-3 pr-4 text-left text-xs", admin.muted)}
									>
										Gifts
									</th>
									<th className={cn("pb-3 text-right text-xs", admin.muted)}>
										Actions
									</th>
								</tr>
							</thead>
							<motion.tbody
								variants={staggerContainer}
								initial="hidden"
								animate="show"
								key={localQuery}
							>
								<AnimatePresence initial={false}>
									{filteredUsers.map((user) => (
										<motion.tr
											key={user.discordId}
											variants={listItem}
											initial="hidden"
											animate="show"
											exit="exit"
											className={cn(
												"border-b border-[var(--admin-border)] last:border-0 transition-colors",
												admin.hoverRow,
											)}
										>
											<td className={cn("py-3 pr-4 text-sm", admin.fg)}>
												{user.username}
											</td>
											<td
												className={cn(
													"py-3 pr-4 font-mono text-xs",
													admin.muted,
												)}
											>
												{user.discordId}
											</td>
											<td className={cn("py-3 pr-4 text-sm", admin.fg)}>
												{user.total} {collectibleLabel(user.total)}
											</td>
											<td className={cn("py-3 pr-4 text-sm", admin.fg)}>
												{user.unique}
											</td>
											<td className={cn("py-3 pr-4 text-sm", admin.fg)}>
												{user.totalValue}
											</td>
											<td
												className={cn(
													"py-3 pr-4 text-sm capitalize",
													admin.muted,
												)}
											>
												{user.inventoryPrivacy}
											</td>
											<td className={cn("py-3 pr-4 text-sm", admin.muted)}>
												{user.acceptGifts ? "Yes" : "No"}
											</td>
											<td className="py-3 text-right">
												<Button
													variant="ghost"
													size="sm"
													className={cn(
														admin.muted,
														"hover:text-[var(--admin-fg)]",
													)}
												>
													View
												</Button>
											</td>
										</motion.tr>
									))}
								</AnimatePresence>
							</motion.tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
