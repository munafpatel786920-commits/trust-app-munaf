// Service Worker and Auto-Update Registration helper

export interface UpdateStatus {
  isOnline: boolean;
  hasUpdate: boolean;
  serverVersion?: string;
}

export function registerServiceWorker(onUpdateFound: () => void) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Check for updates on register
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  onUpdateFound();
                }
              };
            }
          };

          // Check for updates periodically when online
          setInterval(() => {
            if (navigator.onLine) {
              reg.update();
            }
          }, 60000); // check every 60 seconds
        })
        .catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
    });
  }
}

export async function checkServerVersion(): Promise<{ hasNewVersion: boolean; version?: string }> {
  try {
    const localVer = localStorage.getItem('app_installed_version') || '1.0.0';
    const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.version && data.version !== localVer) {
        return { hasNewVersion: true, version: data.version };
      }
    }
  } catch (e) {
    // Offline or network error
  }
  return { hasNewVersion: false };
}

export function reloadToUpdate(newVersion?: string) {
  if (newVersion) {
    localStorage.setItem('app_installed_version', newVersion);
  }
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
  window.location.reload();
}
