/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { setLogLevel } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  doc, 
  setDoc, 
  getDoc,
  deleteDoc,
  collection, 
  onSnapshot, 
  getDocs,
  Firestore
} from 'firebase/firestore';

// Configuration loaded from provisioned firebase-applet-config
const firebaseConfig = {
  projectId: "inspired-stratum-652jj",
  appId: "1:280090537452:web:17edc063357bfd5479e4c9",
  apiKey: "AIzaSyD-VRTS4zwngVgQ1-iT8ZexNsQVNLuxWkQ",
  authDomain: "inspired-stratum-652jj.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-gujarattrustacco-ac003f56-224c-4b72-b297-bc19665bbdde",
  storageBucket: "inspired-stratum-652jj.firebasestorage.app",
  messagingSenderId: "280090537452"
};

let app: any = null;
let db: Firestore | null = null;

// Suppress verbose SDK network logs during transient backend connection drops
try {
  setLogLevel('error');
} catch (_) {}

// Determine if the environment is a standalone offline PC Desktop / Electron installation
export const isElectronOfflineApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isElectronAPI = Boolean((window as any).electronAPI);
  const isFileProto = window.location.protocol === 'file:';
  const isElectronUA = navigator.userAgent.toLowerCase().includes('electron');
  return isElectronAPI || isFileProto || isElectronUA;
};

// Check if running in Online Web mode connected to Cloud
export const isOnlineCloudMode = (): boolean => {
  return !isElectronOfflineApp() && typeof navigator !== 'undefined' && navigator.onLine;
};

// Helper to wrap promises with a timeout to prevent hanging when offline or network stalls
const withTimeout = <T>(promise: Promise<T>, ms = 4000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firestore operation timeout')), ms))
  ]);
};

// Initialize Firebase with long polling and suppressed connection warnings for sandboxed iframe environments
try {
  if (!isElectronOfflineApp()) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    try {
      db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      }, firebaseConfig.firestoreDatabaseId);
    } catch (initErr) {
      try {
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
        }, firebaseConfig.firestoreDatabaseId);
      } catch (e2) {
        try {
          db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
        } catch (dbErr) {
          db = getFirestore(app);
        }
      }
    }
  } else {
    console.log("🖥️ Running in PC Offline Desktop Mode. Google Firebase is paused to use local offline PC disk storage.");
  }
} catch (e) {
  // Silent catch for offline mode
}

/**
 * Sanitize trust name or key for Firestore document ID
 */
