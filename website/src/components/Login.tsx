import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { admin } from '@/lib/admin-classes';
import { cookiesBlocked, fetchAuthStatus, login, setupPassword, type PanelUser } from '@/lib/auth';
import { bot } from '@/lib/bot';
import { cn } from '@/lib/utils';

export default function Login({ onSuccess }: { onSuccess: (user?: PanelUser) => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuthStatus()
      .then((s) => setNeedsSetup(s.needsSetup))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = needsSetup
      ? await setupPassword(password, username, 'Panel Owner')
      : await login(password, username);

    setSubmitting(false);
    if (result.ok) {
      onSuccess(result.user);
      return;
    }
    setError(result.error ?? 'Sign in failed.');
  };

  return (
    <div className={cn('flex h-full items-center justify-center overflow-y-auto p-4', admin.shell)}>
      <div className={cn('w-full max-w-sm rounded-2xl p-6 bg-[var(--admin-card)]', admin.panel)}>
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" />
          <div className="min-w-0">
            <h1 className={cn('truncate text-lg font-semibold', admin.fg)}>{bot.name}</h1>
            <p className={cn('text-xs', admin.muted)}>
              {needsSetup ? 'Create panel owner account' : 'Panel sign in'}
            </p>
          </div>
        </div>
        {loading ? (
          <p className={cn('text-sm', admin.muted)}>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {cookiesBlocked() && (
              <p className={cn('rounded-lg px-3 py-2 text-xs', admin.elevated, admin.muted)}>
                Cookies are blocked in this browser. You can still sign in, but the session lasts only until you reload or close this tab.
              </p>
            )}
            <div>
              <label
                htmlFor="admin-username"
                className={cn('mb-1.5 block text-xs font-medium', admin.muted)}
              >
                Username
              </label>
              <Input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={cn('bg-[var(--admin-elevated)] text-[var(--admin-fg)] focus:ring-0', admin.input)}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className={cn('mb-1.5 block text-xs font-medium', admin.muted)}
              >
                Password
              </label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn('bg-[var(--admin-elevated)] text-[var(--admin-fg)] focus:ring-0', admin.input)}
                autoComplete={needsSetup ? 'new-password' : 'current-password'}
                required
                minLength={4}
              />
            </div>

            {needsSetup ? (
              <p className={cn('text-xs text-[var(--admin-muted)]')}>
                Initial setup: create your owner account credentials.
              </p>
            ) : null}

            {error ? <p className="text-xs text-rose-400 font-medium">{error}</p> : null}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[var(--admin-accent)] text-[var(--admin-accent-fg)] hover:opacity-90 transition-opacity font-medium"
            >
              {needsSetup ? 'Create owner account' : 'Sign in'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}