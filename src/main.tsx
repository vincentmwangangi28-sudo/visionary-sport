import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";
import App from "./App.tsx";
import "./index.css";

// Vercel analytics
inject();
injectSpeedInsights();

// Register service worker for offline support + asset caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        // Check for updates every hour
        setInterval(() => reg.update(), 60 * 60 * 1000);
      })
      .catch(err => console.warn('SW registration failed:', err));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
