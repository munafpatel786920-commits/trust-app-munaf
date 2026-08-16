const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

const targetFirebase = `export const saveSystemMasterToFirebase = async (
  licenses: any[],
  users: any[]
): Promise<boolean> => {
  if (!db || isElectronOfflineApp() || !navigator.onLine) {
    return false;
  }
  try {
    const licRef = doc(db, 'system_master', 'licenses');
    const userRef = doc(db, 'system_master', 'users');

    const cleanLicenses = JSON.parse(JSON.stringify(licenses));
    const cleanUsers = JSON.parse(JSON.stringify(users));

    await withTimeout(Promise.all([
      setDoc(licRef, { list: cleanLicenses, updated_at: new Date().toISOString() }, { merge: true }),
      setDoc(userRef, { list: cleanUsers, updated_at: new Date().toISOString() }, { merge: true })
    ]), 4000);`;

const replacementFirebase = `export const saveSystemMasterToFirebase = async (
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
    }`;

code = code.replace(targetFirebase, replacementFirebase);
fs.writeFileSync('src/lib/firebase.ts', code);

let appCode = fs.readFileSync('src/App.tsx', 'utf-8');

const targetApp = `      if (key === 'trust_licenses') {
        saveSystemMasterToFirebase(data, appUsers);
      } else if (key === 'trust_users') {
        saveSystemMasterToFirebase(licenses, data);
      }`;
const replacementApp = `      if (key === 'trust_licenses') {
        saveSystemMasterToFirebase(data, undefined);
      } else if (key === 'trust_users') {
        saveSystemMasterToFirebase(undefined, data);
      }`;
appCode = appCode.replace(targetApp, replacementApp);
fs.writeFileSync('src/App.tsx', appCode);

