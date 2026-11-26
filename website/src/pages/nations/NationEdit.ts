import { PanelUnsavedChanges } from '@/components/feedback/PanelUnsavedChanges';
import {
  createNation,
  deleteNation,
  fetchNationDetail,
  updateNation,
  updateNationCard,
  uploadNationArt,
  type NationDetailData,
} from '@/lib/api';
import { bot, formatRarity, rarityBadgeClass, type RarityClass } from '@/lib/bot';

type ArtKind = 'spawn' | 'window';
const defaults = {
  name: '',
  short_name: '',
  class: 'common',
  emoji_id: '',
  credits: '',
  attack: '100',
  health: '150',
  weight: '10',
  global_caught: '0',
  price: '100',
  sell_price: '50',
  capacity_name: '',
  capacity_description: '',
  catch_names: '',
  translations: '',
  regime: '',
  economy: '',
  wild_card: '',
  collection_card: '',
};
type Field = keyof typeof defaults;
const fields: Array<{ key: Field; label: string; tab: string; type?: string }> = [
  { key: 'name', label: 'Nation Name', tab: 'identity' },
  { key: 'short_name', label: 'Short Name', tab: 'identity' },
  { key: 'class', label: 'Rarity Class', tab: 'identity', type: 'select' },
  { key: 'emoji_id', label: 'Discord Emoji ID', tab: 'identity' },
  { key: 'credits', label: 'Credits / Artist', tab: 'identity' },
  { key: 'attack', label: 'Attack', tab: 'identity', type: 'number' },
  { key: 'health', label: 'Health', tab: 'identity', type: 'number' },
  { key: 'weight', label: 'Spawn Weight / Rarity', tab: 'identity', type: 'number' },
  { key: 'global_caught', label: 'Global Caught', tab: 'identity', type: 'number' },
  { key: 'price', label: 'Store Price (Foils)', tab: 'identity', type: 'number' },
  { key: 'sell_price', label: 'Sell Value (Foils)', tab: 'identity', type: 'number' },
  { key: 'capacity_name', label: 'Capacity / Ability Name', tab: 'ability' },
  { key: 'capacity_description', label: 'Capacity Description', tab: 'ability', type: 'textarea' },
  { key: 'catch_names', label: 'Catch Names (Comma Separated)', tab: 'ability' },
  { key: 'translations', label: 'Translations (Comma Separated)', tab: 'ability' },
  { key: 'regime', label: 'Regime (Background Name)', tab: 'visuals' },
  { key: 'economy', label: 'Economy Icon Filename', tab: 'visuals' },
  { key: 'wild_card', label: 'Spawn Artwork Filename', tab: 'visuals' },
  { key: 'collection_card', label: 'Collection Artwork Filename', tab: 'visuals' },
];
const names = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
const fieldClass =
  'w-full h-9 rounded-lg bg-[var(--admin-elevated)] px-3 text-xs text-[var(--admin-fg)] focus:outline-none border-0';
const buttonClass =
  'inline-flex items-center justify-center rounded-lg bg-[var(--admin-elevated)] px-3 py-2 text-xs font-medium text-[var(--admin-fg)] hover:opacity-80 disabled:opacity-50';

export class NationEdit extends HTMLElement {
  nationId?: string;
  onBack = () => {};
  private original = { ...defaults };
  private controls = new Map<Field, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>();
  private art = new Map<ArtKind, { data: string; name: string }>();
  private artVersions = new Map<ArtKind, number>();
  private readonly unsaved = new PanelUnsavedChanges();
  private feedback = document.createElement('p');
  private saving = false;
  private generation = 0;

