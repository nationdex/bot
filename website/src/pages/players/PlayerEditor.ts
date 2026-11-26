import '@/components/ui/PanelChoices';
import '@/components/ui/PanelPagination';
import './PlayerBalance';
import { PanelConfirm } from '@/components/feedback/PanelConfirm';
import { PanelUnsavedChanges } from '@/components/feedback/PanelUnsavedChanges';
import { createEditorView, html, icon, disabled } from './editor-view';
import { admin } from '@/lib/admin-classes';
import {
  fetchCollectibles,
  fetchUserDetail,
  getCache,
  giveUserNation,
  removeUserNation,
  resetUserSettings,
  updateUserBalance,
  updateUserAuction,
  updateUserSettings,
  type CollectibleEntry,
  type UserCatchItem,
  type UserDetailData,
} from '@/lib/api';
import { rarityBadgeClass, type RarityClass } from '@/lib/bot';
import { cn } from '@/lib/utils';

const inputClass =
  'flex w-full rounded-md border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 px-3 py-2 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50';
const buttonClass =
  'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50';
const accentButtonClass =
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50';

function attachPlayerEditor(host: HTMLElement, userId: string, onBack: () => void) {
  const { bind, listen, mount, dialogs, dispose } = createEditorView(host);
  const reset = new PanelConfirm();
  const remove = new PanelConfirm();
  const unsaved = new PanelUnsavedChanges();
  document.body.append(reset, remove, unsaved);
  let connected = true;
  let scheduled = false;
  function schedule() {
    if (scheduled || !connected) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      if (connected) render();
    });
  }

  let user: UserDetailData | null = null;
  const setUser = (next: typeof user | ((previous: typeof user) => typeof user)) => {
    user = typeof next === 'function' ? next(user) : next;
    schedule();
  };
  let loading = true;
  const setLoading = (next: typeof loading) => {
    loading = next;
    schedule();
  };
  let catalog: CollectibleEntry[] = [];
  const setCatalog = (next: typeof catalog) => {
    catalog = next;
    schedule();
  };
  let copied = false;
  const setCopied = (next: typeof copied) => {
    copied = next;
    schedule();
  };
  let feedback: { type: 'success' | 'error'; message: string } | null = null;
  const setFeedback = (next: typeof feedback | ((previous: typeof feedback) => typeof feedback)) => {
    feedback = typeof next === 'function' ? next(feedback) : next;
    schedule();
  };

  let showResetModal = false;
  const setShowResetModal = (next: typeof showResetModal) => {
    showResetModal = next;
    schedule();
  };
  let isResetting = false;
  const setIsResetting = (next: typeof isResetting) => {
    isResetting = next;
    schedule();
  };
  let pendingSettings: {
    inventory_privacy?: string;
    profile_privacy?: string;
    accept_gifts?: boolean;
  } | null = null;
  const setPendingSettings = (
    next: typeof pendingSettings | ((previous: typeof pendingSettings) => typeof pendingSettings),
  ) => {
    pendingSettings = typeof next === 'function' ? next(pendingSettings) : next;
    schedule();
  };
  let isSavingSettings = false;
  const setIsSavingSettings = (next: typeof isSavingSettings) => {
    isSavingSettings = next;
    schedule();
  };
  let saveSettingsSuccess = false;
  const setSaveSettingsSuccess = (next: typeof saveSettingsSuccess) => {
    saveSettingsSuccess = next;
    schedule();
  };

  let catchFilter = '';
  const setCatchFilter = (next: typeof catchFilter) => {
    currentPage = 1;
    catchFilter = next;
    schedule();
  };
  let currentPage = 1;
  const setCurrentPage = (next: typeof currentPage) => {
    currentPage = next;
    schedule();
  };
  let pageSize = 10;
  const setPageSize = (next: typeof pageSize) => {
    pageSize = next;
    schedule();
  };
  let catchToRemove: UserCatchItem | null = null;
  const setCatchToRemove = (next: typeof catchToRemove) => {
    catchToRemove = next;
    schedule();
  };
  let isRemovingCatch = false;
  const setIsRemovingCatch = (next: typeof isRemovingCatch) => {
    isRemovingCatch = next;
    schedule();
  };

  let showGiveModal = false;
  const setShowGiveModal = (next: typeof showGiveModal) => {
    showGiveModal = next;
    schedule();
  };
  let giveNationId = '';
  const setGiveNationId = (next: typeof giveNationId) => {
    giveNationId = next;
    schedule();
  };
  let giveCount = 1;
  const setGiveCount = (next: typeof giveCount) => {
    giveCount = next;
    schedule();
  };
  let isGiving = false;
  const setIsGiving = (next: typeof isGiving) => {
    isGiving = next;
    schedule();
  };
  let giveSearchQuery = '';
  const setGiveSearchQuery = (next: typeof giveSearchQuery) => {
    giveSearchQuery = next;
    schedule();
  };

  let showAuctionModal = false;
  const setShowAuctionModal = (next: typeof showAuctionModal) => {
    showAuctionModal = next;
    schedule();
  };
  let auctionTotalInput = '';
  const setAuctionTotalInput = (next: typeof auctionTotalInput) => {
    auctionTotalInput = next;
    schedule();
  };
  let auctionSoldInput = '';
  const setAuctionSoldInput = (next: typeof auctionSoldInput) => {
    auctionSoldInput = next;
    schedule();
  };
  let auctionEarningsInput = '';
  const setAuctionEarningsInput = (next: typeof auctionEarningsInput) => {
    auctionEarningsInput = next;
    schedule();
  };
  let isUpdatingAuction = false;
  const setIsUpdatingAuction = (next: typeof isUpdatingAuction) => {
    isUpdatingAuction = next;
    schedule();
  };

  const filterId = 'player-catch-filter';

  const loadData = async () => {
    setLoading(true);
    try {
      const cachedCatalog = getCache<CollectibleEntry[]>('collectibles_catalog');
      const [userData, catalogData] = await Promise.all([
        fetchUserDetail(userId),
        cachedCatalog && cachedCatalog.length > 0 ? Promise.resolve(cachedCatalog) : fetchCollectibles(),
      ]);
      setUser(userData);
      if (Array.isArray(catalogData)) {
        setCatalog(catalogData);
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const handleCopyId = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.discordId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBalanceSubmit = async (mode: 'set' | 'add' | 'remove', amount: number) => {
    try {
      const result = await updateUserBalance(userId, mode, amount);
      if (!result.ok) {
        showToast('error', result.error || 'Failed to update balance.');
        return false;
      }
      showToast('success', `Balance successfully updated (${mode} ${amount.toLocaleString()}).`);
      setUser((previous) => {
        if (!previous) return previous;
        const balance =
          mode === 'set'
            ? amount
            : mode === 'add'
              ? Math.min(999999999999, previous.balance + amount)
              : Math.max(0, previous.balance - amount);
        return { ...previous, balance };
      });
      return true;
    } catch {
      showToast('error', 'Failed to update balance.');
      return false;
    }
  };

  const handleAuctionSubmit = async (e: Event) => {
    e.preventDefault();
    const total = Math.max(0, Math.min(999999999999, Math.floor(Number(auctionTotalInput) || 0)));
    const sold = Math.max(0, Math.min(999999999999, Math.floor(Number(auctionSoldInput) || 0)));
    const earnings = Math.max(0, Math.min(999999999999, Math.floor(Number(auctionEarningsInput) || 0)));

    setIsUpdatingAuction(true);
    const res = await updateUserAuction(userId, { total, sold, earnings });
    setIsUpdatingAuction(false);

    if (res.ok) {
      showToast('success', 'Auction stats updated.');
      setShowAuctionModal(false);
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          auctionData: {
            ...prev.auctionData,
            total,
            sold,
            earnings,
          },
        };
      });
    } else {
      showToast('error', res.error || 'Failed to update auction stats.');
    }
  };

  const handleSettingSelect = (
    key: 'inventory_privacy' | 'profile_privacy' | 'accept_gifts',
    value: string | boolean,
  ) => {
    setPendingSettings((prev) => ({
      inventory_privacy: user?.settings.inventory_privacy || 'public',
      profile_privacy: user?.settings.profile_privacy || 'public',
      accept_gifts: user?.settings.accept_gifts ?? true,
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    if (!pendingSettings || !user) return;
    setIsSavingSettings(true);
    const entries: Array<['inventory_privacy' | 'profile_privacy' | 'accept_gifts', string | boolean]> = [];
    if (
      pendingSettings.inventory_privacy !== undefined &&
      pendingSettings.inventory_privacy !== user.settings.inventory_privacy
    ) {
      entries.push(['inventory_privacy', pendingSettings.inventory_privacy]);
    }
    if (
      pendingSettings.profile_privacy !== undefined &&
      pendingSettings.profile_privacy !== user.settings.profile_privacy
    ) {
      entries.push(['profile_privacy', pendingSettings.profile_privacy]);
    }
    if (pendingSettings.accept_gifts !== undefined && pendingSettings.accept_gifts !== user.settings.accept_gifts) {
      entries.push(['accept_gifts', pendingSettings.accept_gifts]);
    }

    let hasError = false;
    for (const [k, v] of entries) {
      const res = await updateUserSettings(userId, k, v);
      if (!res.ok) hasError = true;
    }
    setIsSavingSettings(false);

    if (!hasError) {
      setUser((prev) => (prev ? { ...prev, settings: { ...prev.settings, ...pendingSettings } } : prev));
      setPendingSettings(null);
      setSaveSettingsSuccess(true);
      setTimeout(() => setSaveSettingsSuccess(false), 2000);
      showToast('success', 'User settings updated.');
    } else {
      showToast('error', 'Failed to update some settings.');
    }
  };

  const handleResetSettings = async () => {
    setIsResetting(true);
    const res = await resetUserSettings(userId);
    setIsResetting(false);
    setShowResetModal(false);

    if (res.ok) {
      setPendingSettings(null);
      showToast('success', 'User settings have been reset to defaults.');
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          settings: {
            inventory_privacy: 'public',
            profile_privacy: 'public',
            accept_gifts: true,
          },
        };
      });
    } else {
      showToast('error', res.error || 'Failed to reset settings.');
    }
  };

  const handleGiveNationSubmit = async (e: Event) => {
    e.preventDefault();
    if (!giveNationId.trim()) {
      showToast('error', 'Please select or enter a nation ID.');
      return;
    }
    const count = Math.min(25, Math.max(1, Number(giveCount) || 1));

    setIsGiving(true);
    const res = await giveUserNation(userId, giveNationId.trim(), count);
    setIsGiving(false);

    if (res.ok) {
      showToast('success', `Granted ${count}x ${giveNationId} to user.`);
      setShowGiveModal(false);
      setGiveNationId('');
      setGiveSearchQuery('');
      setGiveCount(1);
      void loadData();
    } else {
      showToast('error', res.error || 'Failed to grant nation.');
    }
  };

  const handleRemoveCatchConfirm = async () => {
    const target = catchToRemove;
    if (!target) return;
    setIsRemovingCatch(true);
    const res = await removeUserNation(userId, target.catch);
    setIsRemovingCatch(false);

    if (res.ok) {
      showToast('success', `Catch #${target.catch} removed from inventory.`);
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          collectiblesData: prev.collectiblesData.filter((c) => c.catch !== target.catch),
        };
      });
      setCatchToRemove(null);
    } else {
      showToast('error', res.error || 'Failed to remove catch from inventory.');
    }
  };

  function template() {
    const player = user;
    const filteredCatches = (player?.collectiblesData || []).filter((item) => {
      const q = catchFilter.toLowerCase();
      return (
        item.catch.toLowerCase().includes(q) ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.id && item.id.toLowerCase().includes(q))
      );
    });

    currentPage = Math.min(currentPage, Math.max(1, Math.ceil(filteredCatches.length / pageSize)));
    const paginatedCatches = filteredCatches.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    if (loading) {
      return html`<div class="flex h-72 w-full items-center justify-center">
        ${icon('Loader2', 'h-6 w-6 animate-spin text-[var(--admin-muted)]')}
      </div>`;
    }
    if (!player) {
      return html`<div class="space-y-4 p-4 text-center">
        <p class="text-sm text-[var(--admin-muted)]">User #${userId} was not found.</p>
        <button
          class="${cn('inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50', 'border', 'h-9 rounded-md px-3', undefined)}"
          type="button"
          ${listen('click', onBack)}
        >
          ${icon('ArrowLeft', 'mr-2 h-4 w-4')} Back to Users
        </button>
      </div>`;
    }
    return html`<div data-key="editor" class="w-full space-y-6">
      <div data-key="toolbar" class="flex items-center justify-between gap-3">
        <button
          class="group inline-flex items-center gap-2 text-xs font-medium text-[var(--admin-muted)] hover:text-[var(--admin-fg)] transition-colors cursor-pointer"
          type="button"
          ${listen('click', onBack)}
        >
          ${icon('ArrowLeft', 'h-4 w-4 transition-transform group-hover:-translate-x-0.5')}
          <span>Back to Users</span>
        </button>

        <button
          class="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--admin-fg)] hover:opacity-85 transition-opacity cursor-pointer"
          type="button"
          ${listen('click', () => void loadData())}
        >
          ${icon('RotateCw', 'h-3.5 w-3.5 text-[var(--admin-muted)]')}
          <span>Refresh</span>
        </button>
      </div>

      ${
        feedback &&
        html`<div
          data-key="feedback"
          role="status"
          class="${cn(
            'flex items-center justify-between rounded-lg px-4 py-3 text-xs font-medium',
            feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400',
          )}"
        >
          <span>${feedback.message}</span>
          <button
            class="p-1 hover:opacity-75"
            type="button"
            ${listen('click', () => setFeedback(null))}
            aria-label="Dismiss message"
          >
            ${icon('X', 'h-3.5 w-3.5')}
          </button>
        </div>`
      }

      <div data-key="summary" class="rounded-xl bg-[var(--admin-card)] p-5 sm:p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="w-full min-w-0 space-y-1.5">
            <div class="flex w-full min-w-0 items-center justify-between gap-3">
              <div class="flex min-w-0 items-center gap-2">
                <h2 class="min-w-0 truncate text-xl font-semibold tracking-tight text-[var(--admin-fg)]">
                  ${player.global_name || player.username}
                </h2>

                ${
                  player.private &&
                  html`<span
                    class="shrink-0 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-400"
                    >Private Profile</span
                  >`
                }
              </div>

              <div class="flex shrink-0 items-center gap-1.5 sm:hidden">
                <span class="text-xs tabular-nums text-[var(--admin-muted)]">${player.discordId}</span>

                <button
                  class="cursor-pointer p-1 text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-fg)]"
                  type="button"
                  ${listen('click', handleCopyId)}
                  title="Copy Discord ID"
                >
                  ${copied ? html`${icon('Check', 'h-3.5 w-3.5 text-emerald-400')}` : html`${icon('Copy', 'h-3.5 w-3.5')}`}
                </button>
              </div>
            </div>

            ${
              player.global_name &&
              player.username &&
              player.username !== player.global_name &&
              html`<span class="hidden sm:block text-xs text-[var(--admin-muted)]">@${player.username}</span>`
            }

            <div class="hidden sm:flex items-center gap-2 text-xs text-[var(--admin-muted)]">
              <span class="tabular-nums">${player.discordId}</span>
              <button
                class="cursor-pointer p-0.5 text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-fg)]"
                type="button"
                ${listen('click', handleCopyId)}
                title="Copy Discord ID"
              >
                ${copied ? html`${icon('Check', 'h-3.5 w-3.5 text-emerald-400')}` : html`${icon('Copy', 'h-3.5 w-3.5')}`}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-x-6 gap-y-3 w-full max-w-[420px]">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-[var(--admin-muted)]">Foils</span>
              <span class="text-xs font-semibold text-[var(--admin-fg)]">${player.balance.toLocaleString()}</span>
            </div>

            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-[var(--admin-muted)]">Value</span>
              <span class="text-xs font-semibold text-[var(--admin-fg)]">${player.totalValue.toLocaleString()}</span>
            </div>

            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-[var(--admin-muted)]">Inventory</span>
              <span class="text-xs font-semibold text-[var(--admin-fg)] capitalize">
                ${player.settings.inventory_privacy}
              </span>
            </div>

            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-[var(--admin-muted)]">Profile</span>
              <span class="text-xs font-semibold text-[var(--admin-fg)] capitalize">
                ${player.settings.profile_privacy}
              </span>
            </div>

            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-[var(--admin-muted)]">Gifts</span>
              <span class="text-xs font-semibold text-[var(--admin-fg)]">
                ${player.settings.accept_gifts ? 'On' : 'Off'}
              </span>
            </div>

            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-[var(--admin-muted)]">Auctions</span>
              <span class="text-xs font-semibold text-[var(--admin-fg)]">
                ${player.auctionData.sold}/${player.auctionData.total} Sold</span
              >
            </div>
          </div>
        </div>
      </div>

      <div data-key="account" class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <pnd-player-balance
          ${bind('state', { balance: player.balance, apply: handleBalanceSubmit })}
        ></pnd-player-balance>

        <div class="rounded-lg overflow-hidden">
          <div class="flex flex-col space-y-1.5 p-6 pb-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                ${icon('Shield', 'h-4 w-4 text-[var(--admin-muted)]')}
                <h3 class="font-semibold tracking-tight text-sm font-semibold text-[var(--admin-fg)]">
                  Settings & Privacy
                </h3>
              </div>
              <button
                class="text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                type="button"
                ${listen('click', () => setShowResetModal(true))}
              >
                Reset to Defaults
              </button>
            </div>
          </div>
          <div class="p-6 pt-0 space-y-3">
            <div class="flex items-center justify-between rounded-lg bg-[var(--admin-elevated)] p-3">
              <div class="space-y-0.5">
                <span class="text-xs font-medium text-[var(--admin-fg)]">Inventory Privacy</span>
                <p class="text-[11px] text-[var(--admin-muted)]">Controls public visibility of nation collection</p>
              </div>
              <pnd-panel-choices
                ${bind('state', {
                  options: ['public', 'private'].map((id) => ({ id, label: id })),
                  active: String(pendingSettings?.inventory_privacy ?? player.settings.inventory_privacy),
                  select: (id: string) => handleSettingSelect('inventory_privacy', id as 'public' | 'private'),
                  appearance: 'player',
                })}
              ></pnd-panel-choices>
            </div>

            <div class="flex items-center justify-between rounded-lg bg-[var(--admin-elevated)] p-3">
              <div class="space-y-0.5">
                <span class="text-xs font-medium text-[var(--admin-fg)]">Profile Privacy</span>
                <p class="text-[11px] text-[var(--admin-muted)]">Controls visibility of player statistics</p>
              </div>
              <pnd-panel-choices
                ${bind('state', {
                  options: ['public', 'private'].map((id) => ({ id, label: id })),
                  active: String(pendingSettings?.profile_privacy ?? player.settings.profile_privacy),
                  select: (id: string) => handleSettingSelect('profile_privacy', id as 'public' | 'private'),
                  appearance: 'player',
                })}
              ></pnd-panel-choices>
            </div>

            <div class="flex items-center justify-between rounded-lg bg-[var(--admin-elevated)] p-3">
              <div class="space-y-0.5">
                <span class="text-xs font-medium text-[var(--admin-fg)]">Accept Gifts</span>
                <p class="text-[11px] text-[var(--admin-muted)]">Allow or block nation gifts from other players</p>
              </div>
              <pnd-panel-choices
                ${bind('state', {
                  options: [
                    { id: 'true', label: 'Allow' },
                    { id: 'false', label: 'Block' },
                  ],
                  active: String(pendingSettings?.accept_gifts ?? player.settings.accept_gifts),
                  select: (id: string) => handleSettingSelect('accept_gifts', id === 'true'),
                  appearance: 'player',
                })}
              ></pnd-panel-choices>
            </div>
          </div>
        </div>
      </div>

      <div data-key="auctions" class="rounded-lg overflow-hidden">
        <div class="flex flex-col space-y-1.5 p-5 pb-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              ${icon('Gavel', 'h-4 w-4 text-[var(--admin-muted)]')}
              <h3 class="font-semibold tracking-tight text-sm font-semibold text-[var(--admin-fg)]">
                Auction Activity
              </h3>
              <span
                class="rounded-full bg-[var(--admin-elevated)] px-2.5 py-0.5 text-xs font-medium tabular-nums text-[var(--admin-muted)]"
              >
                ${player.auctionData.onSale.length} on sale</span
              >
            </div>
            <button
              class="${cn(buttonClass, 'rounded-md', 'h-7 rounded-md border-0 bg-[var(--admin-elevated)] px-2.5 text-xs font-medium text-[var(--admin-fg)] hover:bg-[var(--admin-elevated)]/80 cursor-pointer shadow-none')}"
              type="button"
              ${listen('click', () => {
                setAuctionTotalInput(String(player.auctionData.total));
                setAuctionSoldInput(String(player.auctionData.sold));
                setAuctionEarningsInput(String(player.auctionData.earnings));
                setShowAuctionModal(true);
              })}
            >
              Adjust
            </button>
          </div>
        </div>
        <div class="p-5 pt-0 space-y-4">
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="rounded-lg bg-[var(--admin-elevated)] px-3 pt-2 pb-2.5">
              <span class="block text-[11px] font-medium leading-none text-[var(--admin-muted)]">Total Listed</span>
              <p class="mt-1.5 text-lg font-semibold tabular-nums leading-tight text-[var(--admin-fg)]">
                ${player.auctionData.total}
              </p>
            </div>
            <div class="rounded-lg bg-[var(--admin-elevated)] px-3 pt-2 pb-2.5">
              <span class="block text-[11px] font-medium leading-none text-[var(--admin-muted)]">Auctions Sold</span>
              <p class="mt-1.5 text-lg font-semibold tabular-nums leading-tight text-[var(--admin-fg)]">
                ${player.auctionData.sold}
              </p>
            </div>
            <div class="rounded-lg bg-[var(--admin-elevated)] px-3 pt-2 pb-2.5">
              <span class="block text-[11px] font-medium leading-none text-[var(--admin-muted)]">Auction Earnings</span>
              <p class="mt-1.5 text-lg font-semibold tabular-nums leading-tight text-[var(--admin-fg)]">
                ${player.auctionData.earnings.toLocaleString()}
              </p>
            </div>
            <div class="rounded-lg bg-[var(--admin-elevated)] px-3 pt-2 pb-2.5">
              <span class="block text-[11px] font-medium leading-none text-[var(--admin-muted)]">Active On Sale</span>
              <p class="mt-1.5 text-lg font-semibold tabular-nums leading-tight text-[var(--admin-fg)]">
                ${player.auctionData.onSale.length}
              </p>
            </div>
          </div>

          ${
            player.auctionData.activeAuctions.length > 0
              ? html`<div class="overflow-x-auto w-full pt-1">
                  <table class="w-full min-w-[560px]">
                    <thead>
                      <tr class="border-b border-[var(--admin-border)]">
                        <th class="pb-3 pl-3 pr-4 text-left text-xs font-medium text-[var(--admin-muted)]">
                          Auction ID
                        </th>
                        <th class="pb-3 px-4 text-left text-xs font-medium text-[var(--admin-muted)]">Nation / Item</th>
                        <th class="pb-3 px-4 text-left text-xs font-medium text-[var(--admin-muted)]">Starting Bid</th>
                        <th class="pb-3 px-4 text-left text-xs font-medium text-[var(--admin-muted)]">Buyout</th>
                        <th class="pb-3 px-4 text-left text-xs font-medium text-[var(--admin-muted)]">Current Bid</th>
                        <th class="pb-3 pr-3 text-right text-xs font-medium text-[var(--admin-muted)]">
                          Status / Ends
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${player.auctionData.activeAuctions.map((auc) => {
                        const catalogNation = catalog.find((c) => String(c.id) === String(auc.catalogId));
                        const nationName =
                          catalogNation?.name || (auc.catalogId ? `Nation #${auc.catalogId}` : `#${auc.nationCatchId}`);
                        const nationClass = catalogNation?.class || 'common';
                        return html`<tr
                          class="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-elevated)]/50 transition-colors"
                          data-key="${auc.id}"
                        >
                          <td class="py-3 pl-3 pr-4 text-xs font-semibold tabular-nums text-[var(--admin-fg)]">
                            <span class="rounded-full bg-[var(--admin-elevated)] px-2.5 py-0.5 text-xs"
                              >#${auc.id}
                            </span>
                          </td>
                          <td class="py-3 px-4 text-xs">
                            <div class="flex items-center gap-2">
                              <span class="font-medium text-[var(--admin-fg)]">${nationName}</span>
                              <span
                                class="${cn(
                                  'rounded px-2 py-0.5 text-[10px] font-medium capitalize',
                                  rarityBadgeClass[nationClass],
                                )}"
                              >
                                ${nationClass}
                              </span>
                              ${
                                auc.nationCatchId &&
                                html`<span class="text-[11px] text-[var(--admin-muted)]">#${auc.nationCatchId}</span>`
                              }
                            </div>
                          </td>
                          <td class="py-3 px-4 text-xs tabular-nums text-[var(--admin-fg)]">
                            ${auc.startPrice.toLocaleString()}
                          </td>
                          <td class="py-3 px-4 text-xs tabular-nums text-[var(--admin-fg)]">
                            ${auc.buyoutPrice.toLocaleString()}
                          </td>
                          <td class="py-3 px-4 text-xs tabular-nums text-[var(--admin-fg)]">
                            ${
                              auc.currentBid > 0
                                ? html`<span> ${auc.currentBid.toLocaleString()} (${auc.bidsCount} bids)</span>`
                                : html`<span class="text-[var(--admin-muted)]">No bids</span>`
                            }
                          </td>
                          <td class="py-3 pr-3 text-right text-xs">
                            <span
                              class="${cn(
                                'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                                auc.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-[var(--admin-elevated)] text-[var(--admin-muted)]',
                              )}"
                            >
                              ${auc.status === 'active' ? (auc.endsAt ? `Ends ${auc.endsAt}` : 'Active') : 'Ended'}
                            </span>
                          </td>
                        </tr>`;
                      })}
                    </tbody>
                  </table>
                </div>`
              : html`<div
                  class="rounded-lg bg-[var(--admin-elevated)]/40 p-3 text-center text-xs text-[var(--admin-muted)]"
                >
                  No active auctions currently on sale.
                </div>`
          }
        </div>
      </div>

      <div data-key="inventory" class="rounded-lg">
        <div class="flex flex-col space-y-1.5 p-5 pb-3">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold tracking-tight text-sm font-semibold text-[var(--admin-fg)]">
                Nation Inventory
              </h3>
              <span
                class="rounded-full bg-[var(--admin-elevated)] px-2.5 py-0.5 text-xs font-medium tabular-nums text-[var(--admin-muted)]"
              >
                ${player.collectiblesData.length}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <div class="relative w-full sm:w-56">
                ${icon('Search', 'absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--admin-muted)]')}
                <input
                  class="${cn(inputClass, cn('h-8 pl-8 text-xs', admin.input))}"
                  id="${filterId}"
                  aria-label="Filter catches"
                  value="${catchFilter}"
                  ${listen('input', (e) => setCatchFilter((e.currentTarget as HTMLInputElement).value))}
                  placeholder="Filter catches..."
                />
              </div>

              <button
                class="${cn(accentButtonClass, '', 'h-8 shrink-0 gap-1.5 rounded-lg bg-[var(--admin-accent)] px-3.5 text-xs font-medium text-[var(--admin-accent-fg)] hover:opacity-90')}"
                type="button"
                ${listen('click', () => setShowGiveModal(true))}
              >
                ${icon('Plus', 'h-3.5 w-3.5')}
                <span>Give Nation</span>
              </button>
            </div>
          </div>
        </div>

        <div class="p-0 rounded-xl bg-[var(--admin-card)] overflow-hidden">
          <div class="overflow-x-auto w-full">
            <table class="w-full min-w-[560px]">
              <thead>
                <tr class="border-b border-[var(--admin-border)]">
                  <th class="py-4 pl-5 sm:pl-6 pr-4 text-left text-xs font-medium text-[var(--admin-muted)]">
                    Catch ID
                  </th>
                  <th class="py-4 px-4 text-left text-xs font-medium text-[var(--admin-muted)]">Nation</th>
                  <th class="py-4 px-4 text-left text-xs font-medium text-[var(--admin-muted)]">Rarity</th>
                  <th class="py-4 px-4 text-left text-xs font-medium text-[var(--admin-muted)]">Stats</th>
                  <th class="py-4 pr-5 sm:pr-6 text-right text-xs font-medium text-[var(--admin-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${
                  paginatedCatches.length > 0
                    ? paginatedCatches.map((entry) => {
                        const catalogNation = catalog.find((c) => String(c.id) === String(entry.id));
                        const nationName =
                          catalogNation?.name ||
                          (entry.name && !entry.name.startsWith('Nation #') ? entry.name : null) ||
                          (entry.id ? `Nation #${entry.id}` : `#${entry.catch}`);
                        const nationClass = catalogNation?.class || entry.class || 'common';
                        return html`<tr
                          class="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-elevated)]/50 transition-colors"
                          data-key="${entry.catch}"
                        >
                          <td class="py-3 pl-5 sm:pl-6 pr-4 text-xs font-semibold tabular-nums text-[var(--admin-fg)]">
                            <span class="rounded-full bg-[var(--admin-elevated)] px-2.5 py-0.5 text-xs"
                              >#${entry.catch}
                            </span>
                          </td>
                          <td class="py-3 px-4 text-xs font-medium text-[var(--admin-fg)]">${nationName}</td>
                          <td class="py-3 px-4 text-xs">
                            <span
                              class="${cn(
                                'rounded px-2 py-0.5 text-[10px] font-medium capitalize',
                                rarityBadgeClass[nationClass],
                              )}"
                            >
                              ${nationClass}
                            </span>
                          </td>
                          <td class="py-3 px-4 text-xs text-[var(--admin-muted)] tabular-nums">
                            ${
                              entry.attack !== undefined || entry.health !== undefined
                                ? html`<span
                                    >ATK: ${entry.attack ?? 0} | HP: ${entry.health ?? 0}
                                    ${entry.attackType && entry.attackType !== 'normal' ? ` (${entry.attackType})` : ''}
                                  </span>`
                                : entry.caughtAt
                                  ? html`<span>Caught: ${entry.caughtAt}</span>`
                                  : html`<span>Base Stats</span>`
                            }
                          </td>
                          <td class="py-3 pr-5 sm:pr-6 text-right">
                            <button
                              class="${cn(buttonClass, 'rounded-md', 'h-7 px-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-400 cursor-pointer')}"
                              type="button"
                              ${listen('click', () => setCatchToRemove(entry))}
                              title="Remove nation catch"
                            >
                              ${icon('Trash2', 'h-3.5 w-3.5')}
                            </button>
                          </td>
                        </tr>`;
                      })
                    : html`<tr>
                        <td class="py-8 text-center text-xs text-[var(--admin-muted)]" colspan="${5}">
                          ${catchFilter ? 'No catches matched your filter.' : 'User holds no nation catches.'}
                        </td>
                      </tr>`
                }
              </tbody>
            </table>
          </div>

          ${
            filteredCatches.length > 0 &&
            html`<pnd-panel-pagination
              ${bind('state', { totalItems: filteredCatches.length, pageSize: pageSize, setPageSize: setPageSize, currentPage: currentPage, setCurrentPage: setCurrentPage, pageSizeOptions: [5, 10, 25, 50] })}
            ></pnd-panel-pagination>`
          }
        </div>
      </div>
    </div>`;
  }

  function closeEditorDialog() {
    if (showGiveModal) {
      setShowGiveModal(false);
      setGiveSearchQuery('');
    }
    if (showAuctionModal) setShowAuctionModal(false);
  }

  function paintDialogs() {
    if (!showGiveModal && !showAuctionModal) {
      dialogs(html``);
      return;
    }
    const query = giveSearchQuery.toLowerCase().trim();
    const filteredGiveCatalog = query
      ? catalog.filter((cat) => [cat.name, cat.id, cat.class].some((part) => part.toLowerCase().includes(query)))
      : catalog;

    const selectedGiveNation = catalog.find((c) => String(c.id).toLowerCase() === String(giveNationId).toLowerCase());

    dialogs(
      html`
        ${
          showGiveModal &&
          html`<div data-key="give-dialog" class="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" ${listen('click', closeEditorDialog)}></div>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="player-give-title"
              tabindex="-1"
              class="relative z-10 w-full max-w-md rounded-2xl bg-[var(--admin-card)] p-6 space-y-4 border-0 shadow-none"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h3 id="player-give-title" class="text-base font-semibold text-[var(--admin-fg)]">
                    Give Nation to User
                  </h3>
                  <p class="text-xs text-[var(--admin-muted)] mt-0.5">Search or choose a nation from the catalog</p>
                </div>
                <button
                  class="rounded-lg p-1.5 text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-elevated)] transition-colors border-0 shadow-none"
                  type="button"
                  aria-label="Close dialog"
                  ${listen('click', closeEditorDialog)}
                >
                  ${icon('X', 'h-4 w-4')}
                </button>
              </div>

              <form class="space-y-4" ${listen('submit', handleGiveNationSubmit)}>
                ${
                  catalog.length > 0
                    ? html`<div class="space-y-3">
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label for="player-give-search" class="text-xs font-medium text-[var(--admin-fg)]"
                              >Search Nation</label
                            >
                            ${
                              giveSearchQuery.trim() &&
                              html`<span class="text-[11px] text-[var(--admin-muted)] tabular-nums">
                                ${filteredGiveCatalog.length} result${filteredGiveCatalog.length === 1 ? '' : 's'}
                              </span>`
                            }
                          </div>
                          <div class="relative flex items-center">
                            ${icon('Search', 'pointer-events-none absolute left-3 h-3.5 w-3.5 text-[var(--admin-muted)]')}
                            <input
                              class="h-9 w-full rounded-lg bg-[var(--admin-elevated)] pl-9 pr-8 text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] focus:outline-none border-0 shadow-none"
                              id="player-give-search"
                              type="text"
                              value="${giveSearchQuery}"
                              ${listen('input', (e) => setGiveSearchQuery((e.currentTarget as HTMLInputElement).value))}
                              placeholder="Search by name, ID, or rarity..."
                            />
                            ${
                              giveSearchQuery &&
                              html`<button
                                class="absolute right-2.5 rounded p-0.5 text-[var(--admin-muted)] hover:text-[var(--admin-fg)] transition-colors border-0 shadow-none"
                                type="button"
                                ${listen('click', () => setGiveSearchQuery(''))}
                              >
                                ${icon('X', 'h-3 w-3')}
                              </button>`
                            }
                          </div>

                          ${
                            giveSearchQuery.trim() &&
                            html`<div
                              class="max-h-44 overflow-y-auto rounded-lg bg-[var(--admin-elevated)] p-1.5 space-y-1 border-0 shadow-none scrollbar-thin"
                            >
                              ${
                                filteredGiveCatalog.length > 0
                                  ? filteredGiveCatalog.map((cat) => {
                                      const isSelected =
                                        String(cat.id).toLowerCase() === String(giveNationId).toLowerCase();
                                      return html`<button
                                        class="${cn(
                                          'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors border-0 shadow-none',
                                          isSelected
                                            ? 'bg-[var(--admin-card)] text-[var(--admin-accent)] font-medium'
                                            : 'text-[var(--admin-fg)] hover:bg-[var(--admin-card)]/70',
                                        )}"
                                        data-key="${cat.id}"
                                        type="button"
                                        ${listen('click', () => {
                                          setGiveNationId(cat.id);
                                          setGiveSearchQuery('');
                                        })}
                                      >
                                        <div class="flex items-center gap-2 min-w-0">
                                          <span class="truncate">${cat.name}</span>
                                          <span class="text-[10px] text-[var(--admin-muted)]">#${cat.id}</span>
                                        </div>
                                        <div class="flex items-center gap-1.5 shrink-0 ml-2">
                                          <span
                                            class="${cn(
                                              'rounded px-1.5 py-0.5 text-[10px] font-medium capitalize',
                                              rarityBadgeClass[cat.class.toLowerCase() as RarityClass] ||
                                                'bg-white/10 text-[var(--admin-fg)]',
                                            )}"
                                          >
                                            ${cat.class}
                                          </span>
                                          ${isSelected && html`${icon('Check', 'h-3.5 w-3.5 text-[var(--admin-accent)]')}`}
                                        </div>
                                      </button>`;
                                    })
                                  : html`<div class="py-3 text-center text-xs text-[var(--admin-muted)]">
                                      No nations found matching &ldquo;${giveSearchQuery}&rdquo;
                                    </div>`
                              }
                            </div>`
                          }
                        </div>

                        <div class="space-y-1.5">
                          <label for="player-give-select" class="text-xs font-medium text-[var(--admin-fg)]"
                            >Or Select From Dropdown</label
                          >
                          <select
                            class="h-9 w-full rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] focus:outline-none border-0 shadow-none cursor-pointer"
                            id="player-give-select"
                            ${bind('value', giveNationId)}
                            ${listen('change', (e) => setGiveNationId((e.currentTarget as HTMLSelectElement).value))}
                          >
                            <option value="">Select a nation...</option>
                            ${catalog.map(
                              (cat) =>
                                html`<option data-key="${cat.id}" value="${cat.id}">
                                  ${cat.name} - [${cat.class}] (#${cat.id})
                                </option>`,
                            )}
                          </select>
                        </div>

                        ${
                          selectedGiveNation &&
                          html`<div
                            class="flex items-center justify-between rounded-lg bg-[var(--admin-elevated)] px-3 py-2 border-0 shadow-none"
                          >
                            <div class="flex items-center gap-2 min-w-0">
                              <div
                                class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[var(--admin-card)] text-[var(--admin-accent)]"
                              >
                                ${icon('Check', 'h-3 w-3')}
                              </div>
                              <div class="min-w-0">
                                <p class="truncate text-xs font-medium text-[var(--admin-fg)]">
                                  ${selectedGiveNation.name}
                                </p>
                                <p class="text-[10px] text-[var(--admin-muted)]">ID: #${selectedGiveNation.id}</p>
                              </div>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                              <span
                                class="${cn(
                                  'rounded px-2 py-0.5 text-[10px] font-medium capitalize',
                                  rarityBadgeClass[selectedGiveNation.class.toLowerCase() as RarityClass] ||
                                    'bg-white/10 text-[var(--admin-fg)]',
                                )}"
                              >
                                ${selectedGiveNation.class}
                              </span>
                              <button
                                class="rounded p-1 text-[var(--admin-muted)] hover:text-[var(--admin-fg)] transition-colors border-0 shadow-none"
                                type="button"
                                ${listen('click', () => setGiveNationId(''))}
                                title="Clear selection"
                              >
                                ${icon('X', 'h-3 w-3')}
                              </button>
                            </div>
                          </div>`
                        }
                      </div>`
                    : html`<div class="space-y-1.5">
                        <label for="player-nation-id" class="text-xs font-medium text-[var(--admin-fg)]"
                          >Nation (Catalog ID)</label
                        >
                        <input
                          class="${cn(inputClass, cn('h-9 text-xs border-0 shadow-none bg-[var(--admin-elevated)]', admin.input))}"
                          id="player-nation-id"
                          value="${giveNationId}"
                          ${listen('input', (e) => setGiveNationId((e.currentTarget as HTMLInputElement).value))}
                          placeholder="e.g. US, JP, DE..."
                        />
                      </div>`
                }

                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label for="player-give-count" class="text-xs font-medium text-[var(--admin-fg)]"
                      >Count (1 - 25)</label
                    >
                    <span class="text-xs font-semibold tabular-nums text-[var(--admin-fg)]">${giveCount}</span>
                  </div>
                  <input
                    class="w-full accent-[var(--admin-accent)] cursor-pointer"
                    id="player-give-count"
                    type="range"
                    min="1"
                    max="25"
                    step="1"
                    value="${giveCount}"
                    ${listen('input', (e) => setGiveCount(Number((e.currentTarget as HTMLInputElement).value)))}
                  />
                </div>

                <div class="flex items-center justify-end gap-2 pt-2">
                  <button
                    class="${cn(buttonClass, 'rounded-md px-3', 'h-8 text-xs border-0 shadow-none')}"
                    type="button"
                    ${listen('click', closeEditorDialog)}
                  >
                    Cancel
                  </button>
                  <button
                    class="${cn(accentButtonClass, 'px-3', 'h-8 rounded-lg bg-[var(--admin-accent)] text-xs font-medium text-[var(--admin-accent-fg)] hover:opacity-90 border-0 shadow-none')}"
                    type="submit"
                    ${disabled(isGiving || !giveNationId)}
                  >
                    ${isGiving ? html`${icon('Loader2', 'mr-1.5 h-3.5 w-3.5 animate-spin')}` : null}Grant Nation
                  </button>
                </div>
              </form>
            </div>
          </div>`
        }
        ${
          showAuctionModal &&
          html`<div data-key="auction-dialog" class="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" ${listen('click', closeEditorDialog)}></div>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="player-auction-title"
              tabindex="-1"
              class="relative z-10 w-full max-w-md rounded-2xl bg-[var(--admin-card)] p-6 space-y-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  ${icon('Gavel', 'h-4 w-4 text-[var(--admin-muted)]')}
                  <h3 id="player-auction-title" class="text-base font-semibold text-[var(--admin-fg)]">
                    Adjust Auction Stats
                  </h3>
                </div>
                <button
                  class="rounded-lg p-1 text-[var(--admin-muted)] hover:text-[var(--admin-fg)]"
                  type="button"
                  aria-label="Close dialog"
                  ${listen('click', closeEditorDialog)}
                >
                  ${icon('X', 'h-4 w-4')}
                </button>
              </div>

              <form class="space-y-4" ${listen('submit', handleAuctionSubmit)}>
                <div class="space-y-1.5">
                  <label for="player-auction-total" class="text-xs font-medium text-[var(--admin-fg)]"
                    >Total Listed</label
                  >
                  <input
                    class="${cn(inputClass, cn('h-9 text-xs', admin.input))}"
                    id="player-auction-total"
                    type="number"
                    min="0"
                    max="999999999999"
                    step="1"
                    value="${auctionTotalInput}"
                    ${listen('input', (e) => setAuctionTotalInput((e.currentTarget as HTMLInputElement).value))}
                    placeholder="0"
                  />
                </div>

                <div class="space-y-1.5">
                  <label for="player-auction-sold" class="text-xs font-medium text-[var(--admin-fg)]"
                    >Auctions Sold</label
                  >
                  <input
                    class="${cn(inputClass, cn('h-9 text-xs', admin.input))}"
                    id="player-auction-sold"
                    type="number"
                    min="0"
                    max="999999999999"
                    step="1"
                    value="${auctionSoldInput}"
                    ${listen('input', (e) => setAuctionSoldInput((e.currentTarget as HTMLInputElement).value))}
                    placeholder="0"
                  />
                </div>

                <div class="space-y-1.5">
                  <label for="player-auction-earnings" class="text-xs font-medium text-[var(--admin-fg)]"
                    >Auction Earnings (Foils)</label
                  >
                  <input
                    class="${cn(inputClass, cn('h-9 text-xs', admin.input))}"
                    id="player-auction-earnings"
                    type="number"
                    min="0"
                    max="999999999999"
                    step="1"
                    value="${auctionEarningsInput}"
                    ${listen('input', (e) => setAuctionEarningsInput((e.currentTarget as HTMLInputElement).value))}
                    placeholder="0"
                  />
                </div>

                <div class="flex items-center justify-end gap-2 pt-2">
                  <button
                    class="${cn(buttonClass, 'rounded-md px-3', 'h-8 text-xs cursor-pointer')}"
                    type="button"
                    ${listen('click', closeEditorDialog)}
                  >
                    Cancel
                  </button>
                  <button
                    class="${cn(accentButtonClass, 'px-3', 'h-8 rounded-lg bg-[var(--admin-accent)] text-xs font-medium text-[var(--admin-accent-fg)] hover:opacity-90 cursor-pointer')}"
                    type="submit"
                    ${disabled(isUpdatingAuction)}
                  >
                    ${isUpdatingAuction ? html`${icon('Loader2', 'mr-1.5 h-3.5 w-3.5 animate-spin')}` : null}Save Stats
                  </button>
                </div>
              </form>
            </div>
          </div>`
        }
      `,
      closeEditorDialog,
    );
  }

  function render() {
    const player = user;
    const isSettingsDirty = Boolean(
      pendingSettings &&
      player &&
      (pendingSettings.inventory_privacy !== player.settings.inventory_privacy ||
        pendingSettings.profile_privacy !== player.settings.profile_privacy ||
        pendingSettings.accept_gifts !== player.settings.accept_gifts),
    );
    reset.update({
      open: showResetModal,
      title: 'Reset User Settings?',
      description: 'This will restore inventory privacy, profile privacy, and gift acceptance back to default values.',
      confirmText: 'Reset Settings',
      isLoading: isResetting,
      onConfirm: handleResetSettings,
      onClose: () => setShowResetModal(false),
    });
    remove.update({
      open: Boolean(catchToRemove),
      title: 'Remove Nation Catch?',
      description: catchToRemove
        ? `Are you sure you want to remove catch #${catchToRemove.catch} (${catchToRemove.name || catchToRemove.id || 'Nation'}) from this user's inventory?`
        : '',
      confirmText: 'Remove Catch',
      isLoading: isRemovingCatch,
      onConfirm: handleRemoveCatchConfirm,
      onClose: () => setCatchToRemove(null),
    });
    unsaved.update({
      show: isSettingsDirty,
      isSaving: isSavingSettings,
      saveSuccess: saveSettingsSuccess,
      message: 'Careful, you have unsaved settings!',
      onReset: () => setPendingSettings(null),
      onSave: handleSaveSettings,
    });
    if (loading || !player) dialogs(html``);
    else paintDialogs();
    mount(template());
  }

  render();
  void loadData();
  return () => {
    connected = false;
    dispose();
    reset.remove();
    remove.remove();
    unsaved.remove();
  };
}

export class PlayerEditor extends HTMLElement {
  userId = '';
  onBack = () => {};
  private cleanup?: () => void;

  connectedCallback() {
    this.style.display = 'contents';
    this.cleanup = attachPlayerEditor(this, this.userId, this.onBack);
  }

  disconnectedCallback() {
    this.cleanup?.();
  }
}
customElements.define('pnd-player-editor', PlayerEditor);

export function mountPlayerEditor(host: HTMLElement, userId: string, onBack: () => void) {
  const editor = new PlayerEditor();
  editor.userId = userId;
  editor.onBack = onBack;
  host.append(editor);
  return () => editor.remove();
}
