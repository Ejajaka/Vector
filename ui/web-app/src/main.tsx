import {createRoot} from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <Analytics />
  </>
);

// Offline shell: production only, so development never serves stale modules.
// The deterministic wireframe engine needs no network or model; this makes the
// app itself openable offline after the first visit.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { updateViaCache: 'none' })
      .catch(() => undefined);
  });
}
