
// This might not be the exact file name, adjust as needed
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeSync, registerSW } from './registerSW';

// Initialize sync system
initializeSync();

// Register service worker
registerSW();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
