import { AnimatePresence, motion } from 'framer-motion';
import { Download, ExternalLink, Image as ImageIcon, Loader2, RefreshCw, Search, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { deleteCardBackground, fetchCardBackgrounds, fetchConfig, fetchSpecialsCards, getCache, getCardImageUrl, replaceCardBackground, setCache, type RegimeCardItem, type SpecialCardItem } from '@/lib/api';
import { type CardCategoryId, cardCategories } from '@/lib/bot';
import { useMotionPref } from '@/hooks/useReducedMotion';
import { springSnappy } from '@/lib/motion';
import { cn } from '@/lib/utils';

export default function CardsPage({ searchQuery = '' }: { searchQuery?: string }) {
  const listReveal = useMotionPref('listReveal');
  const [category, setCategory] = useState<CardCategoryId>('regimes');
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const [regimes, setRegimes] = useState<RegimeCardItem[]>(() => getCache<RegimeCardItem[]>('cards_regimes') || []);
  const [specials, setSpecials] = useState<SpecialCardItem[]>(() => getCache<SpecialCardItem[]>('cards_specials') || []);
  const [isLoading, setIsLoading] = useState<boolean>(() => !getCache<RegimeCardItem[]>('cards_regimes')?.length);

  const [selectedPreview, setSelectedPreview] = useState<{
    id: string;
    name: string;
    category: 'regimes' | 'specials';
    file?: string;
    description?: string;
    nationsCount?: number;
  } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<RegimeCardItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<RegimeCardItem | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replacePreview, setReplacePreview] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceError, setReplaceError] = useState('');
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [imageVersion, setImageVersion] = useState<number>(Date.now());
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [erroredImages, setErroredImages] = useState<Record<string, boolean>>({});
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedPreview || replaceTarget) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [selectedPreview, replaceTarget]);

  useEffect(() => {
    let active = true;
    void fetchConfig();

    async function loadCards() {
      try {
        const [bgData, spData] = await Promise.all([
          fetchCardBackgrounds(),
          fetchSpecialsCards(),
        ]);
        if (!active) return;
        if (Array.isArray(bgData)) {
          setRegimes(bgData);
          setCache('cards_regimes', bgData);
        }
        if (Array.isArray(spData)) {
          setSpecials(spData);
          setCache('cards_specials', spData);
        }
      } catch {
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadCards();
    return () => {
      active = false;
    };
  }, []);

  const filteredRegimes = regimes.filter(
    (entry) =>
      entry.name.toLowerCase().includes(localQuery.toLowerCase()) ||
      entry.id.toLowerCase().includes(localQuery.toLowerCase())
  );

  const filteredSpecials = specials.filter(
    (entry) =>
      entry.name.toLowerCase().includes(localQuery.toLowerCase()) ||
      entry.id.toLowerCase().includes(localQuery.toLowerCase()) ||
      (entry.description && entry.description.toLowerCase().includes(localQuery.toLowerCase()))
  );

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => ({ ...prev, [id]: true }));
  };

  const handleImageError = (id: string) => {
    setErroredImages((prev) => ({ ...prev, [id]: true }));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCardBackground(deleteTarget.id);
      setRegimes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReplaceFile(file);
    setReplaceError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setReplacePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReplaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceTarget) return;
    if (!replacePreview) {
      setReplaceError('Please select a PNG card background');
      return;
    }
    setIsReplacing(true);
    setReplaceError('');
    try {
      const base64Data = replacePreview.split(',')[1] || replacePreview;
      const res = await replaceCardBackground(replaceTarget.id, base64Data);
      if (res.ok) {
        setImageVersion(Date.now());
        setReplaceTarget(null);
        setReplaceFile(null);
        setReplacePreview(null);
      } else {
        setReplaceError(res.error || 'Replacement failed');
      }
    } catch {
      setReplaceError('An unexpected error occurred while replacing background');
    } finally {
      setIsReplacing(false);
    }
  };

  const renderCardItem = (entry: RegimeCardItem | SpecialCardItem, isRegime: boolean) => {
    const fileKey = isRegime ? (entry as RegimeCardItem).file : (entry as SpecialCardItem).card;
    const urlKey = entry.url || fileKey || entry.id;
    const baseImgUrl = getCardImageUrl(urlKey);
    const imgUrl = `${baseImgUrl}${baseImgUrl.includes('?') ? '&' : '?'}v=${imageVersion}`;
    const isLoaded = loadedImages[entry.id];
    const hasError = erroredImages[entry.id];

    return (
      <div
        key={entry.id}
        tabIndex={0}
        onMouseEnter={() => setHoveredCardId(entry.id)}
        onMouseLeave={() => setHoveredCardId(null)}
        onFocus={() => setHoveredCardId(entry.id)}
        onBlur={() => setHoveredCardId(null)}
        onClick={() =>
          setSelectedPreview({
            id: entry.id,
            name: entry.name,
            category: isRegime ? 'regimes' : 'specials',
            file: fileKey,
            description: !isRegime ? (entry as SpecialCardItem).description : undefined,
            nationsCount: isRegime ? (entry as RegimeCardItem).nationsCount : undefined,
          })
        }
        className={cn(
          'relative h-80 cursor-pointer overflow-hidden bg-cover bg-center transition-all duration-500 ease-in-out border-0 select-none shadow-lg',
          hoveredCardId === entry.id
            ? 'scale-105 opacity-100 blur-none z-10'
            : hoveredCardId !== null
              ? 'scale-[0.97] opacity-60 blur-[2px]'
              : 'scale-100 opacity-100 blur-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]'
        )}
      >
        <div className="absolute inset-0 bg-[var(--admin-elevated)]/60">
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Loader2 className="h-5 w-5 animate-spin text-white/60" />
            </div>
          )}

          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center bg-black/20">
              <ImageIcon className="h-8 w-8 text-white/40" />
              <span className="text-[11px] text-white/60 break-all">{fileKey || `${entry.id}.png`}</span>
            </div>
          ) : (
            <img
              src={imgUrl}
              alt={entry.name}
              onLoad={() => handleImageLoad(entry.id)}
              onError={() => handleImageError(entry.id)}
              className={cn(
                'h-full w-full object-cover transition-transform duration-500',
                isLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

        <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10">
          <p className="text-xs font-light uppercase tracking-widest text-white/80">
            {isRegime
              ? `${(entry as RegimeCardItem).nationsCount ?? 0} ${((entry as RegimeCardItem).nationsCount ?? 0) === 1 ? 'nation' : 'nations'} use this`
              : 'Special Card'}
          </p>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-5 text-white z-10 flex flex-col justify-end">

          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-white truncate" title={entry.name}>
            {entry.name}
          </h3>

          {!isRegime && (entry as SpecialCardItem).description && (
            <p className="mt-1 text-xs text-white/70 line-clamp-2">
              {(entry as SpecialCardItem).description}
            </p>
          )}

          <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-white/15">

            {isRegime && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReplaceError('');
                    setReplaceFile(null);
                    setReplacePreview(null);
                    setReplaceTarget(entry as RegimeCardItem);
                  }}
                  className="inline-flex items-center gap-1 rounded text-xs bg-black/40 hover:bg-white/20 backdrop-blur-md px-2.5 py-1.5 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Replace background image"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Replace
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(entry as RegimeCardItem);
                  }}
                  className="inline-flex items-center gap-1 rounded text-xs bg-black/40 hover:bg-rose-500/20 backdrop-blur-md p-1.5 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                  title="Delete background"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="relative h-80 overflow-hidden rounded-xl bg-[var(--admin-card)] border-0 shadow-lg p-5 flex flex-col justify-between animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 rounded bg-[var(--admin-elevated)]" />
          </div>
          <div className="space-y-3">
            <div className="h-6 w-40 rounded-md bg-[var(--admin-elevated)]" />
            <div className="h-3.5 w-24 rounded bg-[var(--admin-elevated)]/60" />
            <div className="mt-3.5 pt-2.5 border-t border-[var(--admin-border)] flex items-center justify-end gap-1.5">
              <div className="h-7 w-20 rounded bg-[var(--admin-elevated)]" />
              <div className="h-7 w-16 rounded bg-[var(--admin-elevated)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <CardContent className="space-y-4 p-5">
        <div className="relative z-20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-[var(--admin-elevated)] w-fit flex-wrap">
            {cardCategories.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setCategory(item.id)}
                className={cn(
                  'relative px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors flex items-center justify-center cursor-pointer select-none touch-manipulation',
                  category === item.id ? 'text-[var(--admin-accent-fg)]' : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
                )}
              >
                {category === item.id && (
                  <motion.span
                    layoutId="cards-category-pill"
                    className="absolute inset-0 rounded-full bg-[var(--admin-accent)] z-0"
                    transition={springSnappy}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]"
              />
              <Input
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className="h-9 rounded-full bg-[var(--admin-elevated)] pl-9 pr-4 text-xs text-[var(--admin-fg)] border-0 focus-visible:ring-0"
                placeholder="Search cards..."
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          renderSkeletons()
        ) : (
          <>
            {listReveal ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  onMouseLeave={() => setHoveredCardId(null)}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                >
                  {category === 'regimes'
                    ? filteredRegimes.map((entry) => renderCardItem(entry, true))
                    : filteredSpecials.map((entry) => renderCardItem(entry, false))}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div
                onMouseLeave={() => setHoveredCardId(null)}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
              >
                {category === 'regimes'
                  ? filteredRegimes.map((entry) => renderCardItem(entry, true))
                  : filteredSpecials.map((entry) => renderCardItem(entry, false))}
              </div>
            )}

            {((category === 'regimes' && filteredRegimes.length === 0) ||
              (category === 'specials' && filteredSpecials.length === 0)) && (
                <div className="py-12 text-center space-y-1.5">
                  <p className="text-sm font-medium text-[var(--admin-fg)]">
                    {localQuery
                      ? `No cards found matching "${localQuery}"`
                      : category === 'specials'
                        ? 'No special cards available'
                        : 'No regime cards available'}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {localQuery
                      ? 'Try checking the spelling or search for another card.'
                      : 'Cards will appear here once added to the bot.'}
                  </p>
                </div>
              )}
          </>
        )}
      </CardContent>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {selectedPreview && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedPreview(null)}
                  className="fixed inset-0 bg-black/75 backdrop-blur-md"
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 8 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  className="relative z-10 w-full max-w-sm max-h-[88vh] rounded-3xl bg-[var(--admin-card)] text-[var(--admin-fg)] p-5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between pb-1 shrink-0">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--admin-fg)]">{selectedPreview.name}</h3>
                      <p className="text-xs text-[var(--admin-muted)]">ID: {selectedPreview.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPreview(null)}
                      className="rounded-full p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-elevated)] hover:text-[var(--admin-fg)] transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 flex items-center justify-center py-2">
                    <div className="relative aspect-[3/4] max-h-[46vh] w-auto bg-transparent flex items-center justify-center">
                      <img
                        src={`${getCardImageUrl(selectedPreview.file || selectedPreview.id)}${getCardImageUrl(selectedPreview.file || selectedPreview.id).includes('?') ? '&' : '?'}v=${imageVersion}`}
                        alt={selectedPreview.name}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 shrink-0 pt-1">
                    <div className="w-full space-y-1 rounded-2xl bg-[var(--admin-elevated)]/60 p-3 text-xs">
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-[var(--admin-muted)]">Card Type</span>
                        <span className="font-medium text-[var(--admin-fg)] capitalize">{selectedPreview.category}</span>
                      </div>
                      {selectedPreview.nationsCount !== undefined && (
                        <div className="flex items-center justify-between py-0.5">
                          <span className="text-[var(--admin-muted)]">Assigned Nations</span>
                          <span className="font-medium text-emerald-400">{selectedPreview.nationsCount} nations</span>
                        </div>
                      )}
                      {selectedPreview.description && (
                        <div className="pt-0.5 text-[var(--admin-muted)] line-clamp-2">
                          {selectedPreview.description}
                        </div>
                      )}
                    </div>

                    <div className="flex w-full items-center gap-2">
                      <a
                        href={getCardImageUrl(selectedPreview.file || selectedPreview.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-full bg-[var(--admin-elevated)] hover:opacity-85 text-xs font-medium text-[var(--admin-fg)] transition-opacity"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </a>
                      {selectedPreview.category === 'regimes' && (
                        <button
                          type="button"
                          onClick={() => {
                            const reg = regimes.find((r) => r.id === selectedPreview.id) || {
                              id: selectedPreview.id,
                              name: selectedPreview.name,
                              file: selectedPreview.file || `${selectedPreview.id}.png`,
                              nationsCount: selectedPreview.nationsCount || 0,
                            };
                            setReplaceError('');
                            setReplaceFile(null);
                            setReplacePreview(null);
                            setReplaceTarget(reg);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-full bg-[var(--admin-elevated)] hover:opacity-85 text-xs font-medium text-[var(--admin-fg)] transition-opacity cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Replace
                        </button>
                      )}
                      <a
                        href={getCardImageUrl(selectedPreview.file || selectedPreview.id)}
                        download={`${selectedPreview.id}.png`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-full bg-[var(--admin-accent)] hover:opacity-90 text-xs font-medium text-[var(--admin-accent-fg)] transition-opacity"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}



      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {replaceTarget && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => !isReplacing && setReplaceTarget(null)}
                  className="fixed inset-0 bg-black/75 backdrop-blur-md"
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 8 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-[var(--admin-card)] text-[var(--admin-fg)] p-6 space-y-4"
                >
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-4">
                      <RefreshCw className="h-4 w-4 text-[var(--admin-accent)]" />
                      <div>
                        <h3 className="text-base font-semibold text-[var(--admin-fg)]">Replace Card Background</h3>
                        <p className="text-xs text-[var(--admin-muted)]">Overwrites {replaceTarget.name} ({replaceTarget.id}.png)</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleReplaceSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--admin-fg)]">New PNG Image (1428 x 2000 px, max 10MB)</label>
                      <input
                        ref={replaceFileInputRef}
                        type="file"
                        accept=".png"
                        onChange={handleReplaceFileChange}
                        className="hidden"
                      />
                      <div
                        onClick={() => replaceFileInputRef.current?.click()}
                        className="rounded-2xl mt-3 bg-[var(--admin-elevated)]/60 hover:bg-[var(--admin-elevated)] p-3 text-center cursor-pointer transition-colors"
                      >
                        {replacePreview ? (
                          <div className="flex flex-col items-center gap-2">
                            <img src={replacePreview} alt="Preview" className="h-28 object-contain" />
                            <span className="text-xs text-[var(--admin-muted)]">{replaceFile?.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 py-3">
                            <Upload className="h-5 w-5 text-[var(--admin-muted)]" />
                            <span className="text-xs text-[var(--admin-muted)]">Click to choose replacement PNG</span>
                            <span className="text-[10px] text-[var(--admin-muted)]/70">Exactly 1428 x 2000 px, up to 10MB</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {replaceError && (
                      <p className="text-xs text-red-400 bg-red-500/10 rounded-xl p-2.5">
                        {replaceError}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isReplacing}
                        onClick={() => setReplaceTarget(null)}
                        className="h-8 text-xs text-[var(--admin-muted)] hover:text-[var(--admin-fg)]"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isReplacing || !replacePreview}
                        className="h-8 rounded-lg gap-1.5 text-xs bg-[var(--admin-accent)] text-[var(--admin-accent-fg)] hover:opacity-90 cursor-pointer"
                      >
                        {isReplacing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Replace Background
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}" background?`}
        description="This will permanently delete this card background from the bot. Make sure no active nations rely on this background."
        confirmText="Delete Background"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}