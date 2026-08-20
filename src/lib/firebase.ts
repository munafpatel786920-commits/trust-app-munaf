/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  deleteDoc, 
  collection, 
  getDocs 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Determine if the environment is a standalone offline PC Desktop / Electron installation
 */
export const isElectronOfflineApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isElectronAPI = Boolean((window as any).electronAPI);
  const isFileProto = window.location.protocol === 'file:';
  const isElectronUA = navigator.userAgent.toLowerCase().includes('electron');
  return isElectronAPI || isFileProto || isElectronUA;
};

/**
 * Check if running in Online Web mode
 */
export const isOnlineCloudMode = (): boolean => {
  return !isElectronOfflineApp() && typeof navigator !== 'undefined' && navigator.onLine;
};

let appInstance: any = null;
let dbInstance: any = null;

/**
 * Get or initialize Firestore database client (only in online web environments)
 */
export const getFirestoreDb = () => {
  if (isElectronOfflineApp()) {
    return null;
  }
  if (!dbInstance) {
    try {
      if (!getApps().length) {
        appInstance = initializeApp(firebaseConfig);
      } else {
        appInstance = getApp();
      }
      // Initialize with auto-detect long polling for maximum reliability across cloud runners & web previews
      dbInstance = initializeFirestore(appInstance, {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      }, (firebaseConfig as any).firestoreDatabaseId);
    } catch (err) {
      try {
        dbInstance = getFirestore(appInstance, (firebaseConfig as any).firestoreDatabaseId);
      } catch (fallbackErr) {
        console.warn("Firestore initialization notice:", fallbackErr);
      }
    }
  }
  return dbInstance;
};

export const app = appInstance;
export const db = dbInstance;

/**
 * Sanitize trust name or key for document IDs
 */