  connectedCallback() {
    const generation = ++this.generation;
    this.style.display = 'contents';
    this.replaceChildren(this.unsaved);
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full space-y-6';
    const header = document.createElement('div');
    header.className = 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between';
    const back = this.button('Back to Nations', () => this.onBack());
    header.append(back);
    if (this.nationId) header.append(this.button('Delete Nation', () => this.deleteDialog(), 'text-red-400'));
    this.feedback.className = 'text-xs text-[var(--admin-muted)]';
    this.feedback.setAttribute('role', 'status');
    const summary = document.createElement('div');
    summary.className = 'rounded-xl bg-[var(--admin-card)] p-5 sm:p-6';
    summary.innerHTML = `
      <div class="flex flex-col xl:flex-row xl:items-center gap-6 xl:gap-8">
        <div class="flex items-center gap-3.5 min-w-0 shrink-0">
          <img data-emoji alt="" hidden class="h-16 w-16 shrink-0 rounded-lg p-1.5 object-contain">
          <div data-globe class="flex h-12 w-12 shrink-0 items-center justify-center text-[var(--admin-muted)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20 M12 2a15 15 0 0 1 0 20 M12 2a15 15 0 0 0 0 20"></path></svg>
          </div>
          <div class="min-w-0 space-y-1">
            <div class="flex items-center gap-2 flex-wrap"><h2 class="truncate text-lg sm:text-xl font-semibold tracking-tight text-[var(--admin-fg)]"></h2><span data-short class="text-xs text-[var(--admin-muted)] font-normal"></span></div>
            <div class="flex items-center gap-2"><span data-rarity></span><span data-id class="tabular-nums text-xs text-[var(--admin-muted)]"></span></div>
          </div>
        </div>
        <div data-metrics class="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1"></div>
      </div>`;
    const title = summary.querySelector('h2')!;
    const image = summary.querySelector('img')!;
    image.addEventListener('error', () => {
      image.hidden = true;
      summary.querySelector<HTMLElement>('[data-globe]')!.hidden = false;
    });
    if (this.nationId) {
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'text-xs text-[var(--admin-muted)] hover:text-[var(--admin-fg)]';
      copy.textContent = 'Copy';
      copy.title = 'Copy Catalog ID';
      copy.addEventListener('click', () => {
        void navigator.clipboard
          .writeText(this.nationId!)
          .then(() => {
            copy.textContent = 'Copied';
          })
          .catch(() => {});
      });
      summary.querySelector('[data-id]')!.after(copy);
    }
    const tabs = document.createElement('div');
    tabs.className = 'flex w-full items-center gap-1 rounded-full bg-[var(--admin-card)] p-1 sm:w-fit';
    const form = document.createElement('form');
    form.className = 'space-y-4';
    const panels = new Map<string, HTMLElement>();
    for (const tab of ['identity', 'ability', 'visuals']) {
      const panel = document.createElement('div');
      panel.className = 'grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch';
      for (let i = 0; i < 2; i++) {
        const card = document.createElement('div');
        card.className = 'rounded-lg p-6 pt-0 space-y-4';
        panel.append(card);
      }
      panel.hidden = tab !== 'identity';
      panels.set(tab, panel);
      const control = this.button(tab === 'visuals' ? 'Assets' : tab[0].toUpperCase() + tab.slice(1), () => {
        for (const [key, section] of panels) section.hidden = key !== tab;
        for (const item of tabs.querySelectorAll('button')) this.styleTab(item, item === control);
      });
      this.styleTab(control, tab === 'identity');
      tabs.append(control);
      form.append(panel);
    }
    for (const field of fields) {
      const label = document.createElement('label');
      label.className = 'space-y-1.5 text-xs font-medium text-[var(--admin-fg)]';
      label.append(document.createTextNode(field.label));
      let control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (field.type === 'select') {
        control = document.createElement('select');
        for (const rarity of bot.rarityClasses) control.add(new Option(formatRarity(rarity), rarity));
      } else if (field.type === 'textarea') {
        control = document.createElement('textarea');
        control.rows = 3;
      } else {
        control = document.createElement('input');
        control.type = field.type || 'text';
        if (field.type === 'number') {
          control.min = '0';
          control.step = field.key === 'weight' ? 'any' : '1';
        }
      }
      control.name = field.key;
      control.value = defaults[field.key];
      control.className = fieldClass;
      if (field.key === 'name') {
        control.required = true;
        if (control instanceof HTMLInputElement) control.maxLength = 100;
      }
      control.addEventListener('input', () => {
        if (field.key === 'name')
          title.textContent = control.value || (this.nationId ? 'Unnamed Nation' : 'New Nation');
        this.sync();
      });
      label.append(control);
      const second = [
        'attack',
        'health',
        'weight',
        'global_caught',
        'price',
        'sell_price',
        'catch_names',
        'translations',
        'wild_card',
        'collection_card',
      ].includes(field.key);
      panels.get(field.tab)!.children[second ? 1 : 0].append(label);
      this.controls.set(field.key, control);
    }
    const visuals = panels.get('visuals')!;
    if (this.nationId) visuals.children[0].prepend(this.button('Update Card', () => void this.updateCard()));
    for (const kind of ['spawn', 'window'] as const) {
      const label = document.createElement('label');
      label.className = 'space-y-2 text-xs text-[var(--admin-fg)]';
      label.append(document.createTextNode(kind === 'spawn' ? 'Spawn Artwork (Wild)' : 'Collection Artwork (Window)'));
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.className = 'block w-full text-xs';
      const name = document.createElement('p');
      name.className = 'text-xs text-[var(--admin-muted)]';
      input.addEventListener('change', () => void this.readArt(kind, input, name));
      label.append(input, name);
      if (this.nationId) label.append(this.button('Upload Artwork', () => void this.upload(kind)));
      visuals.children[1].append(label);
    }
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.save();
    });
    wrapper.append(header, this.feedback, summary, tabs, form);
    this.append(wrapper);
    this.sync();
    if (this.nationId) {
      form.inert = true;
      this.message('Loading nation…');
      void fetchNationDetail(this.nationId)
        .then((data) => {
          if (generation !== this.generation) return;
          if (!data) {
            this.message('Could not load this nation.');
            return;
          }
          this.original = this.toFields(data);
          this.fill(this.original);
          title.textContent = data.name || 'Unnamed Nation';
          form.inert = false;
          this.message('');
          this.sync();
        })
        .catch(() => this.message('Could not load this nation.'));
    }
  }

  disconnectedCallback() {
    ++this.generation;
  }

  private styleTab(button: HTMLButtonElement, active: boolean) {
    button.setAttribute('aria-pressed', String(active));
    button.className =
      'flex flex-1 min-w-0 items-center justify-center rounded-full px-2 py-2 sm:flex-none sm:px-4 text-[11px] sm:text-xs font-medium transition-colors ' +
      (active
        ? 'bg-[var(--admin-accent)] text-[var(--admin-accent-fg)]'
        : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]');
  }

  private button(text: string, action: () => void, extra = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = buttonClass + ' ' + extra;
    button.textContent = text;
    button.addEventListener('click', action);
    return button;
  }

  private toFields(data: NationDetailData) {
    const result = { ...defaults };
    for (const key of Object.keys(result) as Field[]) {
      const value = data[key] ?? (key === 'weight' ? data.rarity : undefined);
      if (value !== undefined && value !== null) result[key] = Array.isArray(value) ? value.join(', ') : String(value);
    }
    return result;
  }

  private values() {
    const values = { ...defaults };
    for (const [key, control] of this.controls) values[key] = control.value;
    return values;
  }

  private fill(values: typeof defaults) {
    for (const [key, control] of this.controls) control.value = values[key];
  }

  private message(value: string) {
    this.feedback.textContent = value;
  }

  private sync() {
    const values = this.values();
    const summary = this.querySelector('[data-metrics]')!;
    const metrics = [
      'ATK: ' + (Number(values.attack) || 0),
      'HP: ' + (Number(values.health) || 0),
      'Weight: ' + (Number(values.weight) || 10),
      'Caught: ' + Number(values.global_caught).toLocaleString(),
      'Price: ' + Number(values.price).toLocaleString() + ' Foils',
      'Sell: ' + Number(values.sell_price).toLocaleString() + ' Foils',
      'Regime: ' + (values.regime || 'Standard'),
      'Economy: ' + (values.economy || 'Default'),
    ];
    summary.replaceChildren(
      ...metrics.map((text) => {
        const metric = document.createElement('span');
        metric.className =
          'rounded-lg bg-[var(--admin-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--admin-fg)] text-center truncate';
        metric.textContent = text;
        return metric;
      }),
    );
    this.querySelector('h2')!.textContent = values.name || (this.nationId ? 'Unnamed Nation' : 'New Nation');
    this.querySelector('[data-short]')!.textContent = values.short_name ? '(' + values.short_name + ')' : '';
    this.querySelector('[data-id]')!.textContent = '#' + (this.nationId ?? 'AUTO');
    const rarity = this.querySelector<HTMLElement>('[data-rarity]')!;
    rarity.className =
      'rounded px-2.5 py-0.5 text-xs font-medium capitalize ' + (rarityBadgeClass[values.class as RarityClass] ?? '');
    rarity.textContent = values.class;
    const image = this.querySelector<HTMLImageElement>('[data-emoji]')!;
    const emoji = values.emoji_id.trim();
    const url = /^\d{17,20}$/.test(emoji) ? 'https://cdn.discordapp.com/emojis/' + emoji + '.png' : '';
    if (image.getAttribute('src') !== (url || null)) {
      if (url) image.src = url;
      else image.removeAttribute('src');
      image.hidden = !url;
      this.querySelector<HTMLElement>('[data-globe]')!.hidden = !!url;
    }
    const dirty = JSON.stringify(values) !== JSON.stringify(this.original) || this.art.size > 0;
    this.unsaved.update({
      show: dirty || this.saving,
      isSaving: this.saving,
      onReset: () => {
        this.fill(this.original);
        this.art.clear();
        this.querySelectorAll('input[type=file]').forEach((input) => {
          (input as HTMLInputElement).value = '';
        });
        this.sync();
      },
      onSave: () => void this.save(),
    });
  }

  private async readArt(kind: ArtKind, input: HTMLInputElement, label: HTMLElement) {
    const version = (this.artVersions.get(kind) ?? 0) + 1;
    this.artVersions.set(kind, version);
    const file = input.files?.[0];
    this.art.delete(kind);
    if (!file) {
      label.textContent = '';
      this.sync();
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.message('Artwork file must be under 10 MB.');
      this.sync();
      return;
    }
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      if (!this.isConnected || this.artVersions.get(kind) !== version) return;
      this.art.set(kind, { data, name: file.name.replace(/\.[^.]+$/, '') });
      label.textContent = file.name;
      this.sync();
    } catch {
      this.message('Could not read artwork.');
    }
  }

  private async save() {
    if (this.saving) return;
    const values = this.values();
    if (!values.name.trim()) {
      this.message('Nation name is required (1-100 characters).');
      return;
    }
    const catchNames = names(values.catch_names);
    if (this.nationId && !catchNames.length) {
      this.message('At least one catch name is required.');
      return;
    }
    const number = (key: Field) => Math.max(0, Math.floor(Number(values[key]) || 0));
    const parsedNames = catchNames.length ? catchNames : [values.name.trim().toLowerCase()];
    const payload = {
      name: values.name.trim(),
      short_name: values.short_name.trim() || undefined,
      class: values.class,
      emoji_id: values.emoji_id.trim() || undefined,
      credits: values.credits.trim() || undefined,
      attack: number('attack'),
      health: number('health'),
      weight: Math.max(0.01, Number(values.weight) || 10),
      rarity: Math.max(0.01, Number(values.weight) || 10),
      global_caught: number('global_caught'),
      price: number('price'),
      sell_price: number('sell_price'),
      capacity_name: values.capacity_name.trim() || undefined,
      capacity_description: values.capacity_description.trim() || undefined,
      catch_names: parsedNames,
      catching_names: parsedNames,
      translations: names(values.translations),
      regime: values.regime.trim() || undefined,
      economy: values.economy.trim() || undefined,
      wild_card: values.wild_card.trim() || undefined,
      collection_card: values.collection_card.trim() || undefined,
    };
    const generation = this.generation;
    const form = this.querySelector('form')!;
    form.inert = true;
    this.saving = true;
    this.sync();
    try {
      const creating = !this.nationId;
      let id = this.nationId;
      if (id) {
        const result = await updateNation(id, { ...payload, short_name: payload.short_name ?? null });
        if (!result.ok) throw new Error(result.error || 'Could not save nation.');
      } else {
        const result = await createNation({ ...payload, emoji_id: payload.emoji_id ?? '' });
        if (!result.ok) throw new Error(result.error || 'Could not save nation.');
        id = result.value?.id;
        if (!id && this.art.size) {
          this.message('Nation created, but its ID was not returned. Return to the catalog to upload artwork.');
          this.onBack();
          return;
        }
      }
      if (!this.nationId && id && this.art.size) {
        this.nationId = id;
      }
      if (creating && this.art.size && !id)
        throw new Error('Nation created, but its ID was not returned. Open it to upload artwork.');
      if (creating && id) {
        for (const [kind, art] of this.art) {
          const uploaded = await uploadNationArt(id, kind, art.data, art.name);
          if (!uploaded.ok) throw new Error('Nation created, but artwork upload failed. Open the nation to retry.');
        }
      }
      if (generation !== this.generation) return;
      if (creating) {
        this.onBack();
        return;
      }
      this.original = values;
      this.message('Nation details successfully updated.');
    } catch (error) {
      if (generation === this.generation)
        this.message(error instanceof Error ? error.message : 'Could not save nation.');
    } finally {
      this.saving = false;
      if (generation === this.generation) {
        form.inert = false;
        this.sync();
      }
    }
  }

  private async updateCard() {
    if (!this.nationId || this.saving) return;
    this.saving = true;
    this.sync();
    try {
      const values = this.values();
      const result = await updateNationCard(this.nationId, {
        regime: values.regime.trim() || undefined,
        economy: values.economy.trim() || undefined,
      });
      this.message(
        result.ok ? 'Card background and economy icon updated.' : result.error || 'Failed to update card parameters.',
      );
    } catch {
      this.message('Failed to update card parameters.');
    } finally {
      this.saving = false;
      if (this.isConnected) this.sync();
    }
  }

  private async upload(kind: ArtKind) {
    const art = this.art.get(kind);
    if (!this.nationId || !art || this.saving) {
      this.message('Choose artwork first.');
      return;
    }
    this.saving = true;
    this.sync();
    try {
      const result = await uploadNationArt(this.nationId, kind, art.data, art.name);
      if (!result.ok) throw new Error(result.error || 'Artwork upload failed.');
      this.controls.get(kind === 'spawn' ? 'wild_card' : 'collection_card')!.value = result.value?.file || art.name;
      this.art.delete(kind);
      this.message('Artwork uploaded successfully.');
    } catch (error) {
      this.message(error instanceof Error ? error.message : 'Artwork upload failed.');
    } finally {
      this.saving = false;
      if (this.isConnected) this.sync();
    }
  }

  private deleteDialog() {
    if (!this.nationId) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'max-w-md rounded-xl bg-[var(--admin-card)] text-[var(--admin-fg)] p-6 backdrop:bg-black/70';
    const heading = document.createElement('h3');
    heading.textContent = 'Delete Nation?';
    heading.className = 'text-base font-bold';
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2 text-xs my-4';
    const cascade = document.createElement('input');
    cascade.type = 'checkbox';
    cascade.checked = true;
    label.append(cascade, 'Delete associated caught instances');
    const cancel = this.button('Cancel', () => dialog.close());
    const remove = this.button(
      'Delete Nation',
      async () => {
        if (this.saving || !this.nationId) return;
        this.saving = true;
        this.sync();
        cancel.disabled = remove.disabled = true;
        try {
          const result = await deleteNation(this.nationId, cascade.checked);
          if (!result.ok) throw new Error(result.error || 'Failed to delete nation.');
          dialog.close();
          this.onBack();
        } catch (error) {
          this.message(error instanceof Error ? error.message : 'Failed to delete nation.');
          dialog.close();
        } finally {
          this.saving = false;
          if (this.isConnected) this.sync();
        }
      },
      'text-red-400',
    );
    dialog.addEventListener('cancel', (event) => {
      if (this.saving) event.preventDefault();
    });
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.append(heading, label, cancel, remove);
    this.append(dialog);
    dialog.showModal();
  }
}

customElements.define('pnd-nation-edit', NationEdit);
