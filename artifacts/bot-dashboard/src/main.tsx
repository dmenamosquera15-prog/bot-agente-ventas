import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Cache busting: Force reload when app version changes
const APP_VERSION = "1.0.0";
const LAST_VERSION_KEY = "app_version_" + window.location.hostname;
const lastVersion = localStorage.getItem(LAST_VERSION_KEY);

if (lastVersion && lastVersion !== APP_VERSION) {
  // Version changed - clear all caches and reload
  console.log("App version changed. Clearing caches and reloading...");

  // Clear all localStorage and caches
  if ("caches" in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }

  // Reload with cache busting
  window.location.reload();
}

localStorage.setItem(LAST_VERSION_KEY, APP_VERSION);

// Register service worker with update checking
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      // Check for updates every 30 seconds in production
      setInterval(() => {
        registration.update();
      }, 30000);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
