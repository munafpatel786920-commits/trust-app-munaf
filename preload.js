import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {

  // Application version
  getAppVersion: () => {
    return ipcRenderer.invoke('get-app-version');
  },

  // Check for updates
  checkForUpdates: () => {
    ipcRenderer.send('check-for-updates');
  },

  // Download update
  downloadUpdate: () => {
    ipcRenderer.send('download-update');
  },

  // Install downloaded update
  installUpdate: () => {
    ipcRenderer.send('install-update');
  },


  // Checking for update
  onCheckingForUpdate: (callback) => {

    const subscription = () => {
      callback();
    };

    ipcRenderer.on(
      'checking-for-update',
      subscription
    );

    return () => {
      ipcRenderer.removeListener(
        'checking-for-update',
        subscription
      );
    };
  },


  // Update available
  onUpdateAvailable: (callback) => {

    const subscription = (event, info) => {
      callback(info);
    };

    ipcRenderer.on(
      'update-available',
      subscription
    );

    return () => {
      ipcRenderer.removeListener(
        'update-available',
        subscription
      );
    };
  },


  // Update not available
  onUpdateNotAvailable: (callback) => {

    const subscription = (event, info) => {
      callback(info);
    };

    ipcRenderer.on(
      'update-not-available',
      subscription
    );

    return () => {
      ipcRenderer.removeListener(
        'update-not-available',
        subscription
      );
    };
  },


  // Download progress
  onDownloadProgress: (callback) => {

    const subscription = (event, progressInfo) => {
      callback(progressInfo);
    };

    ipcRenderer.on(
      'download-progress',
      subscription
    );

    return () => {
      ipcRenderer.removeListener(
        'download-progress',
        subscription
      );
    };
  },


  // Update downloaded
  onUpdateDownloaded: (callback) => {

    const subscription = (event, info) => {
      callback(info);
    };

    ipcRenderer.on(
      'update-downloaded',
      subscription
    );

    return () => {
      ipcRenderer.removeListener(
        'update-downloaded',
        subscription
      );
    };
  },


  // Update error
  onUpdateError: (callback) => {

    const subscription = (event, errorMessage) => {
      callback(errorMessage);
    };

    ipcRenderer.on(
      'update-error',
      subscription
    );

    return () => {
      ipcRenderer.removeListener(
        'update-error',
        subscription
      );
    };
  }

});


window.addEventListener(
  'DOMContentLoaded',
  () => {

    console.log(
      'Charitable Trust Accounting Electron Preload initialized successfully.'
    );

  }
);