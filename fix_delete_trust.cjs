const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Remove mergeLicenseLists and mergeUserLists helpers or clean up useEffect
// Update syncStorage
code = code.replace(
  "saveSystemMasterToFirebase(data, appUsers);",
  "saveSystemMasterToFirebase(data, undefined);"
);
code = code.replace(
  "saveSystemMasterToFirebase(licenses, data);",
  "saveSystemMasterToFirebase(undefined, data);"
);

// 2. Update initial system master load & real-time subscription in useEffect
const oldEffectTarget = `    loadSystemMasterFromFirebase().then(res => {
      if (res) {
        if (res.licenses && res.licenses.length > 0) {
          setLicenses(prev => {
            const merged = mergeLicenseLists(prev, res.licenses);
            localStorage.setItem('trust_licenses', JSON.stringify(merged));
            return merged;
          });
        }
        if (res.users && res.users.length > 0) {
          setAppUsers(prev => {
            const merged = mergeUserLists(prev, res.users);
            localStorage.setItem('trust_users', JSON.stringify(merged));
            return merged;
          });
        }
      }
    }).catch(e => console.warn("Initial system master fetch:", e));

    // Subscribe to live changes
    const unsubMaster = subscribeToSystemMasterFirebase((data) => {
      if (data.licenses && data.licenses.length > 0) {
        setLicenses(prev => {
          const merged = mergeLicenseLists(prev, data.licenses);
          localStorage.setItem('trust_licenses', JSON.stringify(merged));
          return merged;
        });
      }
      if (data.users && data.users.length > 0) {
        setAppUsers(prev => {
          const merged = mergeUserLists(prev, data.users);
          localStorage.setItem('trust_users', JSON.stringify(merged));
          return merged;
        });
      }
    });`;

const newEffectReplacement = `    loadSystemMasterFromFirebase().then(res => {
      if (res) {
        if (res.licenses && res.licenses.length > 0) {
          setLicenses(res.licenses);
          localStorage.setItem('trust_licenses', JSON.stringify(res.licenses));
        }
        if (res.users && res.users.length > 0) {
          setAppUsers(res.users);
          localStorage.setItem('trust_users', JSON.stringify(res.users));
        }
      }
    }).catch(e => console.warn("Initial system master fetch:", e));

    // Subscribe to live changes
    const unsubMaster = subscribeToSystemMasterFirebase((data) => {
      if (data.licenses) {
        setLicenses(data.licenses);
        localStorage.setItem('trust_licenses', JSON.stringify(data.licenses));
      }
      if (data.users) {
        setAppUsers(data.users);
        localStorage.setItem('trust_users', JSON.stringify(data.users));
      }
    });`;

if (code.includes(oldEffectTarget)) {
  code = code.replace(oldEffectTarget, newEffectReplacement);
  console.log("Replaced useEffect system master load & subscribe.");
} else {
  console.log("Could not find oldEffectTarget, checking alternative pattern...");
}

// 3. Update handleLogin remote master check
const oldLoginRemote = `          const remoteMaster = await loadSystemMasterFromFirebase();
          if (remoteMaster) {
            if (remoteMaster.licenses && remoteMaster.licenses.length > 0) {
              currentLicList = mergeLicenseLists(licenses, remoteMaster.licenses);
              setLicenses(currentLicList);
              localStorage.setItem('trust_licenses', JSON.stringify(currentLicList));
            }
            if (remoteMaster.users && remoteMaster.users.length > 0) {
              currentUserList = mergeUserLists(appUsers, remoteMaster.users);
              setAppUsers(currentUserList);
              localStorage.setItem('trust_users', JSON.stringify(currentUserList));
            }
          }`;

const newLoginRemote = `          const remoteMaster = await loadSystemMasterFromFirebase();
          if (remoteMaster) {
            if (remoteMaster.licenses && remoteMaster.licenses.length > 0) {
              currentLicList = remoteMaster.licenses;
              setLicenses(remoteMaster.licenses);
              localStorage.setItem('trust_licenses', JSON.stringify(remoteMaster.licenses));
            }
            if (remoteMaster.users && remoteMaster.users.length > 0) {
              currentUserList = remoteMaster.users;
              setAppUsers(remoteMaster.users);
              localStorage.setItem('trust_users', JSON.stringify(remoteMaster.users));
            }
          }`;

if (code.includes(oldLoginRemote)) {
  code = code.replace(oldLoginRemote, newLoginRemote);
  console.log("Replaced handleLogin remote master check.");
} else {
  console.log("Could not find oldLoginRemote");
}

// 4. Update handleDeleteLicense
const oldDeleteLicense = `  const handleDeleteLicense = (id: string) => {
    const target = licenses.find(l => l.id === id);
    const targetTrustName = target?.trustNameGuj;

    // 1. Remove from licenses list
    const updatedLicenses = licenses.filter(l => l.id !== id);
    setLicenses(updatedLicenses);
    syncStorage('trust_licenses', updatedLicenses);

    if (targetTrustName) {
      // Delete entirely from Firebase Cloud
      deleteTrustFromFirebase(targetTrustName).catch(e => console.warn(e));
      
      // 2. Remove all users belonging to this deleted trust
      const updatedUsers = appUsers.filter(
        u => u.trustNameGuj !== targetTrustName
      );
      setAppUsers(updatedUsers);
      syncStorage('trust_users', updatedUsers);`;

const newDeleteLicense = `  const handleDeleteLicense = (id: string) => {
    const target = licenses.find(l => l.id === id);
    const targetTrustName = target?.trustNameGuj;

    // 1. Remove from licenses list
    const updatedLicenses = licenses.filter(l => l.id !== id);
    setLicenses(updatedLicenses);
    localStorage.setItem('trust_licenses', JSON.stringify(updatedLicenses));

    let updatedUsers = appUsers;
    if (targetTrustName) {
      // 2. Remove all users belonging to this deleted trust
      updatedUsers = appUsers.filter(
        u => (u.trustNameGuj || '').trim() !== targetTrustName.trim()
      );
      setAppUsers(updatedUsers);
      localStorage.setItem('trust_users', JSON.stringify(updatedUsers));

      // Delete entirely from Firebase Cloud
      deleteTrustFromFirebase(targetTrustName).catch(e => console.warn(e));
    }

    // Direct save system master (both licenses and users) to Firebase
    saveSystemMasterToFirebase(updatedLicenses, updatedUsers);`;

if (code.includes(oldDeleteLicense)) {
  code = code.replace(oldDeleteLicense, newDeleteLicense);
  console.log("Replaced handleDeleteLicense.");
} else {
  console.log("Could not find oldDeleteLicense.");
}

fs.writeFileSync('src/App.tsx', code);