export const sanitizeFirestoreDocId = (name: string): string => {
  if (!name) return 'default_trust';
  return encodeURIComponent(name.trim().toLowerCase().replace(/[\/\#\?\[\]]/g, '_'));
};

/**
 * Save specific trust collection/dataset to Google Firebase Firestore
 */
export const saveTrustDatasetToFirebase = async (
  trustId: string, 
  datasetKey: string, 
  data: any
): Promise<boolean> => {
  if (!db || isElectronOfflineApp() || !navigator.onLine) {
    return false;
  }
  try {
    const docId = sanitizeFirestoreDocId(trustId);
    const docRef = doc(db, 'trust_records', docId);

    // Strip undefined values which Firebase does not support
    const cleanData = JSON.parse(JSON.stringify(data));

    await withTimeout(setDoc(docRef, {
      [datasetKey]: cleanData,
      last_updated: new Date().toISOString(),
      trust_name: trustId
    }, { merge: true }), 4000);

    return true;
  } catch (err: any) {
    if (err?.message?.includes('offline') || err?.message?.includes('timeout')) {
      console.info(`[Offline sync pending] ${datasetKey} saved locally.`);
    } else {
      console.warn(`Firebase Cloud Save failed for [${datasetKey}]:`, err?.message || err);
    }
    return false;
  }
};

/**
 * Save complete Trust state payload to Google Firebase Firestore
 */
export const saveFullTrustToFirebase = async (
  trustId: string, 
  payload: Record<string, any>
): Promise<boolean> => {
  if (!db || isElectronOfflineApp() || !navigator.onLine) {
    return false;
  }
  try {
    const docId = sanitizeFirestoreDocId(trustId);
    const docRef = doc(db, 'trust_records', docId);
    
    await withTimeout(setDoc(docRef, {
      ...payload,
      last_cloud_sync: new Date().toISOString(),
      trust_name: trustId
    }, { merge: true }), 5000);

    return true;
  } catch (err: any) {
    if (err?.message?.includes('offline') || err?.message?.includes('timeout')) {
      console.info(`[Offline state] Full Trust data saved to local storage.`);
    } else {
      console.warn(`Full Firebase Cloud Sync notice for [${trustId}]:`, err?.message || err);
    }
    return false;
  }
};

/**
 * Load complete Trust state from Google Firebase Firestore
 */
export const loadFullTrustFromFirebase = async (
  trustId: string
): Promise<Record<string, any> | null> => {
  if (!db || isElectronOfflineApp() || !navigator.onLine) {
    return null;
  }
  try {
    const docId = sanitizeFirestoreDocId(trustId);
    const docRef = doc(db, 'trust_records', docId);
    const docSnap = await withTimeout(getDoc(docRef), 4000);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (err: any) {
    if (err?.message?.includes('offline') || err?.message?.includes('timeout')) {
      console.info(`[Offline state] Using local storage for ${trustId}.`);
    } else {
      console.warn(`Firebase Cloud Fetch notice for [${trustId}]:`, err?.message || err);
    }
    return null;
  }
};

/**
 * Save all global system licenses & users to Firestore for instant activation across devices
 */
export const saveSystemMasterToFirebase = async (
  licenses: any[] | undefined,
  users: any[] | undefined
): Promise<boolean> => {
  if (!db || isElectronOfflineApp() || !navigator.onLine) {
    return false;
  }
  try {
    const licRef = doc(db, 'system_master', 'licenses');
    const userRef = doc(db, 'system_master', 'users');

    const promises = [];
    if (licenses) {
      const cleanLicenses = JSON.parse(JSON.stringify(licenses));
      promises.push(setDoc(licRef, { list: cleanLicenses, updated_at: new Date().toISOString() }, { merge: true }));
    }
    if (users) {
      const cleanUsers = JSON.parse(JSON.stringify(users));
      promises.push(setDoc(userRef, { list: cleanUsers, updated_at: new Date().toISOString() }, { merge: true }));
    }

    if (promises.length > 0) {
      await withTimeout(Promise.all(promises), 4000);
    }
    return true;
  } catch (err: any) {
    if (err?.message?.includes('offline') || err?.message?.includes('timeout')) {
      console.info("[Offline state] System master saved to local storage.");
    } else {
      console.warn("Firebase System Master sync notice:", err?.message || err);
    }
    return false;
  }
};

/**
 * Load system master licenses & users from Firebase Firestore
 */
export const loadSystemMasterFromFirebase = async (): Promise<{ licenses: any[]; users: any[] } | null> => {
  if (!db || isElectronOfflineApp() || !navigator.onLine) {
    return null;
  }
  try {
    const licRef = doc(db, 'system_master', 'licenses');
    const userRef = doc(db, 'system_master', 'users');

    const [licSnap, userSnap] = await withTimeout(
      Promise.all([getDoc(licRef), getDoc(userRef)]),
      4000
    );
    
    return {
      licenses: licSnap.exists() ? licSnap.data()?.list || [] : [],
      users: userSnap.exists() ? userSnap.data()?.list || [] : []
    };
  } catch (err: any) {
    if (err?.message?.includes('offline') || err?.message?.includes('timeout')) {
      console.info("[Offline state] Loading system master from local storage.");
    } else {
      console.warn("Firebase System Master notice:", err?.message || err);
    }
    return null;
  }
};

/**
 * Real-time listener for Trust data from Google Firebase Firestore
 */
export const subscribeToTrustFirebase = (
  trustId: string,
  onData: (data: any) => void
): (() => void) => {
  if (!db || isElectronOfflineApp() || !navigator.onLine) {
    return () => {};
  }
  try {
    const docId = sanitizeFirestoreDocId(trustId);
    const docRef = doc(db, 'trust_records', docId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data());
      }
    }, (error) => {
      console.warn("Firebase snapshot listener notice (fallback to local):", error?.message || error);
    });

    return unsubscribe;
  } catch (e) {
    return () => {};
  }
};

export const subscribeToSystemMasterFirebase = (
  onData: (data: { licenses?: any[]; users?: any[] }) => void
): (() => void) => {
  if (!db || isElectronOfflineApp() || !navigator.onLine) {
    return () => {};
  }
  try {
    const licRef = doc(db, 'system_master', 'licenses');
    const userRef = doc(db, 'system_master', 'users');

    let currentLicenses: any[] | undefined;
    let currentUsers: any[] | undefined;

    const unsubLic = onSnapshot(licRef, (snap) => {
      if (snap.exists()) {
        currentLicenses = snap.data()?.list;
        onData({ licenses: currentLicenses, users: currentUsers });
      }
    }, (err) => console.warn("Firebase Licenses listener notice:", err?.message || err));

    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        currentUsers = snap.data()?.list;
        onData({ licenses: currentLicenses, users: currentUsers });
      }
    }, (err) => console.warn("Firebase Users listener notice:", err?.message || err));

    return () => {
      unsubLic();
      unsubUser();
    };
  } catch (e) {
    return () => {};
  }
};

export { db, app };

export const deleteTrustFromFirebase = async (trustName: string): Promise<boolean> => {
  if (!db || isElectronOfflineApp() || !navigator.onLine) {
    return false;
  }
  try {
    const docId = sanitizeFirestoreDocId(trustName);
    const docRef = doc(db, 'trust_records', docId);
    await withTimeout(deleteDoc(docRef), 4000);
    return true;
  } catch (err: any) {
    console.warn("Firebase Trust delete failed:", err?.message || err);
    return false;
  }
};
