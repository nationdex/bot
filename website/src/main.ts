import { storage } from '@/lib/storage';
import { applyAnimationPrefsToDocument, loadAnimationPrefs } from '@/lib/animation-prefs';
import { installSessionHeader } from '@/lib/auth';
import { applyThemeToDocument, loadThemePrefs } from '@/lib/theme-prefs';
import './App';
import './styles/utilities.css';
import './index.css';

installSessionHeader();
storage.purge('panel_cache_');
applyAnimationPrefsToDocument(loadAnimationPrefs());
applyThemeToDocument(loadThemePrefs());

const root = document.getElementById('root');
if (root) root.append(document.createElement('pnd-panel-app'));

// Installable and fast to reopen. Needs a secure context (HTTPS or localhost); elsewhere the panel just runs as a page.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
