import { AnimatePresence, type HTMLMotionProps, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import {
	SIDEBAR_WIDTH,
	SidebarProvider,
	useSidebar,
} from "@/components/ui/sidebar-context";
import { useIs3DEnabled, useReducedMotion } from "@/hooks/useReducedMotion";
import { admin } from "@/lib/admin-classes";
import { springSnappy } from "@/lib/motion";
import { cn } from "@/lib/utils";

export { SIDEBAR_WIDTH } from "@/components/ui/sidebar-context";

interface Links {
	label: string;
	href: string;
	icon: ReactNode;
	active?: boolean;
}

export function Sidebar({
	children,
	open,
	setOpen,
}: {
	children: ReactNode;
	open?: boolean;
	setOpen?: (value: boolean | ((prev: boolean) => boolean)) => void;
}) {
	return (
		<SidebarProvider open={open} setOpen={setOpen}>
			{children}
		</SidebarProvider>
	);
}

interface SidebarBodyProps {
	className?: string;
	children?: ReactNode;
}

export function SidebarBody(props: SidebarBodyProps) {
	return (
		<>
			<DesktopSidebar {...props} />
			<MobileSidebar {...props} />
		</>
	);
}

export function DesktopSidebar({
	className,
	children,
	...props
}: SidebarBodyProps) {
	return (
		<aside
			className={cn(
				"fixed left-3 top-3 bottom-3 z-30 hidden w-64 flex-col rounded-2xl border shadow-2xl overflow-hidden",
				"md:left-4 md:top-4 md:bottom-4",
				admin.sidebar,
				className,
			)}
			style={{ width: SIDEBAR_WIDTH }}
			{...props}
		>
			{children}
		</aside>
	);
}

export function MobileSidebar({
	className,
	children,
	...props
}: SidebarBodyProps) {
	const { open, setOpen } = useSidebar();

	return (
		<div className="md:hidden" {...props}>
			<AnimatePresence>
				{open && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 z-[99] bg-black/70 backdrop-blur-sm"
							onClick={() => setOpen(false)}
						/>
						<motion.aside
							initial={{ x: "-100%" }}
							animate={{ x: 0 }}
							exit={{ x: "-100%" }}
							transition={{ type: "spring", stiffness: 320, damping: 32 }}
							className={cn(
								"fixed inset-y-0 left-0 z-[100] flex w-64 flex-col border-r shadow-2xl",
								admin.sidebar,
								className,
							)}
							style={{ width: SIDEBAR_WIDTH }}
						>
							<div className="flex items-center justify-end p-4 pb-0">
								<button
									type="button"
									onClick={() => setOpen(false)}
									className={cn(
										"rounded-lg p-1.5 transition-colors",
										admin.muted,
										admin.hoverRow,
									)}
									aria-label="Close menu"
								>
									<X size={20} />
								</button>
							</div>
							{children}
						</motion.aside>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}

type SidebarLinkProps = {
	link: Links;
	active?: boolean;
} & Omit<HTMLMotionProps<"a">, "href" | "children">;

export function SidebarLink({
	link,
	className,
	active = false,
	...props
}: SidebarLinkProps) {
	const reducedMotion = useReducedMotion();
	const enable3D = useIs3DEnabled();

	return (
		<motion.a
			href={link.href}
			whileHover={
				reducedMotion
					? undefined
					: active
						? { scale: 1.01 }
						: enable3D
							? { x: 3, rotateY: 8, z: 6 }
							: { x: 3 }
			}
			whileTap={reducedMotion ? undefined : { scale: 0.98 }}
			transition={springSnappy}
			style={enable3D ? { transformPerspective: 900 } : undefined}
			className={cn(
				"preserve-3d relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
				active
					? "text-[var(--admin-accent-fg)]"
					: cn(admin.muted, "hover:text-[var(--admin-fg)]"),
				className,
			)}
			{...props}
		>
			{active && (
				<motion.span
					layoutId="sidebar-active-pill"
					className="absolute inset-0 rounded-lg bg-[var(--admin-accent)] shadow-sm"
					transition={springSnappy}
				/>
			)}
			<span
				className={cn(
					"relative z-10 flex h-5 w-5 shrink-0 items-center justify-center",
					active ? "text-[var(--admin-accent-fg)]" : admin.muted,
				)}
			>
				{link.icon}
			</span>
			<span className="relative z-10 truncate">{link.label}</span>
		</motion.a>
	);
}
