/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  getDocs, 
  enableIndexedDbPersistence,
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

// Initialize Firebase only for online web/browser mode or when available
try {
  if (!isElectronOfflineApp()) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    try {
      // Initialize with provisioned database ID
      db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } catch (dbErr) {
      // Fallback to default database if named database throws
      console.warn("Initializing default Firestore instance:", dbErr);
      db = getFirestore(app);
    }
  } else {
    console.log("🖥️ Running in PC Offline Desktop Mode. Google Firebase is paused to use local offline PC disk storage.");
  }
} catch (e) {
  console.warn("Firebase initialization warning (fallback to local PC storage):", e);
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
    
    await setDoc(docRef, {
      [datasetKey]: data,
      last_updated: new Date().toISOString(),
      trust_name: trustId
    }, { merge: true });

    return true;
  } catch (err) {
    console.error(`Firebase Cloud Save failed for [${datasetKey}]:`, err);
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
    
    await setDoc(docRef, {
      ...payload,
      last_cloud_sync: new Date().toISOString(),
      trust_name: trustId
    }, { merge: true });

    return true;
  } catch (err) {
    console.error(`Full Firebase Cloud Sync failed for [${trustId}]:`, err);
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
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (err) {
    console.error(`Firebase Cloud Fetch failed for [${trustId}]:`, err);
    return null;
  }
};

/**
 * Save all global system licenses & users to Firestore for instant activation across devices
 */
export const saveSystemMasterToFirebase = async (
  licenses: any[],
  users: any[]
): Promise<boolean> => {
  if (!db || isElectronOfflineApp() || !navigator.onLine) {
    return false;
  }
  try {
    const licRef = doc(db, 'system_master', 'licenses');
    const userRef = doc(db, 'system_master', 'users');

    await Promise.all([
      setDoc(licRef, { list: licenses, updated_at: new Date().toISOString() }, { merge: true }),
      setDoc(userRef, { list: users, updated_at: new Date().toISOString() }, { merge: true })
    ]);
    return true;
  } catch (err) {
    console.error("Firebase System Master sync failed:", err);
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

    const [licSnap, userSnap] = await Promise.all([getDoc(licRef), getDoc(userRef)]);
    
    return {
      licenses: licSnap.exists() ? licSnap.data()?.list || [] : [],
      users: userSnap.exists() ? userSnap.data()?.list || [] : []
    };
  } catch (err) {
    console.error("Firebase System Master load failed:", err);
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
      console.warn("Firebase snapshot listener error:", error);
    });

    return unsubscribe;
  } catch (e) {
    console.error("Subscribe to Firebase failed:", e);
    return () => {};
  }
};

export { db, app };