export const sanitizeFirestoreDocId = (name: string): string => {
  if (!name) return 'default_trust';
  const cleaned = name.trim().replace(/[\/\#\?\[\]\s\:\*\"\|\<\>]+/g, '_');
  return cleaned || 'default_trust';
};

/**
 * Test Cloud connection to Firebase Firestore
 */
export const testFirebaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (isElectronOfflineApp()) {
    return { success: true, message: 'તમે પીસી ઑફલાઇન ડેસ્કટોપ મોડમાં છો. ડેટા લોકલ પીસીમાં સુરક્ષિત છે.' };
  }
  const db = getFirestoreDb();
  if (!db) {
    return { success: false, message: 'ફાયરબેઝ ડેટાબેઝ ક્લાયન્ટ શરૂ થઈ શક્યું નથી.' };
  }
  try {
    const testDocRef = doc(db, 'system', 'connection_test');
    await setDoc(testDocRef, {
      lastTestedAt: new Date().toISOString(),
      status: 'active',
      client: 'Web Cloud Deployment'
    }, { merge: true });
    return { success: true, message: 'Google Firebase Firestore સાથે સુરક્ષિત કનેક્શન સફળ થયું છે!' };
  } catch (err: any) {
    console.error('Firebase test connection error:', err);
    return { success: false, message: err?.message || 'કનેક્શન નિષ્ફળ થયું.' };
  }
};

/**
 * Save specific trust dataset / slice to Firebase Firestore
 */
export const saveTrustDatasetToFirebase = async (
  trustId: string, 
  datasetKey: string, 
  data: any
): Promise<boolean> => {
  if (isElectronOfflineApp() || !isOnlineCloudMode()) return false;
  const db = getFirestoreDb();
  if (!db) return false;
  try {
    const sanitizedId = sanitizeFirestoreDocId(trustId);
    const docRef = doc(db, 'trusts', sanitizedId);
    await setDoc(docRef, {
      [datasetKey]: data,
      last_updated: new Date().toISOString(),
      trust_name: trustId
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn(`[Firebase] Error saving dataset [${datasetKey}]:`, err);
    return false;
  }
};

/**
 * Save complete Trust state payload to Firebase Firestore
 */
export const saveFullTrustToFirebase = async (
  trustId: string, 
  payload: Record<string, any>
): Promise<boolean> => {
  if (isElectronOfflineApp() || !isOnlineCloudMode()) return false;
  const db = getFirestoreDb();
  if (!db) return false;
  try {
    const sanitizedId = sanitizeFirestoreDocId(trustId);
    const docRef = doc(db, 'trusts', sanitizedId);
    await setDoc(docRef, {
      ...payload,
      last_updated: new Date().toISOString(),
      trust_name: trustId
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn(`[Firebase] Error saving full trust [${trustId}]:`, err);
    return false;
  }
};

/**
 * Reset a trust record in Firebase Firestore
 */
export const resetTrustInFirebase = async (
  trustId: string,
  emptyPayload: Record<string, any>
): Promise<boolean> => {
  if (isElectronOfflineApp() || !isOnlineCloudMode()) return false;
  const db = getFirestoreDb();
  if (!db) return false;
  try {
    const sanitizedId = sanitizeFirestoreDocId(trustId);
    const docRef = doc(db, 'trusts', sanitizedId);
    await setDoc(docRef, {
      ...emptyPayload,
      last_updated: new Date().toISOString(),
      trust_name: trustId,
      is_reset: true
    });
    return true;
  } catch (err) {
    console.warn(`[Firebase] Error resetting trust [${trustId}]:`, err);
    return false;
  }
};

/**
 * Load complete Trust state from Firebase Firestore
 */
export const loadFullTrustFromFirebase = async (
  trustId: string
): Promise<Record<string, any> | null> => {
  if (isElectronOfflineApp() || !isOnlineCloudMode()) return null;
  const db = getFirestoreDb();
  if (!db) return null;
  try {
    const sanitizedId = sanitizeFirestoreDocId(trustId);
    const docRef = doc(db, 'trusts', sanitizedId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn(`[Firebase] Error loading full trust [${trustId}]:`, err);
    return null;
  }
};

/**
 * Save all global system licenses & users to Firebase Firestore
 */
export const saveSystemMasterToFirebase = async (
  licenses: any[] | undefined,
  users: any[] | undefined
): Promise<boolean> => {
  if (isElectronOfflineApp() || !isOnlineCloudMode()) return false;
  const db = getFirestoreDb();
  if (!db) return false;
  try {
    const docRef = doc(db, 'system', 'master');
    const updateData: Record<string, any> = {
      last_updated: new Date().toISOString()
    };
    if (licenses !== undefined) updateData.licenses = licenses;
    if (users !== undefined) updateData.users = users;
    await setDoc(docRef, updateData, { merge: true });
    return true;
  } catch (err) {
    console.warn("[Firebase] Error saving system master:", err);
    return false;
  }
};

/**
 * Load system master licenses & users from Firebase Firestore
 */
export const loadSystemMasterFromFirebase = async (): Promise<{ licenses: any[]; users: any[] } | null> => {
  if (isElectronOfflineApp() || !isOnlineCloudMode()) return null;
  const db = getFirestoreDb();
  if (!db) return null;
  try {
    const docRef = doc(db, 'system', 'master');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        licenses: data.licenses || [],
        users: data.users || []
      };
    }
    return null;
  } catch (err) {
    console.warn("[Firebase] Error loading system master:", err);
    return null;
  }
};

/**
 * Real-time listener for Trust data from Firebase Firestore
 */
export const subscribeToTrustFirebase = (
  trustId: string,
  onData: (data: any) => void
): (() => void) => {
  if (isElectronOfflineApp() || !isOnlineCloudMode()) return () => {};
  const db = getFirestoreDb();
  if (!db) return () => {};
  try {
    const sanitizedId = sanitizeFirestoreDocId(trustId);
    const docRef = doc(db, 'trusts', sanitizedId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data());
      }
    }, (error) => {
      console.warn(`[Firebase] Live subscription notice for trust [${trustId}]:`, error.message);
    });
    return unsubscribe;
  } catch (err) {
    console.warn(`[Firebase] Could not subscribe to trust [${trustId}]:`, err);
    return () => {};
  }
};

/**
 * Real-time listener for System Master (licenses & users) from Firebase Firestore
 */
export const subscribeToSystemMasterFirebase = (
  onData: (data: { licenses?: any[]; users?: any[] }) => void
): (() => void) => {
  if (isElectronOfflineApp() || !isOnlineCloudMode()) return () => {};
  const db = getFirestoreDb();
  if (!db) return () => {};
  try {
    const docRef = doc(db, 'system', 'master');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data());
      }
    }, (error) => {
      console.warn("[Firebase] Live subscription notice for system master:", error.message);
    });
    return unsubscribe;
  } catch (err) {
    console.warn("[Firebase] Could not subscribe to system master:", err);
    return () => {};
  }
};

/**
 * Delete a trust completely from Firebase Firestore
 */
export const deleteTrustFromFirebase = async (trustName: string): Promise<boolean> => {
  if (isElectronOfflineApp() || !isOnlineCloudMode()) return false;
  const db = getFirestoreDb();
  if (!db) return false;
  try {
    const sanitizedId = sanitizeFirestoreDocId(trustName);
    const docRef = doc(db, 'trusts', sanitizedId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn(`[Firebase] Error deleting trust [${trustName}]:`, err);
    return false;
  }
};
