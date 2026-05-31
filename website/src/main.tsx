import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimationPrefsProvider } from '@/hooks/useAnimationPrefs';
import { applyAnimationPrefsToDocument, loadAnimationPrefs } from '@/lib/animation-prefs';
import App from './App';
import './index.css';

applyAnimationPrefsToDocument(loadAnimationPrefs());

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <AnimationPrefsProvider>
        <App />
      </AnimationPrefsProvider>
    </StrictMode>
  );
}
