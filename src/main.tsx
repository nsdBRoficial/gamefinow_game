import { Buffer } from "buffer";
if (typeof window !== "undefined" && !(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n/i18n';

import { AdminPanel } from './components/AdminPanel.tsx';
import { AboutPage } from './components/AboutPage.tsx';

const path = window.location.pathname;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {path === '/admin' ? <AdminPanel /> : path === '/about' ? <AboutPage onClose={() => window.location.href = '/'} /> : <App />}
  </StrictMode>,
);
