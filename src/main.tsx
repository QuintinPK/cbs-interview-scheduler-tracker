
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker, listenForSWMessages, setupOnlineListener } from './registerSW'

// Register Service Worker
registerServiceWorker();
listenForSWMessages();
setupOnlineListener();

// Create root and render App
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
