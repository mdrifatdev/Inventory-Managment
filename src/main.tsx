/**
 * এন্ট্রি পয়েন্ট | App entry point
 * Capacitor এ MemoryRouter ব্যবহার করে (file:// প্রোটোকলে BrowserRouter কাজ করে না)
 * ওয়েবে BrowserRouter ব্যবহার করে
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import App from './App.tsx';
import './index.css';

const Router = Capacitor.isNativePlatform() ? MemoryRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
);
