import { useEffect, useState } from 'preact/hooks';
import { admin } from '@/lib/admin-classes';
import { cn } from '@/lib/utils';

type Settings = { enabled: boolean; allowedOrigins: string[]; catalogue: Array<{ id: string; repository: string; ref: string }> };
const defaults: Settings = { enabled: false, allowedOrigins: ['https://extras.nationdex.com'], catalogue: [] };
const field = cn('w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 font-mono text-xs', admin.fg);

export default function RemoteExtrasSettings() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [origins, setOrigins] = useState(JSON.stringify(defaults.allowedOrigins, null, 2));
  const [catalogue, setCatalogue] = useState(JSON.stringify(defaults.catalogue, null, 2));
  const [message, setMessage] = useState('Loading settings…');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/panel/extras/settings', { credentials: 'include', headers: { Accept: 'application/json' } })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Could not load settings.');
        if (!active) return;
        const value = body as Settings;
        setSettings(value);
        setOrigins(JSON.stringify(value.allowedOrigins, null, 2));
        setCatalogue(JSON.stringify(value.catalogue, null, 2));
        setMessage('Only the panel owner can change these settings.');
      })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : 'Could not load settings.'); });
    return () => { active = false; };
  }, []);

  async function save(event: Event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const allowedOrigins = JSON.parse(origins);
      const approved = JSON.parse(catalogue);
      const response = await fetch('/api/panel/extras/settings', {
        method: 'PUT', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, allowedOrigins, catalogue: approved }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not save settings.');
      setSettings(body.settings);
      setOrigins(JSON.stringify(body.settings.allowedOrigins, null, 2));
      setCatalogue(JSON.stringify(body.settings.catalogue, null, 2));
      setMessage('Remote extras settings saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Check that both fields contain valid JSON.');
    } finally { setSaving(false); }
  }

  return <form onSubmit={save} className="space-y-4">
    <div className="flex items-start gap-3">
      <input id="extras-enabled" type="checkbox" checked={settings.enabled} onChange={(event) => setSettings({ ...settings, enabled: (event.currentTarget as HTMLInputElement).checked })} className="mt-1 h-4 w-4 accent-[var(--admin-accent)]" />
      <div><label for="extras-enabled" className={cn('text-sm font-medium', admin.fg)}>Enable remote extras management</label>
        <p className={cn('mt-1 text-xs', admin.muted)}>Allows the Nationdex index to list, install, and remove host-approved extras. Installed extras execute with the bot process's privileges.</p></div>
    </div>
    <label className={cn('block text-xs font-medium', admin.fg)}>Allowed website origins <textarea className={cn(field, 'mt-1 min-h-20')} value={origins} onInput={(event) => setOrigins((event.currentTarget as HTMLTextAreaElement).value)} spellcheck={false} /></label>
    <label className={cn('block text-xs font-medium', admin.fg)}>Host-approved extras <textarea className={cn(field, 'mt-1 min-h-36')} value={catalogue} onInput={(event) => setCatalogue((event.currentTarget as HTMLTextAreaElement).value)} spellcheck={false} /></label>
    <p className={cn('text-xs', admin.muted)}>Each entry must use an extra ID, a GitHub <code>owner/repository</code>, and a full 40-character commit SHA. Approval here is required even when an extra appears in the public index.</p>
    <div className="flex items-center gap-3"><button type="submit" disabled={saving} className="rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-medium text-[var(--admin-accent-fg)] disabled:opacity-50">{saving ? 'Saving…' : 'Save extras settings'}</button><span role="status" className={cn('text-xs', admin.muted)}>{message}</span></div>
  </form>;
}
