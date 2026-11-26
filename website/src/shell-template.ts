export default `<div class="h-full overflow-hidden transition-colors duration-300 bg-[var(--admin-shell-bg,var(--admin-shell))]">
<aside data-sidebar-desktop="true" class="fixed left-3 top-3 bottom-3 z-30 hidden w-64 flex-col rounded-2xl overflow-hidden md:flex md:left-4 md:top-4 md:bottom-4 bg-[var(--admin-sidebar)] border-[var(--admin-border)]">
<div class="flex h-full min-h-0 flex-col justify-between flex flex-col justify-between">
<div class="flex h-full flex-col justify-between">
<div class="flex flex-1 flex-col gap-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&amp;::-webkit-scrollbar]:hidden px-4 pb-4 pt-5 md:pt-6">
<div role="img" aria-label="Nationdex logo" class="preserve-3d flex items-center gap-3 rounded-lg px-2 py-1.5">
<img src="/logo.png" alt="Nationdex" width="36" height="36" class="h-9 w-9 shrink-0 object-contain">
<div class="min-w-0">
<span class="block truncate text-base font-semibold text-[var(--admin-fg)]">Nationdex</span>
<span class="block truncate text-[10px] text-[var(--admin-muted)]">Admin panel</span>
</div>
</div>
<nav class="flex flex-col gap-5">
<div class="flex flex-col gap-1">
<div class="cursor-pointer">
<a href="#" class="preserve-3d relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-[var(--admin-accent-fg)]">
<span class="absolute inset-0 rounded-lg bg-[var(--admin-accent)]">
</span>
<span class="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center text-[var(--admin-accent-fg)]">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-5 w-5">
<rect width="7" height="9" x="3" y="3" rx="1">
</rect>
<rect width="7" height="5" x="14" y="3" rx="1">
</rect>
<rect width="7" height="9" x="14" y="12" rx="1">
</rect>
<rect width="7" height="5" x="3" y="16" rx="1">
</rect>
</svg>
</span>
<span class="relative z-10 truncate">Dashboard</span>
</a>
</div>
</div>
<div class="flex flex-col gap-1">
<p class="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-muted)]">nations</p>
<div class="flex flex-col gap-1">
<div class="cursor-pointer">
<a href="#" class="preserve-3d relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-[var(--admin-muted)] hover:text-[var(--admin-fg)]">
<span class="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center text-[var(--admin-muted)]">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-5 w-5">
<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2">
</path>
<path d="M16 3.128a4 4 0 0 1 0 7.744">
</path>
<path d="M22 21v-2a4 4 0 0 0-3-3.87">
</path>
<circle cx="9" cy="7" r="4">
</circle>
</svg>
</span>
<span class="relative z-10 truncate">Users</span>
</a>
</div>
<div class="cursor-pointer">
<a href="#" class="preserve-3d relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-[var(--admin-muted)] hover:text-[var(--admin-fg)]">
<span class="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center text-[var(--admin-muted)]">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-5 w-5">
<circle cx="12" cy="12" r="10">
</circle>
<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20">
</path>
<path d="M2 12h20">
</path>
</svg>
</span>
<span class="relative z-10 truncate">Nations</span>
</a>
</div>
<div class="cursor-pointer">
<a href="#" class="preserve-3d relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-[var(--admin-muted)] hover:text-[var(--admin-fg)]">
<span class="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center text-[var(--admin-muted)]">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-5 w-5">
<ellipse cx="12" cy="5" rx="9" ry="3">
</ellipse>
<path d="M3 5V19A9 3 0 0 0 21 19V5">
</path>
<path d="M3 12A9 3 0 0 0 21 12">
</path>
</svg>
</span>
<span class="relative z-10 truncate">Nation Instances</span>
</a>
</div>
<div class="cursor-pointer">
<a href="#" class="preserve-3d relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-[var(--admin-muted)] hover:text-[var(--admin-fg)]">
<span class="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center text-[var(--admin-muted)]">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-5 w-5">
<rect width="20" height="8" x="2" y="2" rx="2" ry="2">
</rect>
<rect width="20" height="8" x="2" y="14" rx="2" ry="2">
</rect>
<line x1="6" x2="6.01" y1="6" y2="6">
</line>
<line x1="6" x2="6.01" y1="18" y2="18">
</line>
</svg>
</span>
<span class="relative z-10 truncate">Guild Configs</span>
</a>
</div>
<div class="cursor-pointer">
<a href="#" class="preserve-3d relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-[var(--admin-muted)] hover:text-[var(--admin-fg)]">
<span class="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center text-[var(--admin-muted)]">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-5 w-5">
<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z">
</path>
<path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12">
</path>
<path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17">
</path>
</svg>
</span>
<span class="relative z-10 truncate">Cards</span>
</a>
</div>
<div class="cursor-pointer">
<a href="#" class="preserve-3d relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-[var(--admin-muted)] hover:text-[var(--admin-fg)]">
<span class="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center text-[var(--admin-muted)]">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-5 w-5">
<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915">
</path>
<circle cx="12" cy="12" r="3">
</circle>
</svg>
</span>
<span class="relative z-10 truncate">Settings</span>
</a>
</div>
</div>
</div>
<div class="flex flex-col gap-1">
<p class="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-muted)]">Panel</p>
<div class="flex flex-col gap-1">
<div class="cursor-pointer">
<a href="#" class="preserve-3d relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-[var(--admin-muted)] hover:text-[var(--admin-fg)]">
<span class="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center text-[var(--admin-muted)]">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-5 w-5">
<path d="m16 11 2 2 4-4">
</path>
<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2">
</path>
<circle cx="9" cy="7" r="4">
</circle>
</svg>
</span>
<span class="relative z-10 truncate">Users</span>
</a>
</div>
<div class="cursor-pointer">
<a href="#" class="preserve-3d relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-[var(--admin-muted)] hover:text-[var(--admin-fg)]">
<span class="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center text-[var(--admin-muted)]">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-5 w-5">
<path d="M10 8h4">
</path>
<path d="M12 21v-9">
</path>
<path d="M12 8V3">
</path>
<path d="M17 16h4">
</path>
<path d="M19 12V3">
</path>
<path d="M19 21v-5">
</path>
<path d="M3 14h4">
</path>
<path d="M5 10V3">
</path>
<path d="M5 21v-7">
</path>
</svg>
</span>
<span class="relative z-10 truncate">Settings</span>
</a>
</div>
</div>
</div>
</nav>
</div>
<div class="p-3 shrink-0">
<div class="p-2.5 rounded-xl bg-[var(--admin-card)] flex items-center justify-between gap-2">
<div class="min-w-0">
<p class="text-xs font-semibold text-[var(--admin-fg)] truncate">Owner</p>
<div class="flex items-center gap-1">
<span class="text-[10px] font-bold text-amber-400">Owner</span>
</div>
</div>
<button type="button" aria-label="Sign out" title="Sign out" class="p-1.5 rounded-lg text-[var(--admin-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-4 w-4">
<path d="m16 17 5-5-5-5">
</path>
<path d="M21 12H9">
</path>
<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4">
</path>
</svg>
</button>
</div>
</div>
</div>
</div>
</aside>
<div class="md:hidden">
</div>
<div class="h-full transition-[margin] duration-200 md:ml-[calc(var(--sidebar-width)+1rem)]">
<div class="h-full p-3 md:p-4 perspective-scene">
<main class="preserve-3d gpu-layer flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-[var(--admin-panel)] border-[var(--admin-border)]">
<header class="shrink-0 z-40 border-b backdrop-blur-sm border-[var(--admin-border)] bg-[color-mix(in_srgb,var(--admin-panel)_95%,transparent)]">
<div class="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
<div class="min-w-0">
<div class="flex items-center gap-2.5">
<h1 class="truncate text-base font-semibold sm:text-lg text-[var(--admin-fg)]">Dashboard</h1>
</div>
</div>
<div class="flex shrink-0 items-center gap-2">
<button type="button" aria-label="Search admin panel" aria-expanded="false" aria-haspopup="dialog" class="rounded-lg p-2 text-[var(--admin-muted)] transition-colors hover:bg-[var(--admin-accent)]/10 hover:text-[var(--admin-fg)]">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-5 w-5">
<path d="m21 21-4.34-4.34">
</path>
<circle cx="11" cy="11" r="8">
</circle>
</svg>
</button>
<button type="button" aria-label="Open menu" class="rounded-lg p-2 md:hidden transition-colors text-[var(--admin-muted)] hover:bg-[color-mix(in_srgb,var(--admin-fg)_5%,transparent)]">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-5 w-5">
<path d="M4 5h16">
</path>
<path d="M4 12h16">
</path>
<path d="M4 19h16">
</path>
</svg>
</button>
</div>
</div>
</header>
<div data-admin-scroll="true" class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
</div>
</main>
</div>
</div>
</div>`;
