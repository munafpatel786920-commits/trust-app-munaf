import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress non-critical Firestore offline connection timeout warnings in sandboxed preview environments
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const msg = String(args[0] || '');
  if (msg.includes('Could not reach Cloud Firestore backend') || msg.includes('Firestore') || msg.includes('offline mode')) {
    return;
  }
  originalWarn(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
