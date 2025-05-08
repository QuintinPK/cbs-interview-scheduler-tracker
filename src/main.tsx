
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker, listenForSWMessages, setupOnlineListener } from './registerSW'

// Register Service Worker
registerServiceWorker();
listenForSWMessages();
setupOnlineListener();

createRoot(document.getElementById("root")!).render(<App />);
