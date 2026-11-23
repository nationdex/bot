import { useEffect, useState } from 'preact/hooks';
import { admin } from '@/lib/admin-classes';
import { cn } from '@/lib/utils';

type Settings = {
  enabled: boolean;
  allowedOrigins: string[];
  catalogue: Array<{ id: string; repository: string; ref: string; path?: string }>;
};
const defaults: Settings = { enabled: false, allowedOrigins: ['https://extras.nationdex.com'], catalogue: [] };
const field = cn(
  'w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm',
  admin.fg,
);
const action = cn('rounded-lg px-3 py-2 text-sm disabled:opacity-50', admin.fg);

export default function RemoteExtrasSettings() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [message, setMessage] = useState('Loading settings…');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setMessage('Loading settings…');
    fetch('/api/panel/extras/settings', {
      signal: controller.signal,
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Could not load settings.');
        if (controller.signal.aborted) return;
        setSettings(body as Settings);
        setStatus('ready');
        setMessage('');
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Could not load settings.');
      });
    return () => controller.abort();
  }, [attempt]);

  async function save(event: Event) {
    event.preventDefault();
    if (status !== 'ready' || saving) return;
    const origins = settings.allowedOrigins.map((origin) => origin.trim());
    const catalogue = settings.catalogue.map((extra) => ({
      id: extra.id.trim(),
      repository: extra.repository.trim(),
      ref: extra.ref.trim(),
      path: (extra.path ?? '').trim(),
    }));
    try {
      for (const origin of origins) {
        const url = new URL(origin);
        if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password)
          throw new Error('Website origins must be HTTPS addresses without a path.');
      }
      if (new Set(origins).size !== origins.length) throw new Error('Remove duplicate website origins.');
      for (const extra of catalogue) {
        if (
          extra.path &&
          (extra.path.length > 200 ||
            !extra.path
              .split('/')
              .every(
                (segment) =>
                  /^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(segment) && !['.', '..', '.git'].includes(segment.toLowerCase()),
              ))
        )
          throw new Error(
            'Extra folders must be relative paths such as extras/my-extra, without dot segments or .git.',
          );
        if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(extra.id))
          throw new Error('Extra IDs use lowercase letters, numbers and hyphens.');
        if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(extra.repository))
          throw new Error('Repositories use owner/repository, for example nationdex/my-extra.');
        if (!/^[a-f0-9]{40}$/.test(extra.ref))
          throw new Error('Each extra needs its full lowercase 40-character commit SHA.');
      }
      if (new Set(catalogue.map((extra) => extra.id)).size !== catalogue.length)
        throw new Error('Extra IDs must be unique.');
      setSaving(true);
      setMessage('');
      const response = await fetch('/api/panel/extras/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, allowedOrigins: origins, catalogue }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not save settings.');
      setSettings(body.settings);
      setMessage('Remote extras settings saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }
  function updateExtra(index: number, key: 'id' | 'repository' | 'ref' | 'path', value: string) {
    setSettings((previous) => ({
      ...previous,
      catalogue: previous.catalogue.map((extra, i) => (i === index ? { ...extra, [key]: value } : extra)),
    }));
  }
  return (
    <form onSubmit={save} className="space-y-4">
      <fieldset disabled={status !== 'ready' || saving} className="space-y-4 min-w-0 border-0 p-0 m-0">
        <label className={cn('flex items-start gap-3 text-sm font-medium', admin.fg)}>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(event) => setSettings({ ...settings, enabled: event.currentTarget.checked })}
            className="mt-1 h-4 w-4"
          />
          Enable remote extras management
        </label>
        <p className={cn('text-xs', admin.muted)}>
          Approved extras execute with the bot's privileges. Review their source before approval.
        </p>
        <div className="space-y-2">
          <h4 className={cn('text-sm font-medium', admin.fg)}>Allowed websites</h4>
          {settings.allowedOrigins.map((origin, index) => (
            <div key={index} className="flex items-end gap-2">
              <label className={cn('block flex-1 text-xs', admin.fg)}>
                HTTPS origin {index + 1}
                <input
                  className={field}
                  type="url"
                  required
                  value={origin}
                  placeholder="https://extras.nationdex.com"
                  onInput={(event) =>
                    setSettings({
                      ...settings,
                      allowedOrigins: settings.allowedOrigins.map((value, i) =>
                        i === index ? event.currentTarget.value : value,
                      ),
                    })
                  }
                />
              </label>
              <button
                className={action}
                type="button"
                aria-label={`Remove website ${index + 1}`}
                onClick={() =>
                  setSettings({ ...settings, allowedOrigins: settings.allowedOrigins.filter((_, i) => i !== index) })
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className={action}
            type="button"
            disabled={settings.allowedOrigins.length >= 20}
            onClick={() => setSettings({ ...settings, allowedOrigins: [...settings.allowedOrigins, ''] })}
          >
            Add website
          </button>
        </div>
        <div className="space-y-3">
          <h4 className={cn('text-sm font-medium', admin.fg)}>Approved extras</h4>
          {settings.catalogue.map((extra, index) => (
            <div key={index} className="space-y-2 rounded-lg border border-[var(--admin-border)] p-3">
              <label className={cn('block text-xs', admin.fg)}>
                Extra ID
                <input
                  className={field}
                  required
                  value={extra.id}
                  onInput={(event) => updateExtra(index, 'id', event.currentTarget.value)}
                />
              </label>
              <label className={cn('block text-xs', admin.fg)}>
                GitHub repository
                <input
                  className={field}
                  required
                  value={extra.repository}
                  placeholder="owner/repository"
                  onInput={(event) => updateExtra(index, 'repository', event.currentTarget.value)}
                />
              </label>
              <label className={cn('block text-xs', admin.fg)}>
                Folder within repository (optional)
                <input
                  className={field}
                  maxLength={200}
                  value={extra.path ?? ''}
                  placeholder="Leave empty for repository root"
                  onInput={(event) => updateExtra(index, 'path', event.currentTarget.value)}
                />
              </label>
              <label className={cn('block text-xs', admin.fg)}>
                Approved commit SHA
                <input
                  className={cn(field, 'font-mono')}
                  required
                  maxLength={40}
                  value={extra.ref}
                  onInput={(event) => updateExtra(index, 'ref', event.currentTarget.value)}
                />
              </label>
              <button
                className={action}
                type="button"
                aria-label={`Remove approval ${extra.id || index + 1}`}
                onClick={() =>
                  setSettings({ ...settings, catalogue: settings.catalogue.filter((_, i) => i !== index) })
                }
              >
                Remove approval
              </button>
            </div>
          ))}
          <button
            className={action}
            type="button"
            disabled={settings.catalogue.length >= 100}
            onClick={() =>
              setSettings({ ...settings, catalogue: [...settings.catalogue, { id: '', repository: '', ref: '' }] })
            }
          >
            Add approved extra
          </button>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-medium text-[var(--admin-accent-fg)] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save extras settings'}
        </button>
      </fieldset>
      <p role="status" className={cn('text-sm', admin.muted)}>
        {message}
      </p>
      {status === 'error' && (
        <button type="button" className={action} onClick={() => setAttempt((value) => value + 1)}>
          Retry loading settings
        </button>
      )}
    </form>
  );
}
