import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Coins, Copy, Gavel, Loader2, Plus, RotateCw, Search, Shield, Trash2, X } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmModal } from '@/components/ConfirmModal';
import { TablePagination } from '@/components/TablePagination';
import { UnsavedChangesBar } from '@/components/UnsavedChangesBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { admin } from '@/lib/admin-classes';
import { fetchCollectibles, fetchUserDetail, getCache, giveUserNation, removeUserNation, resetUserSettings, updateUserBalance, updateUserAuction, updateUserSettings, type CollectibleEntry, type UserCatchItem, type UserDetailData } from '@/lib/api';
import { rarityBadgeClass, type RarityClass } from '@/lib/bot';
import { cn } from '@/lib/utils';

interface UserEditProps { userId: string; onBack: () => void; }

export default function UserEdit({ userId, onBack }: UserEditProps) {
  const [user, setUser] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<CollectibleEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [balanceMode, setBalanceMode] = useState<'set' | 'add' | 'remove'>('add');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<{
    inventory_privacy?: string;
    profile_privacy?: string;
    accept_gifts?: boolean;
  } | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);

  const [catchFilter, setCatchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [catchToRemove, setCatchToRemove] = useState<UserCatchItem | null>(null);
  const [isRemovingCatch, setIsRemovingCatch] = useState(false);

  const [showGiveModal, setShowGiveModal] = useState(false);
  const [giveNationId, setGiveNationId] = useState('');
  const [giveCount, setGiveCount] = useState(1);
  const [isGiving, setIsGiving] = useState(false);
  const [giveSearchQuery, setGiveSearchQuery] = useState('');

  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [auctionTotalInput, setAuctionTotalInput] = useState('');
  const [auctionSoldInput, setAuctionSoldInput] = useState('');
  const [auctionEarningsInput, setAuctionEarningsInput] = useState('');
  const [isUpdatingAuction, setIsUpdatingAuction] = useState(false);

  const filterId = useId();

  const filteredGiveCatalog = useMemo(() => {
    if (!giveSearchQuery.trim()) return catalog;
    const q = giveSearchQuery.toLowerCase().trim();
    return catalog.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.id.toLowerCase().includes(q) ||
        cat.class.toLowerCase().includes(q)
    );
  }, [catalog, giveSearchQuery]);

  const selectedGiveNation = useMemo(
    () => catalog.find((c) => String(c.id).toLowerCase() === String(giveNationId).toLowerCase()),
    [catalog, giveNationId]
  );

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

  useEffect(() => {
    void loadData();
  }, [userId]);

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

  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(balanceAmount);
    if (isNaN(amount) || amount < 0 || !Number.isInteger(amount)) {
      showToast('error', 'Please enter a valid whole number for amount.');
      return;
    }
    if (amount > 999999999999) {
      showToast('error', 'Amount cannot exceed 12 digits (999,999,999,999).');
      return;
    }

    setIsUpdatingBalance(true);
    const res = await updateUserBalance(userId, balanceMode, amount);
    setIsUpdatingBalance(false);

    if (res.ok) {
      showToast('success', `Balance successfully updated (${balanceMode} ${amount.toLocaleString()}).`);
      setBalanceAmount('');
      setUser((prev) => {
        if (!prev) return prev;
        let newBalance = prev.balance;
        if (balanceMode === 'set') newBalance = amount;
        else if (balanceMode === 'add') newBalance = Math.min(999999999999, prev.balance + amount);
        else if (balanceMode === 'remove') newBalance = Math.max(0, prev.balance - amount);
        return { ...prev, balance: newBalance };
      });
    } else {
      showToast('error', res.error || 'Failed to update balance.');
    }
  };

  const handleAuctionSubmit = async (e: React.FormEvent) => {
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
    value: string | boolean
  ) => {
    setPendingSettings((prev) => ({
      inventory_privacy: user?.settings.inventory_privacy || 'public',
      profile_privacy: user?.settings.profile_privacy || 'public',
      accept_gifts: user?.settings.accept_gifts ?? true,
      ...prev,
      [key]: value,
    }));
  };

  const isSettingsDirty = Boolean(
    pendingSettings &&
    user &&
    (pendingSettings.inventory_privacy !== user.settings.inventory_privacy ||
      pendingSettings.profile_privacy !== user.settings.profile_privacy ||
      pendingSettings.accept_gifts !== user.settings.accept_gifts)
  );

  const handleSaveSettings = async () => {
    if (!pendingSettings || !user) return;
    setIsSavingSettings(true);
    const entries: Array<['inventory_privacy' | 'profile_privacy' | 'accept_gifts', string | boolean]> = [];
    if (pendingSettings.inventory_privacy !== undefined && pendingSettings.inventory_privacy !== user.settings.inventory_privacy) {
      entries.push(['inventory_privacy', pendingSettings.inventory_privacy]);
    }
    if (pendingSettings.profile_privacy !== undefined && pendingSettings.profile_privacy !== user.settings.profile_privacy) {
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

  const handleGiveNationSubmit = async (e: React.FormEvent) => {
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
    if (!catchToRemove) return;
    setIsRemovingCatch(true);
    const res = await removeUserNation(userId, catchToRemove.catch);
    setIsRemovingCatch(false);

    if (res.ok) {
      showToast('success', `Catch #${catchToRemove.catch} removed from inventory.`);
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          collectiblesData: prev.collectiblesData.filter((c) => c.catch !== catchToRemove.catch),
        };
      });
      setCatchToRemove(null);
    } else {
      showToast('error', res.error || 'Failed to remove catch from inventory.');
    }
  };

  const filteredCatches = (user?.collectiblesData || []).filter((item) => {
    const q = catchFilter.toLowerCase();
    return (
      item.catch.toLowerCase().includes(q) ||
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.id && item.id.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [catchFilter]);

  const paginatedCatches = filteredCatches.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return (
      <div className="flex h-72 w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--admin-muted)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4 p-4 text-center">
        <p className="text-sm text-[var(--admin-muted)]">User #{userId} was not found.</p>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-2 text-xs font-medium text-[var(--admin-muted)] hover:text-[var(--admin-fg)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Users</span>
        </button>

        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--admin-fg)] hover:opacity-85 transition-opacity cursor-pointer"
        >
          <RotateCw className="h-3.5 w-3.5 text-[var(--admin-muted)]" />
          <span>Refresh</span>
        </button>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={cn(
              'flex items-center justify-between rounded-lg px-4 py-3 text-xs font-medium',
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400'
            )}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-1 hover:opacity-75"
              aria-label="Dismiss message"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-xl bg-[var(--admin-card)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full min-w-0 space-y-1.5">
            <div className="flex w-full min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="min-w-0 truncate text-xl font-semibold tracking-tight text-[var(--admin-fg)]">
                  {user.global_name || user.username}
                </h2>

                {user.private && (
                  <span className="shrink-0 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-400">
                    Private Profile
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
                <span className="text-xs tabular-nums text-[var(--admin-muted)]">
                  {user.discordId}
                </span>

                <button
                  type="button"
                  onClick={handleCopyId}
                  className="cursor-pointer p-1 text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-fg)]"
                  title="Copy Discord ID"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {user.global_name && user.username && user.username !== user.global_name && (
              <span className="hidden sm:block text-xs text-[var(--admin-muted)]">
                @{user.username}
              </span>
            )}

            <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--admin-muted)]">
              <span className="tabular-nums">{user.discordId}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="cursor-pointer p-0.5 text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-fg)]"
                title="Copy Discord ID"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full max-w-[420px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--admin-muted)]">Foils</span>
              <span className="text-xs font-semibold text-[var(--admin-fg)]">{user.balance.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--admin-muted)]">Value</span>
              <span className="text-xs font-semibold text-[var(--admin-fg)]">{user.totalValue.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--admin-muted)]">Inventory</span>
              <span className="text-xs font-semibold text-[var(--admin-fg)] capitalize">{user.settings.inventory_privacy}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--admin-muted)]">Profile</span>
              <span className="text-xs font-semibold text-[var(--admin-fg)] capitalize">{user.settings.profile_privacy}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--admin-muted)]">Gifts</span>
              <span className="text-xs font-semibold text-[var(--admin-fg)]">{user.settings.accept_gifts ? 'On' : 'Off'}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--admin-muted)]">Auctions</span>
              <span className="text-xs font-semibold text-[var(--admin-fg)]">{user.auctionData.sold}/{user.auctionData.total} Sold</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-[var(--admin-muted)]" />
              <CardTitle className="text-sm font-semibold text-[var(--admin-fg)]">Balance Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-[var(--admin-elevated)] p-4 flex items-center justify-between">
              <span className="text-md font-medium text-[var(--admin-fg)]">Foils</span>
              <span className="text-xl font-bold tabular-nums text-[var(--admin-fg)] sm:text-2xl">
                {user.balance.toLocaleString()}
              </span>
            </div>

            <form onSubmit={handleBalanceSubmit} className="space-y-3">
              <div className="inline-flex rounded-full bg-[var(--admin-elevated)] p-1">
                {(['add', 'remove', 'set'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBalanceMode(mode)}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-all cursor-pointer',
                      balanceMode === mode
                        ? 'bg-white text-black shadow-sm font-semibold'
                        : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
                    )}
                  >
                    {mode === 'add' ? '+ Add' : mode === 'remove' ? '- Remove' : '= Set'}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Input
                  type="number"
                  min="0"
                  max="999999999999"
                  step="1"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="Enter amount (whole number, max 12 digits)..."
                  className={cn('h-9 text-xs', admin.input)}
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[100, 1000, 10000, 100000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBalanceAmount(String(preset))}
                      className="rounded-full bg-[var(--admin-elevated)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--admin-muted)] hover:text-[var(--admin-fg)] transition-colors cursor-pointer"
                    >
                      +{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isUpdatingBalance || !balanceAmount}
                className="w-full h-9 rounded-lg bg-[var(--admin-accent)] text-xs font-medium text-[var(--admin-accent-fg)] hover:opacity-90 transition-opacity"
              >
                {isUpdatingBalance ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Apply Balance Change
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[var(--admin-muted)]" />
                <CardTitle className="text-sm font-semibold text-[var(--admin-fg)]">Settings & Privacy</CardTitle>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                Reset to Defaults
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-[var(--admin-elevated)] p-3">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-[var(--admin-fg)]">Inventory Privacy</span>
                <p className="text-[11px] text-[var(--admin-muted)]">Controls public visibility of nation collection</p>
              </div>
              <div className="inline-flex rounded-full bg-[var(--admin-card)] p-1">
                {(['public', 'private'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleSettingSelect('inventory_privacy', mode)}
                    className={cn(
                      'rounded-full px-3.5 py-1 text-xs font-medium capitalize transition-all cursor-pointer',
                      (pendingSettings?.inventory_privacy ?? user.settings.inventory_privacy) === mode
                        ? 'bg-white text-black shadow-sm font-semibold'
                        : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[var(--admin-elevated)] p-3">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-[var(--admin-fg)]">Profile Privacy</span>
                <p className="text-[11px] text-[var(--admin-muted)]">Controls visibility of player statistics</p>
              </div>
              <div className="inline-flex rounded-full bg-[var(--admin-card)] p-1">
                {(['public', 'private'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleSettingSelect('profile_privacy', mode)}
                    className={cn(
                      'rounded-full px-3.5 py-1 text-xs font-medium capitalize transition-all cursor-pointer',
                      (pendingSettings?.profile_privacy ?? user.settings.profile_privacy) === mode
                        ? 'bg-white text-black shadow-sm font-semibold'
                        : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[var(--admin-elevated)] p-3">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-[var(--admin-fg)]">Accept Gifts</span>
                <p className="text-[11px] text-[var(--admin-muted)]">Allow or block nation gifts from other players</p>
              </div>
              <div className="inline-flex rounded-full bg-[var(--admin-card)] p-1">
                {[
                  { label: 'Allow', value: true },
                  { label: 'Block', value: false },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSettingSelect('accept_gifts', item.value)}
                    className={cn(
                      'rounded-full px-3.5 py-1 text-xs font-medium transition-all cursor-pointer',
                      (pendingSettings?.accept_gifts ?? user.settings.accept_gifts) === item.value
                        ? 'bg-white text-black shadow-sm font-semibold'
                        : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-[var(--admin-muted)]" />
              <CardTitle className="text-sm font-semibold text-[var(--admin-fg)]">Auction Activity</CardTitle>
              <span className="rounded-full bg-[var(--admin-elevated)] px-2.5 py-0.5 text-xs font-medium tabular-nums text-[var(--admin-muted)]">
                {user.auctionData.onSale.length} on sale
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAuctionTotalInput(String(user.auctionData.total));
                setAuctionSoldInput(String(user.auctionData.sold));
                setAuctionEarningsInput(String(user.auctionData.earnings));
                setShowAuctionModal(true);
              }}
              className="h-7 rounded-md border-0 bg-[var(--admin-elevated)] px-2.5 text-xs font-medium text-[var(--admin-fg)] hover:bg-[var(--admin-elevated)]/80 cursor-pointer shadow-none"
            >
              Adjust
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-[var(--admin-elevated)] px-3 pt-2 pb-2.5">
              <span className="block text-[11px] font-medium leading-none text-[var(--admin-muted)]">Total Listed</span>
              <p className="mt-1.5 text-lg font-semibold tabular-nums leading-tight text-[var(--admin-fg)]">
                {user.auctionData.total}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--admin-elevated)] px-3 pt-2 pb-2.5">
              <span className="block text-[11px] font-medium leading-none text-[var(--admin-muted)]">Auctions Sold</span>
              <p className="mt-1.5 text-lg font-semibold tabular-nums leading-tight text-[var(--admin-fg)]">
                {user.auctionData.sold}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--admin-elevated)] px-3 pt-2 pb-2.5">
              <span className="block text-[11px] font-medium leading-none text-[var(--admin-muted)]">Auction Earnings</span>
              <p className="mt-1.5 text-lg font-semibold tabular-nums leading-tight text-[var(--admin-fg)]">
                {user.auctionData.earnings.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--admin-elevated)] px-3 pt-2 pb-2.5">
              <span className="block text-[11px] font-medium leading-none text-[var(--admin-muted)]">Active On Sale</span>
              <p className="mt-1.5 text-lg font-semibold tabular-nums leading-tight text-[var(--admin-fg)]">
                {user.auctionData.onSale.length}
              </p>
            </div>
          </div>

          {user.auctionData.activeAuctions.length > 0 ? (
            <div className="overflow-x-auto w-full pt-1">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-[var(--admin-border)]">
                    <th className="pb-3 pl-3 pr-4 text-left text-xs font-medium text-[var(--admin-muted)]">Auction ID</th>
                    <th className="pb-3 px-4 text-left text-xs font-medium text-[var(--admin-muted)]">Nation / Item</th>
                    <th className="pb-3 px-4 text-left text-xs font-medium text-[var(--admin-muted)]">Starting Bid</th>
                    <th className="pb-3 px-4 text-left text-xs font-medium text-[var(--admin-muted)]">Buyout</th>
                    <th className="pb-3 px-4 text-left text-xs font-medium text-[var(--admin-muted)]">Current Bid</th>
                    <th className="pb-3 pr-3 text-right text-xs font-medium text-[var(--admin-muted)]">Status / Ends</th>
                  </tr>
                </thead>
                <tbody>
                  {user.auctionData.activeAuctions.map((auc) => {
                    const catalogNation = catalog.find((c) => String(c.id) === String(auc.catalogId));
                    const nationName = catalogNation?.name || (auc.catalogId ? `Nation #${auc.catalogId}` : `#${auc.nationCatchId}`);
                    const nationClass = catalogNation?.class || 'common';
                    return (
                      <tr
                        key={auc.id}
                        className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-elevated)]/50 transition-colors"
                      >
                        <td className="py-3 pl-3 pr-4 text-xs font-semibold tabular-nums text-[var(--admin-fg)]">
                          <span className="rounded-full bg-[var(--admin-elevated)] px-2.5 py-0.5 text-xs">
                            #{auc.id}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[var(--admin-fg)]">{nationName}</span>
                            <span
                              className={cn(
                                'rounded px-2 py-0.5 text-[10px] font-medium capitalize',
                                rarityBadgeClass[nationClass]
                              )}
                            >
                              {nationClass}
                            </span>
                            {auc.nationCatchId && (
                              <span className="text-[11px] text-[var(--admin-muted)]">
                                #{auc.nationCatchId}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs tabular-nums text-[var(--admin-fg)]">
                          {auc.startPrice.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-xs tabular-nums text-[var(--admin-fg)]">
                          {auc.buyoutPrice.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-xs tabular-nums text-[var(--admin-fg)]">
                          {auc.currentBid > 0 ? (
                            <span>{auc.currentBid.toLocaleString()} ({auc.bidsCount} bids)</span>
                          ) : (
                            <span className="text-[var(--admin-muted)]">No bids</span>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-right text-xs">
                          <span className={cn(
                            'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                            auc.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-[var(--admin-elevated)] text-[var(--admin-muted)]'
                          )}>
                            {auc.status === 'active' ? (auc.endsAt ? `Ends ${auc.endsAt}` : 'Active') : 'Ended'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg bg-[var(--admin-elevated)]/40 p-3 text-center text-xs text-[var(--admin-muted)]">
              No active auctions currently on sale.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-[var(--admin-fg)]">Nation Inventory</CardTitle>
              <span className="rounded-full bg-[var(--admin-elevated)] px-2.5 py-0.5 text-xs font-medium tabular-nums text-[var(--admin-muted)]">
                {user.collectiblesData.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--admin-muted)]" />
                <Input
                  id={filterId}
                  value={catchFilter}
                  onChange={(e) => setCatchFilter(e.target.value)}
                  placeholder="Filter catches..."
                  className={cn('h-8 pl-8 text-xs', admin.input)}
                />
              </div>

              <Button
                size="sm"
                onClick={() => setShowGiveModal(true)}
                className="h-8 shrink-0 gap-1.5 rounded-lg bg-[var(--admin-accent)] px-3.5 text-xs font-medium text-[var(--admin-accent-fg)] hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Give Nation</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 rounded-xl bg-[var(--admin-card)] overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-[var(--admin-border)]">
                  <th className="py-4 pl-5 sm:pl-6 pr-4 text-left text-xs font-medium text-[var(--admin-muted)]">Catch ID</th>
                  <th className="py-4 px-4 text-left text-xs font-medium text-[var(--admin-muted)]">Nation</th>
                  <th className="py-4 px-4 text-left text-xs font-medium text-[var(--admin-muted)]">Rarity</th>
                  <th className="py-4 px-4 text-left text-xs font-medium text-[var(--admin-muted)]">Stats</th>
                  <th className="py-4 pr-5 sm:pr-6 text-right text-xs font-medium text-[var(--admin-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCatches.length > 0 ? (
                  paginatedCatches.map((entry) => {
                    const catalogNation = catalog.find((c) => String(c.id) === String(entry.id));
                    const nationName =
                      catalogNation?.name ||
                      (entry.name && !entry.name.startsWith('Nation #') ? entry.name : null) ||
                      (entry.id ? `Nation #${entry.id}` : `#${entry.catch}`);
                    const nationClass = catalogNation?.class || entry.class || 'common';
                    return (
                      <tr
                        key={entry.catch}
                        className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-elevated)]/50 transition-colors"
                      >
                        <td className="py-3 pl-5 sm:pl-6 pr-4 text-xs font-semibold tabular-nums text-[var(--admin-fg)]">
                          <span className="rounded-full bg-[var(--admin-elevated)] px-2.5 py-0.5 text-xs">
                            #{entry.catch}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-[var(--admin-fg)]">
                          {nationName}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span
                            className={cn(
                              'rounded px-2 py-0.5 text-[10px] font-medium capitalize',
                              rarityBadgeClass[nationClass]
                            )}
                          >
                            {nationClass}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-[var(--admin-muted)] tabular-nums">
                          {entry.attack !== undefined || entry.health !== undefined ? (
                            <span>
                              ATK: {entry.attack ?? 0} | HP: {entry.health ?? 0}
                              {entry.attackType && entry.attackType !== 'normal' ? ` (${entry.attackType})` : ''}
                            </span>
                          ) : entry.caughtAt ? (
                            <span>Caught: {entry.caughtAt}</span>
                          ) : (
                            <span>Base Stats</span>
                          )}
                        </td>
                        <td className="py-3 pr-5 sm:pr-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCatchToRemove(entry)}
                            className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                            title="Remove nation catch"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[var(--admin-muted)]">
                      {catchFilter ? 'No catches matched your filter.' : 'User holds no nation catches.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredCatches.length > 0 && (
            <TablePagination
              totalItems={filteredCatches.length}
              pageSize={pageSize}
              setPageSize={setPageSize}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              pageSizeOptions={[5, 10, 25, 50]}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        open={showResetModal}
        title="Reset User Settings?"
        description="This will restore inventory privacy, profile privacy, and gift acceptance back to default values."
        confirmText="Reset Settings"
        isLoading={isResetting}
        onConfirm={handleResetSettings}
        onClose={() => setShowResetModal(false)}
      />

      <ConfirmModal
        open={Boolean(catchToRemove)}
        title="Remove Nation Catch?"
        description={
          catchToRemove
            ? `Are you sure you want to remove catch #${catchToRemove.catch} (${catchToRemove.name || catchToRemove.id || 'Nation'}) from this user's inventory?`
            : ''
        }
        confirmText="Remove Catch"
        isLoading={isRemovingCatch}
        onConfirm={handleRemoveCatchConfirm}
        onClose={() => setCatchToRemove(null)}
      />

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showGiveModal && (
              <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setShowGiveModal(false);
                    setGiveSearchQuery('');
                  }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ scale: 0.94, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.94, opacity: 0, y: 12 }}
                  className="relative z-10 w-full max-w-md rounded-2xl bg-[var(--admin-card)] p-6 space-y-4 border-0 shadow-none"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--admin-fg)]">Give Nation to User</h3>
                      <p className="text-xs text-[var(--admin-muted)] mt-0.5">Search or choose a nation from the catalog</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGiveModal(false);
                        setGiveSearchQuery('');
                      }}
                      className="rounded-lg p-1.5 text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-elevated)] transition-colors border-0 shadow-none"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleGiveNationSubmit} className="space-y-4">
                    {catalog.length > 0 ? (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-[var(--admin-fg)]">Search Nation</label>
                            {giveSearchQuery.trim() && (
                              <span className="text-[11px] text-[var(--admin-muted)] tabular-nums">
                                {filteredGiveCatalog.length} result{filteredGiveCatalog.length === 1 ? '' : 's'}
                              </span>
                            )}
                          </div>
                          <div className="relative flex items-center">
                            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[var(--admin-muted)]" />
                            <input
                              type="text"
                              value={giveSearchQuery}
                              onChange={(e) => setGiveSearchQuery(e.target.value)}
                              placeholder="Search by name, ID, or rarity..."
                              className="h-9 w-full rounded-lg bg-[var(--admin-elevated)] pl-9 pr-8 text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] focus:outline-none border-0 shadow-none"
                            />
                            {giveSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setGiveSearchQuery('')}
                                className="absolute right-2.5 rounded p-0.5 text-[var(--admin-muted)] hover:text-[var(--admin-fg)] transition-colors border-0 shadow-none"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>

                          {giveSearchQuery.trim() && (
                            <div className="max-h-44 overflow-y-auto rounded-lg bg-[var(--admin-elevated)] p-1.5 space-y-1 border-0 shadow-none scrollbar-thin">
                              {filteredGiveCatalog.length > 0 ? (
                                filteredGiveCatalog.map((cat) => {
                                  const isSelected = String(cat.id).toLowerCase() === String(giveNationId).toLowerCase();
                                  return (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => {
                                        setGiveNationId(cat.id);
                                        setGiveSearchQuery('');
                                      }}
                                      className={cn(
                                        'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors border-0 shadow-none',
                                        isSelected
                                          ? 'bg-[var(--admin-card)] text-[var(--admin-accent)] font-medium'
                                          : 'text-[var(--admin-fg)] hover:bg-[var(--admin-card)]/70'
                                      )}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="truncate">{cat.name}</span>
                                        <span className="text-[10px] text-[var(--admin-muted)]">#{cat.id}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                        <span
                                          className={cn(
                                            'rounded px-1.5 py-0.5 text-[10px] font-medium capitalize',
                                            rarityBadgeClass[cat.class.toLowerCase() as RarityClass] || 'bg-white/10 text-[var(--admin-fg)]'
                                          )}
                                        >
                                          {cat.class}
                                        </span>
                                        {isSelected && <Check className="h-3.5 w-3.5 text-[var(--admin-accent)]" />}
                                      </div>
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="py-3 text-center text-xs text-[var(--admin-muted)]">
                                  No nations found matching &ldquo;{giveSearchQuery}&rdquo;
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-[var(--admin-fg)]">Or Select From Dropdown</label>
                          <select
                            value={giveNationId}
                            onChange={(e) => setGiveNationId(e.target.value)}
                            className="h-9 w-full rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] focus:outline-none border-0 shadow-none cursor-pointer"
                          >
                            <option value="">Select a nation...</option>
                            {catalog.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name} - [{cat.class}] (#{cat.id})
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedGiveNation && (
                          <div className="flex items-center justify-between rounded-lg bg-[var(--admin-elevated)] px-3 py-2 border-0 shadow-none">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[var(--admin-card)] text-[var(--admin-accent)]">
                                <Check className="h-3 w-3" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-[var(--admin-fg)]">
                                  {selectedGiveNation.name}
                                </p>
                                <p className="text-[10px] text-[var(--admin-muted)]">ID: #{selectedGiveNation.id}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={cn(
                                  'rounded px-2 py-0.5 text-[10px] font-medium capitalize',
                                  rarityBadgeClass[selectedGiveNation.class.toLowerCase() as RarityClass] || 'bg-white/10 text-[var(--admin-fg)]'
                                )}
                              >
                                {selectedGiveNation.class}
                              </span>
                              <button
                                type="button"
                                onClick={() => setGiveNationId('')}
                                className="rounded p-1 text-[var(--admin-muted)] hover:text-[var(--admin-fg)] transition-colors border-0 shadow-none"
                                title="Clear selection"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[var(--admin-fg)]">Nation (Catalog ID)</label>
                        <Input
                          value={giveNationId}
                          onChange={(e) => setGiveNationId(e.target.value)}
                          placeholder="e.g. US, JP, DE..."
                          className={cn('h-9 text-xs border-0 shadow-none bg-[var(--admin-elevated)]', admin.input)}
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-[var(--admin-fg)]">Count (1 - 25)</label>
                        <span className="text-xs font-semibold tabular-nums text-[var(--admin-fg)]">{giveCount}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="25"
                        step="1"
                        value={giveCount}
                        onChange={(e) => setGiveCount(Number(e.target.value))}
                        className="w-full accent-[var(--admin-accent)] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowGiveModal(false);
                          setGiveSearchQuery('');
                        }}
                        className="h-8 text-xs border-0 shadow-none"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isGiving || !giveNationId}
                        className="h-8 rounded-lg bg-[var(--admin-accent)] text-xs font-medium text-[var(--admin-accent-fg)] hover:opacity-90 border-0 shadow-none"
                      >
                        {isGiving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                        Grant Nation
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}

            {showAuctionModal && (
              <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAuctionModal(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ scale: 0.94, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.94, opacity: 0, y: 12 }}
                  className="relative z-10 w-full max-w-md rounded-2xl bg-[var(--admin-card)] p-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gavel className="h-4 w-4 text-[var(--admin-muted)]" />
                      <h3 className="text-base font-semibold text-[var(--admin-fg)]">Adjust Auction Stats</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAuctionModal(false)}
                      className="rounded-lg p-1 text-[var(--admin-muted)] hover:text-[var(--admin-fg)]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleAuctionSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--admin-fg)]">Total Listed</label>
                      <Input
                        type="number"
                        min="0"
                        max="999999999999"
                        step="1"
                        value={auctionTotalInput}
                        onChange={(e) => setAuctionTotalInput(e.target.value)}
                        placeholder="0"
                        className={cn('h-9 text-xs', admin.input)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--admin-fg)]">Auctions Sold</label>
                      <Input
                        type="number"
                        min="0"
                        max="999999999999"
                        step="1"
                        value={auctionSoldInput}
                        onChange={(e) => setAuctionSoldInput(e.target.value)}
                        placeholder="0"
                        className={cn('h-9 text-xs', admin.input)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--admin-fg)]">Auction Earnings (Foils)</label>
                      <Input
                        type="number"
                        min="0"
                        max="999999999999"
                        step="1"
                        value={auctionEarningsInput}
                        onChange={(e) => setAuctionEarningsInput(e.target.value)}
                        placeholder="0"
                        className={cn('h-9 text-xs', admin.input)}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAuctionModal(false)}
                        className="h-8 text-xs cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isUpdatingAuction}
                        className="h-8 rounded-lg bg-[var(--admin-accent)] text-xs font-medium text-[var(--admin-accent-fg)] hover:opacity-90 cursor-pointer"
                      >
                        {isUpdatingAuction ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                        Save Stats
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      <UnsavedChangesBar
        show={isSettingsDirty}
        isSaving={isSavingSettings}
        saveSuccess={saveSettingsSuccess}
        message="Careful, you have unsaved settings!"
        onReset={() => setPendingSettings(null)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}