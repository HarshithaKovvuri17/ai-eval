import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Suppress the harmless "ResizeObserver loop" false-positive that
// triggers the CRA dev-server error overlay unnecessarily.
const _originalError = window.onerror;
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation();
    const overlay = document.getElementById('webpack-dev-server-client-overlay');
    const overlayDiv = document.getElementById('webpack-dev-server-client-overlay-div');
    if (overlay) overlay.style.display = 'none';
    if (overlayDiv) overlayDiv.style.display = 'none';
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
