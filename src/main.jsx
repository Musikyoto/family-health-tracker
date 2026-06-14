import React from 'react';
import ReactDOM from 'react-dom/client';
import AuthGate from './AuthGate.jsx';
import { capturePendingInviteCode } from './lib/invite.js';
import './index.css';

// Stash any ?join=<code> before React/auth redirects can drop it.
capturePendingInviteCode();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>
);

// Register the service worker in production builds — required for the PWA to be
// installable. Skipped in dev so it doesn't interfere with HMR.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.error('SW registration failed:', err));
  });
}
