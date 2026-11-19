import { AnimatePresence, m } from '@/lib/panel-motion';
import { ArrowLeft, Check, Copy, Flame, Globe, Heart, ImageIcon, Loader2, Shield, Swords, Trash2, Upload, X } from '@/components/icons';
import { useEffect, useState, useId } from 'preact/compat';
import { createPortal } from 'preact/compat';
import { UnsavedChangesBar } from '@/components/feedback/UnsavedChangesBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createNation, deleteNation, fetchNationDetail, updateNation, updateNationCard, uploadNationArt, type NationDetailData } from '@/lib/api';
import { bot, formatRarity, rarityBadgeClass, type RarityClass } from '@/lib/bot';
import { quickTransition } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface NationEditProps {
  nationId?: string;
  isNew?: boolean;
  onBack: () => void;
}

type TabKey = 'identity' | 'ability' | 'visuals';

export default function NationEdit({ nationId, isNew = false, onBack }: NationEditProps) {
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<'spawn' | 'window' | null>(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCascade, setDeleteCascade] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('identity');

  const [initialData, setInitialData] = useState<NationDetailData | null>(null);

  const [idInput, setIdInput] = useState(nationId || '');
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [nationClass, setNationClass] = useState<string>('common');
  const [emojiId, setEmojiId] = useState('');
  const [credits, setCredits] = useState('');
  const [attack, setAttack] = useState<number | string>(100);
  const [health, setHealth] = useState<number | string>(150);
  const [weight, setWeight] = useState<number | string>(10);
  const [globalCaught, setGlobalCaught] = useState<number | string>(0);
  const [price, setPrice] = useState<number | string>(100);
  const [sellPrice, setSellPrice] = useState<number | string>(50);
  const [capacityName, setCapacityName] = useState('');
  const [capacityDescription, setCapacityDescription] = useState('');
  const [catchNamesInput, setCatchNamesInput] = useState('');
  const [translationsInput, setTranslationsInput] = useState('');
  const [regime, setRegime] = useState('');
  const [economy, setEconomy] = useState('');
  const [wildCard, setWildCard] = useState('');
  const [collectionCard, setCollectionCard] = useState('');

  const [spawnArtBase64, setSpawnArtBase64] = useState<string | null>(null);
  const [spawnArtName, setSpawnArtName] = useState('');
  const [windowArtBase64, setWindowArtBase64] = useState<string | null>(null);
  const [windowArtName, setWindowArtName] = useState('');

  const formId = useId();

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const loadNation = async () => {
    if (!nationId || isNew) return;
    setLoading(true);
    try {
      const data = await fetchNationDetail(nationId);
      if (data) {
        setInitialData(data);
        setIdInput(data.id);
        setName(data.name || '');
        setShortName(data.short_name || '');
        setNationClass(data.class || 'common');
        setEmojiId(data.emoji_id || '');
        setCredits(data.credits || '');
        setAttack(data.attack ?? 100);
        setHealth(data.health ?? 150);
        setWeight(data.weight ?? data.rarity ?? 10);
        setGlobalCaught(data.global_caught ?? 0);
        setPrice(data.price ?? 100);
        setSellPrice(data.sell_price ?? 50);
        setCapacityName(data.capacity_name || '');
        setCapacityDescription(data.capacity_description || '');
        setCatchNamesInput(Array.isArray(data.catch_names) ? data.catch_names.join(', ') : '');
        setTranslationsInput(Array.isArray(data.translations) ? data.translations.join(', ') : '');
        setRegime(data.regime || '');
        setEconomy(data.economy || '');
        setWildCard(data.wild_card || '');
        setCollectionCard(data.collection_card || '');
        setSpawnArtBase64(null);
        setWindowArtBase64(null);
      } else {
        showToast('error', `Failed to load details for nation ${nationId}.`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNation();
  }, [nationId, isNew]);

  const handleCopyId = () => {
    const idToCopy = isNew ? idInput : nationId;
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parseNames = (input: string) => {
    return input
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  };

  const isDirty = isNew
    ? Boolean(
      name.trim() ||
      emojiId.trim() ||
      shortName.trim() ||
      credits.trim() ||
      capacityName.trim() ||
      capacityDescription.trim() ||
      catchNamesInput.trim() ||
      translationsInput.trim() ||
      regime.trim() ||
      economy.trim() ||
      spawnArtBase64 ||
      windowArtBase64
    )
    : Boolean(
      initialData && (
        name !== (initialData.name || '') ||
        shortName !== (initialData.short_name || '') ||
        nationClass !== (initialData.class || 'common') ||
        emojiId !== (initialData.emoji_id || '') ||
        credits !== (initialData.credits || '') ||
        Number(attack) !== (initialData.attack ?? 100) ||
        Number(health) !== (initialData.health ?? 150) ||
        Number(weight) !== (initialData.weight ?? 10) ||
        Number(globalCaught) !== (initialData.global_caught ?? 0) ||
        Number(price) !== (initialData.price ?? 100) ||
        Number(sellPrice) !== (initialData.sell_price ?? 50) ||
        capacityName !== (initialData.capacity_name || '') ||
        capacityDescription !== (initialData.capacity_description || '') ||
        catchNamesInput !== (Array.isArray(initialData.catch_names) ? initialData.catch_names.join(', ') : '') ||
        translationsInput !== (Array.isArray(initialData.translations) ? initialData.translations.join(', ') : '') ||
        regime !== (initialData.regime || '') ||
        economy !== (initialData.economy || '') ||
        wildCard !== (initialData.wild_card || '') ||
        collectionCard !== (initialData.collection_card || '') ||
        spawnArtBase64 !== null ||
        windowArtBase64 !== null
      )
    );

  const handleReset = () => {
    if (isNew) {
      setName('');
      setShortName('');
      setNationClass('common');
      setEmojiId('');
      setCredits('');
      setAttack(100);
      setHealth(150);
      setWeight(10);
      setGlobalCaught(0);
      setPrice(100);
      setSellPrice(50);
      setCapacityName('');
      setCapacityDescription('');
      setCatchNamesInput('');
      setTranslationsInput('');
      setRegime('');
      setEconomy('');
      setWildCard('');
      setCollectionCard('');
      setSpawnArtBase64(null);
      setWindowArtBase64(null);
    } else if (initialData) {
      setName(initialData.name || '');
      setShortName(initialData.short_name || '');
      setNationClass(initialData.class || 'common');
      setEmojiId(initialData.emoji_id || '');
      setCredits(initialData.credits || '');
      setAttack(initialData.attack ?? 100);
      setHealth(initialData.health ?? 150);
      setWeight(initialData.weight ?? 10);
      setGlobalCaught(initialData.global_caught ?? 0);
      setPrice(initialData.price ?? 100);
      setSellPrice(initialData.sell_price ?? 50);
      setCapacityName(initialData.capacity_name || '');
      setCapacityDescription(initialData.capacity_description || '');
      setCatchNamesInput(Array.isArray(initialData.catch_names) ? initialData.catch_names.join(', ') : '');
      setTranslationsInput(Array.isArray(initialData.translations) ? initialData.translations.join(', ') : '');
      setRegime(initialData.regime || '');
      setEconomy(initialData.economy || '');
      setWildCard(initialData.wild_card || '');
      setCollectionCard(initialData.collection_card || '');
      setSpawnArtBase64(null);
      setWindowArtBase64(null);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Nation name is required (1-100 characters).');
      return;
    }
    const cleanCatchNames = parseNames(catchNamesInput);
    if (!isNew && cleanCatchNames.length === 0) {
      showToast('error', 'At least one catch name is required.');
      return;
    }

    setSaving(true);

    if (isNew) {
      const payload = {
        name: name.trim(),
        class: nationClass,
        emoji_id: emojiId.trim(),
        attack: Math.max(0, Math.floor(Number(attack) || 0)),
        health: Math.max(0, Math.floor(Number(health) || 0)),
        rarity: Math.max(0.01, Number(weight) || 10),
        weight: Math.max(0.01, Number(weight) || 10),
        short_name: shortName.trim() || undefined,
        regime: regime.trim() || undefined,
        economy: economy.trim() || undefined,
        capacity_name: capacityName.trim() || undefined,
        capacity_description: capacityDescription.trim() || undefined,
        credits: credits.trim() || undefined,
        translations: parseNames(translationsInput),
        catch_names: cleanCatchNames.length > 0 ? cleanCatchNames : [name.trim().toLowerCase()],
        catching_names: cleanCatchNames.length > 0 ? cleanCatchNames : [name.trim().toLowerCase()],
        global_caught: Math.max(0, Math.floor(Number(globalCaught) || 0)),
        price: Math.max(0, Math.floor(Number(price) || 0)),
        sell_price: Math.max(0, Math.floor(Number(sellPrice) || 0)),
        wild_card: wildCard.trim() || undefined,
        collection_card: collectionCard.trim() || undefined,
      };

      const res = await createNation(payload);
      if (res.ok) {
        const createdId = res.value?.id || idInput.trim();
        if (createdId && (spawnArtBase64 || windowArtBase64)) {
          if (spawnArtBase64) {
            await uploadNationArt(createdId, 'spawn', spawnArtBase64, spawnArtName || undefined);
          }
          if (windowArtBase64) {
            await uploadNationArt(createdId, 'window', windowArtBase64, windowArtName || undefined);
          }
        }
        setSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        showToast('success', `Nation ${name.trim()} created successfully.`);
        setTimeout(() => onBack(), 1200);
      } else {
        setSaving(false);
        showToast('error', res.error || 'Failed to create nation.');
      }
    } else {
      if (!nationId) {
        setSaving(false);
        return;
      }

      const payload = {
        name: name.trim(),
        short_name: shortName.trim() || null,
        class: nationClass,
        emoji_id: emojiId.trim() || undefined,
        credits: credits.trim() || undefined,
        attack: Math.max(0, Math.floor(Number(attack) || 0)),
        health: Math.max(0, Math.floor(Number(health) || 0)),
        rarity: Math.max(0.01, Number(weight) || 10),
        weight: Math.max(0.01, Number(weight) || 10),
        regime: regime.trim() || undefined,
        economy: economy.trim() || undefined,
        price: Math.max(0, Math.floor(Number(price) || 0)),
        sell_price: Math.max(0, Math.floor(Number(sellPrice) || 0)),
        global_caught: Math.max(0, Math.floor(Number(globalCaught) || 0)),
        capacity_name: capacityName.trim() || undefined,
        capacity_description: capacityDescription.trim() || undefined,
        catch_names: cleanCatchNames,
        catching_names: cleanCatchNames,
        translations: parseNames(translationsInput),
        wild_card: wildCard.trim() || undefined,
        collection_card: collectionCard.trim() || undefined,
      };

      const res = await updateNation(nationId, payload);
      setSaving(false);
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        showToast('success', 'Nation details successfully updated.');
        void loadNation();
      } else {
        showToast('error', res.error || 'Failed to update nation.');
      }
    }
  };

  const handleUpdateCardOnly = async () => {
    if (!nationId || isNew) return;
    setSaving(true);
    const res = await updateNationCard(nationId, {
      regime: regime.trim() || undefined,
      economy: economy.trim() || undefined,
    });
    setSaving(false);
    if (res.ok) {
      showToast('success', 'Card background and economy icon updated.');
    } else {
      showToast('error', res.error || 'Failed to update card parameters.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, kind: 'spawn' | 'window') => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'Artwork file must be under 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      if (kind === 'spawn') {
        setSpawnArtBase64(b64);
        setSpawnArtName(file.name.replace(/\.[^.]+$/, ''));
      } else {
        setWindowArtBase64(b64);
        setWindowArtName(file.name.replace(/\.[^.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadArt = async (kind: 'spawn' | 'window') => {
    if (isNew) {
      if (!name.trim()) {
        showToast('error', 'Please enter a nation name before uploading artwork.');
        return;
      }
      void handleSave();
      return;
    }
    if (!nationId) return;
    const base64 = kind === 'spawn' ? spawnArtBase64 : windowArtBase64;
    const fileName = kind === 'spawn' ? spawnArtName : windowArtName;
    if (!base64) {
      showToast('error', `Please choose an image file for ${kind} art first.`);
      return;
    }

    setUploadingKind(kind);
    const res = await uploadNationArt(nationId, kind, base64, fileName || undefined);
    setUploadingKind(null);

    if (res.ok) {
      const savedFile = res.value?.file || fileName;
      if (kind === 'spawn') {
        setWildCard(savedFile);
        setSpawnArtBase64(null);
      } else {
        setCollectionCard(savedFile);
        setWindowArtBase64(null);
      }
      showToast('success', `${kind === 'spawn' ? 'Spawn' : 'Collection'} artwork uploaded successfully.`);
    } else {
      showToast('error', res.error || `Failed to upload ${kind} art.`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!nationId || isNew) return;
    setDeleting(true);
    const res = await deleteNation(nationId, deleteCascade);
    setDeleting(false);
    setShowDeleteModal(false);

    if (res.ok) {
      showToast('success', `Nation ${nationId} deleted.`);
      setTimeout(() => onBack(), 1200);
    } else {
      showToast('error', res.error || 'Failed to delete nation.');
    }
  };

  const catchPills = parseNames(catchNamesInput);
  const translationPills = parseNames(translationsInput);

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--admin-muted)]" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex inline-flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          omitDefaults="rounded-md text-sm rounded-md" className="h-9 w-fit gap-1.5 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs font-medium text-[var(--admin-fg)] hover:bg-[var(--admin-elevated)]/80 border-0 shadow-none"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Nations</span>
        </Button>

        {!isNew && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            omitDefaults="rounded-md text-sm rounded-md" className="h-9 gap-1.5 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-400 border-0 shadow-none"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Nation</span>
          </Button>
        )}
      </div>

      <AnimatePresence>
        {feedback && (
          <m.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              'flex items-center justify-between rounded-lg px-4 py-2.5 text-xs font-medium border-0 shadow-none',
              feedback.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-red-500/15 text-red-400'
            )}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-1 hover:opacity-75 border-0 shadow-none"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </m.div>
        )}
      </AnimatePresence>

      <div className="rounded-xl bg-[var(--admin-card)] p-5 sm:p-6">
        <div className="flex flex-col xl:flex-row xl:items-center gap-6 xl:gap-8">
          <div className="flex items-center gap-3.5 min-w-0 shrink-0">
            {emojiId ? (
              <img
                src={`https://cdn.discordapp.com/emojis/${emojiId}.png`}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg p-1.5 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center text-[var(--admin-muted)] border-0 shadow-none">
                <Globe className="h-6 w-6" />
              </div>
            )}

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="truncate text-lg sm:text-xl font-semibold tracking-tight text-[var(--admin-fg)]">
                  {name || (isNew ? 'New Nation' : 'Unnamed Nation')}
                </h2>
                {shortName && (
                  <span className="text-xs text-[var(--admin-muted)] font-normal">({shortName})</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded px-2.5 py-0.5 text-xs font-medium capitalize border-0 shadow-none',
                    rarityBadgeClass[nationClass.toLowerCase() as RarityClass] || 'bg-white/10 text-[var(--admin-fg)]'
                  )}
                >
                  {nationClass}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-[var(--admin-muted)]">
                  <span className="tabular-nums">#{isNew ? idInput || 'AUTO' : nationId}</span>
                  {!isNew && (
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-0.5 text-[var(--admin-muted)] hover:text-[var(--admin-fg)] transition-colors border-0 shadow-none"
                      title="Copy Catalog ID"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
            <span className="rounded-lg bg-[var(--admin-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--admin-fg)] text-center border-0 shadow-none truncate">
              ATK: {Number(attack) || 0}
            </span>
            <span className="rounded-lg bg-[var(--admin-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--admin-fg)] text-center border-0 shadow-none truncate">
              HP: {Number(health) || 0}
            </span>
            <span className="rounded-lg bg-[var(--admin-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--admin-fg)] text-center border-0 shadow-none truncate">
              Weight: {Number(weight) || 10}
            </span>
            <span className="rounded-lg bg-[var(--admin-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--admin-fg)] text-center border-0 shadow-none truncate">
              Caught: {Number(globalCaught).toLocaleString()}
            </span>
            <span className="rounded-lg bg-[var(--admin-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--admin-fg)] text-center border-0 shadow-none truncate">
              Price: {Number(price).toLocaleString()} Foils
            </span>
            <span className="rounded-lg bg-[var(--admin-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--admin-fg)] text-center border-0 shadow-none truncate">
              Sell: {Number(sellPrice).toLocaleString()} Foils
            </span>
            <span className="rounded-lg bg-[var(--admin-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--admin-fg)] text-center border-0 shadow-none truncate">
              Regime: {regime || 'Standard'}
            </span>
            <span className="rounded-lg bg-[var(--admin-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--admin-fg)] text-center border-0 shadow-none truncate">
              Economy: {economy || 'Default'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center gap-1 rounded-full bg-[var(--admin-card)] p-1 sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={cn(
            'relative flex flex-1 min-w-0 items-center justify-center rounded-full px-2 py-2 sm:flex-none sm:px-4 text-[11px] sm:text-xs font-medium transition-colors',
            activeTab === 'identity'
              ? 'text-[var(--admin-accent-fg)]'
              : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
          )}
        >
          {activeTab === 'identity' && (
            <m.span
              className="absolute inset-0 rounded-full bg-[var(--admin-accent)]"
              transition={quickTransition}
            />
          )}
          <span className="relative z-10 flex min-w-0 flex-row items-center justify-center gap-1.5 text-center leading-tight">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            <span>Identity</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ability')}
          className={cn(
            'relative flex flex-1 min-w-0 items-center justify-center rounded-full px-2 py-2 sm:flex-none sm:px-4 text-[11px] sm:text-xs font-medium transition-colors',
            activeTab === 'ability'
              ? 'text-[var(--admin-accent-fg)]'
              : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
          )}
        >
          {activeTab === 'ability' && (
            <m.span
              className="absolute inset-0 rounded-full bg-[var(--admin-accent)]"
              transition={quickTransition}
            />
          )}
          <span className="relative z-10 flex min-w-0 flex-row items-center justify-center gap-1.5 text-center leading-tight">
            <Flame className="h-3.5 w-3.5 shrink-0" />
            <span>Ability</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('visuals')}
          className={cn(
            'relative flex flex-1 min-w-0 items-center justify-center rounded-full px-2 py-2 sm:flex-none sm:px-4 text-[11px] sm:text-xs font-medium transition-colors',
            activeTab === 'visuals'
              ? 'text-[var(--admin-accent-fg)]'
              : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
          )}
        >
          {activeTab === 'visuals' && (
            <m.span
              className="absolute inset-0 rounded-full bg-[var(--admin-accent)]"
              transition={quickTransition}
            />
          )}
          <span className="relative z-10 flex min-w-0 flex-row items-center justify-center gap-1.5 text-center leading-tight">
            <ImageIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Assets</span>
          </span>
        </button>
      </div>

      <form id={formId} onSubmit={handleSave} className="space-y-6">
        {activeTab === 'identity' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
            <Card className="h-full flex flex-col justify-between">
              <div>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--admin-fg)]">
                      Nation Name <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.currentTarget.value)}
                      maxLength={100}
                      placeholder="e.g. United States, Japan, Germany..."
                      omitDefaults="h-10 rounded-md text-sm" className="h-9 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] focus:outline-none border-0 shadow-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--admin-fg)]">Short Name</label>
                      <Input
                        value={shortName}
                        onChange={(e) => setShortName(e.currentTarget.value)}
                        maxLength={100}
                        placeholder="e.g. USA, JPN..."
                        omitDefaults="h-10 rounded-md text-sm" className="h-9 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] focus:outline-none border-0 shadow-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--admin-fg)]">Rarity Class</label>
                      <select name="nationclass"
                        value={nationClass}
                        onChange={(e) => setNationClass(e.currentTarget.value)}
                        className="h-9 w-full rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] focus:outline-none border-0 shadow-none cursor-pointer capitalize"
                      >
                        {bot.rarityClasses.map((rc) => (
                          <option key={rc} value={rc} className="capitalize">
                            {formatRarity(rc)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--admin-fg)]">
                      Application Emoji ID <span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {emojiId ? (
                        <img
                          src={`https://cdn.discordapp.com/emojis/${emojiId}.png`}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-lg bg-[var(--admin-elevated)] p-1 object-contain border-0 shadow-none"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <Input
                        value={emojiId}
                        onChange={(e) => setEmojiId(e.currentTarget.value)}
                        maxLength={64}
                        placeholder="e.g. 110293847564738291"
                        omitDefaults="h-10 rounded-md text-sm" className="h-9 flex-1 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] focus:outline-none border-0 shadow-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--admin-fg)]">Credits / Artist</label>
                    <Input
                      value={credits}
                      onChange={(e) => setCredits(e.currentTarget.value)}
                      maxLength={120}
                      placeholder="e.g. Community, Artist Name..."
                      omitDefaults="h-10 rounded-md text-sm" className="h-9 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] focus:outline-none border-0 shadow-none"
                    />
                  </div>
                </CardContent>
              </div>
            </Card>

            <Card className="h-full flex flex-col justify-between">
              <div>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Swords className="h-3.5 w-3.5 text-amber-400" />
                        <label className="text-xs font-medium text-[var(--admin-fg)]">Attack</label>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        value={attack}
                        onChange={(e) => setAttack(e.currentTarget.value)}
                        omitDefaults="h-10 rounded-md text-sm" className="h-9 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] tabular-nums focus:outline-none border-0 shadow-none"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5 text-rose-400" />
                        <label className="text-xs font-medium text-[var(--admin-fg)]">Health</label>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        value={health}
                        onChange={(e) => setHealth(e.currentTarget.value)}
                        omitDefaults="h-10 rounded-md text-sm" className="h-9 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] tabular-nums focus:outline-none border-0 shadow-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--admin-fg)]">Spawn Weight / Rarity</label>
                      <Input
                        type="number"
                        step="any"
                        min="0.01"
                        value={weight}
                        onChange={(e) => setWeight(e.currentTarget.value)}
                        placeholder="e.g. 10 or 0.8"
                        omitDefaults="h-10 rounded-md text-sm" className="h-9 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] tabular-nums focus:outline-none border-0 shadow-none"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--admin-fg)]">Global Caught</label>
                      <Input
                        type="number"
                        min="0"
                        value={globalCaught}
                        onChange={(e) => setGlobalCaught(e.currentTarget.value)}
                        omitDefaults="h-10 rounded-md text-sm" className="h-9 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] tabular-nums focus:outline-none border-0 shadow-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--admin-fg)]">Store Price (Foils)</label>
                      <Input
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.currentTarget.value)}
                        omitDefaults="h-10 rounded-md text-sm" className="h-9 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] tabular-nums focus:outline-none border-0 shadow-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--admin-fg)]">Sell Value (Foils)</label>
                      <Input
                        type="number"
                        min="0"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(e.currentTarget.value)}
                        omitDefaults="h-10 rounded-md text-sm" className="h-9 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] tabular-nums focus:outline-none border-0 shadow-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'ability' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
            <Card className="h-full flex flex-col justify-between">
              <div>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--admin-fg)]">Capacity / Ability Name</label>
                    <Input
                      value={capacityName}
                      onChange={(e) => setCapacityName(e.currentTarget.value)}
                      maxLength={64}
                      placeholder="e.g. Iron Bastion, Blitzkrieg..."
                      omitDefaults="h-10 rounded-md text-sm" className="h-9 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] focus:outline-none border-0 shadow-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[var(--admin-fg)]">Capacity Description</label>
                      <span className="text-[11px] text-[var(--admin-muted)] tabular-nums">
                        {capacityDescription.length}/600
                      </span>
                    </div>
                    <textarea name="capacitydescription"
                      value={capacityDescription}
                      onChange={(e) => setCapacityDescription(e.currentTarget.value)}
                      maxLength={600}
                      rows={4}
                      placeholder="Explain what the nation's capacity does in combat..."
                      className="w-full resize-none rounded-lg bg-[var(--admin-elevated)] p-3 text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] focus:outline-none border-0 shadow-none"
                    />
                  </div>
                </CardContent>
              </div>
            </Card>

            <Card className="h-full flex flex-col justify-between">
              <div>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--admin-fg)]">
                      Catching Names (Comma Separated) <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={catchNamesInput}
                      onChange={(e) => setCatchNamesInput(e.currentTarget.value)}
                      placeholder="e.g. united states, usa, america"
                      omitDefaults="h-10 rounded-md text-sm" className="h-9 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] focus:outline-none border-0 shadow-none"
                    />
                    {catchPills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {catchPills.map((pill, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-[var(--admin-elevated)] px-2 py-0.5 text-[11px] text-[var(--admin-fg)] border-0 shadow-none"
                          >
                            {pill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--admin-fg)]">Translations (Comma Separated)</label>
                    <Input
                      value={translationsInput}
                      onChange={(e) => setTranslationsInput(e.currentTarget.value)}
                      placeholder="e.g. etats-unis, estados unidos"
                      omitDefaults="h-10 rounded-md text-sm" className="h-9 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] focus:outline-none border-0 shadow-none"
                    />
                    {translationPills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {translationPills.map((pill, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-[var(--admin-elevated)] px-2 py-0.5 text-[11px] text-[var(--admin-muted)] border-0 shadow-none"
                          >
                            {pill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'visuals' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
            <Card className="h-full flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-[var(--admin-muted)]" />
                      <CardTitle omitDefaults="text-2xl leading-none" className="text-sm font-semibold text-[var(--admin-fg)]">Card Background & Icon</CardTitle>
                    </div>
                    {!isNew && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleUpdateCardOnly}
                        omitDefaults="text-sm h-9" className="h-7 text-[11px] bg-[var(--admin-elevated)] text-[var(--admin-fg)] border-0 shadow-none"
                      >
                        Save Params
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--admin-fg)]">Regime (Background Name)</label>
                    <Input
                      value={regime}
                      onChange={(e) => setRegime(e.currentTarget.value)}
                      placeholder="e.g. democracy, monarchy (in assets/cards)"
                      omitDefaults="h-10 rounded-md text-sm" className="h-9 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] focus:outline-none border-0 shadow-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--admin-fg)]">Economy Icon Filename</label>
                    <Input
                      value={economy}
                      onChange={(e) => setEconomy(e.currentTarget.value)}
                      placeholder="e.g. capitalism.png (in assets/icons)"
                      omitDefaults="h-10 rounded-md text-sm" className="h-9 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] focus:outline-none border-0 shadow-none"
                    />
                  </div>
                </CardContent>
              </div>
            </Card>

            <Card className="h-full flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-[var(--admin-muted)]" />
                    <CardTitle omitDefaults="text-2xl leading-none" className="text-sm font-semibold text-[var(--admin-fg)]">Artwork Assets</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[var(--admin-fg)]">Spawn Artwork (Wild)</label>
                      <span className="text-[11px] text-[var(--admin-muted)]">{wildCard || spawnArtName || 'None'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex h-8 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs font-medium text-[var(--admin-fg)] hover:bg-[var(--admin-elevated)]/80 transition-colors border-0 shadow-none">
                        <Upload className="h-3.5 w-3.5 text-[var(--admin-muted)]" />
                        <span className="truncate">{spawnArtName ? `Selected: ${spawnArtName}` : 'Choose Spawn PNG/JPG/WebP'}</span>
                        <input name="file-960"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => handleFileChange(e, 'spawn')}
                          className="hidden"
                        />
                      </label>
                      {spawnArtBase64 && (
                        <Button
                          type="button"
                          size="sm"
                          disabled={uploadingKind === 'spawn' || saving}
                          onClick={() => handleUploadArt('spawn')}
                          omitDefaults="rounded-md text-sm h-9 rounded-md" className="h-8 gap-1.5 rounded-lg bg-[var(--admin-accent)] px-3 text-xs font-medium text-[var(--admin-accent-fg)] border-0 shadow-none"
                        >
                          {uploadingKind === 'spawn' || (saving && isNew) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                          <span>Upload</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[var(--admin-fg)]">Collection Artwork (Window)</label>
                      <span className="text-[11px] text-[var(--admin-muted)]">{collectionCard || windowArtName || 'None'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex h-8 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs font-medium text-[var(--admin-fg)] hover:bg-[var(--admin-elevated)]/80 transition-colors border-0 shadow-none">
                        <Upload className="h-3.5 w-3.5 text-[var(--admin-muted)]" />
                        <span className="truncate">{windowArtName ? `Selected: ${windowArtName}` : 'Choose Collection PNG/JPG/WebP'}</span>
                        <input name="file-995"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => handleFileChange(e, 'window')}
                          className="hidden"
                        />
                      </label>
                      {windowArtBase64 && (
                        <Button
                          type="button"
                          size="sm"
                          disabled={uploadingKind === 'window' || saving}
                          onClick={() => handleUploadArt('window')}
                          omitDefaults="rounded-md text-sm h-9 rounded-md" className="h-8 gap-1.5 rounded-lg bg-[var(--admin-accent)] px-3 text-xs font-medium text-[var(--admin-accent-fg)] border-0 shadow-none"
                        >
                          {uploadingKind === 'window' || (saving && isNew) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                          <span>Upload</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        )}
      </form>

      <UnsavedChangesBar
        show={isDirty}
        isSaving={saving}
        saveSuccess={saveSuccess}
        message={isNew ? 'Ready to create this nation?' : 'Careful, you have unsaved changes!'}
        onReset={handleReset}
        onSave={() => void handleSave()}
      />

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showDeleteModal && (
              <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDeleteModal(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                />
                <m.div
                  initial={{ scale: 0.94, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.94, opacity: 0, y: 12 }}
                  className="relative z-10 w-full max-w-md rounded-2xl bg-[var(--admin-card)] p-6 space-y-4 border-0 shadow-none"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-[var(--admin-fg)]">Delete Nation?</h3>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      className="rounded-lg p-1.5 text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-elevated)] transition-colors border-0 shadow-none"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-[var(--admin-muted)] leading-relaxed">
                    Are you sure you want to delete <span className="font-semibold text-[var(--admin-fg)]">{name || nationId}</span>?
                    This will remove the collectible from the global catalog.
                  </p>

                  <div className="flex items-center gap-2 rounded-lg bg-[var(--admin-elevated)] p-3 border-0 shadow-none">
                    <input
                      type="checkbox"
                      id="cascade-checkbox"
                      checked={deleteCascade}
                      onChange={(e) => setDeleteCascade(e.currentTarget.checked)}
                      className="h-4 w-4 rounded accent-[var(--admin-accent)] cursor-pointer"
                    />
                    <label htmlFor="cascade-checkbox" className="text-xs text-[var(--admin-fg)] cursor-pointer">
                      Cascade delete (removes all player catches and recounts owner inventories)
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteModal(false)}
                      omitDefaults="text-sm h-9" className="h-8 text-xs border-0 shadow-none"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={deleting}
                      onClick={handleDeleteConfirm}
                      omitDefaults="rounded-md text-sm h-9 rounded-md" className="h-8 rounded-lg bg-red-500 text-xs font-medium text-white hover:bg-red-600 border-0 shadow-none"
                    >
                      {deleting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                      Delete Collectible
                    </Button>
                  </div>
                </m.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}