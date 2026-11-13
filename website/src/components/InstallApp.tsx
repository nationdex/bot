import { useEffect, useState } from 'react';
import { Download } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { admin } from '@/lib/admin-classes';
import { cn } from '@/lib/utils';

// Chromium, Edge and Samsung Internet offer a real install prompt; Safari (iOS and macOS), Firefox and the rest
// install from their own menu, so those get written instructions instead of a button.
type InstallPrompt = Event & { prompt: () => Promise<void> };

const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone), (display-mode: window-controls-overlay), (display-mode: minimal-ui)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isApple = (): boolean => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  let text: string;
  if (installed) text = 'You are using the installed app.';
  else if (!window.isSecureContext) text = 'Installing needs HTTPS (or localhost). Open the panel through a secure address to install it.';
  else if (prompt) text = 'Install the panel as an app with its own window and icon.';
  else if (isApple()) text = 'In Safari, tap Share, then "Add to Home Screen" (on a Mac: File, then "Add to Dock").';
  else text = 'Use your browser menu: "Install app" or "Add to Home screen".';

  return (
    <Card className={cn(admin.card, 'overflow-hidden')}>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <Download className={cn('mt-0.5 h-4 w-4 shrink-0', admin.muted)} />
          <div className="min-w-0">
            <h3 className={cn('text-sm font-medium', admin.muted)}>Install app</h3>
            <p className={cn('mt-1 text-xs', admin.muted)}>{text}</p>
          </div>
        </div>
        {prompt && !installed && (
          <button
            type="button"
            onClick={async () => {
              await prompt.prompt();
              setPrompt(null);
            }}
            className="shrink-0 cursor-pointer rounded-lg bg-[var(--admin-accent)] px-3 py-1.5 text-xs font-medium text-[var(--admin-accent-fg)]"
          >
            Install
          </button>
        )}
      </CardContent>
    </Card>
  );
}
