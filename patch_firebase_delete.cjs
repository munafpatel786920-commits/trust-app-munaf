const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

// add deleteDoc import
code = code.replace(/getDoc,\s*collection,/g, 'getDoc,\n  deleteDoc,\n  collection,');

// add delete function at the end
code += `
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
`;

fs.writeFileSync('src/lib/firebase.ts', code);
