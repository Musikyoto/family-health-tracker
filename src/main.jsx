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
