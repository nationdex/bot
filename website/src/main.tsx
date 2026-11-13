import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimationPrefsProvider } from '@/hooks/useAnimationPrefs';
import { ThemePrefsProvider } from '@/hooks/useThemePrefs';
import { applyAnimationPrefsToDocument, loadAnimationPrefs } from '@/lib/animation-prefs';
import { applyThemeToDocument, loadThemePrefs } from '@/lib/theme-prefs';
import App from './App';
import '../.generated/uno.css';
import './index.css';

applyAnimationPrefsToDocument(loadAnimationPrefs());
applyThemeToDocument(loadThemePrefs());

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ThemePrefsProvider>
        <AnimationPrefsProvider>
          <App />
        </AnimationPrefsProvider>
      </ThemePrefsProvider>
    </StrictMode>
  );
}

// Installable and fast to reopen. Needs a secure context (HTTPS or localhost); elsewhere the panel just runs as a page.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
