const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add merge helper functions before App component
const helperCode = `
const mergeUserLists = (listA: UserType[], listB: UserType[]): UserType[] => {
  const map = new Map<string, UserType>();
  const combined = [...(listA || []), ...(listB || [])];
  
  for (const u of combined) {
    if (!u || !u.username) continue;
    const tName = (u.trustNameGuj || '').trim().toLowerCase();
    const uName = u.username.trim().toLowerCase();
    const key = \`\${tName}::\${uName}\`;
    
    const existing = map.get(key);
    if (!existing) {
      map.set(key, u);
    } else {
      if (u.isVendorRegistered || (u.passwordHash && u.passwordHash !== 'admin123' && existing.passwordHash === 'admin123')) {
        map.set(key, u);
      }
    }
  }
  
  return Array.from(map.values());
};

const mergeLicenseLists = (listA: TrustLicense[], listB: TrustLicense[]): TrustLicense[] => {
  const map = new Map<string, TrustLicense>();
  const combined = [...(listA || []), ...(listB || [])];
  
  for (const l of combined) {
    if (!l || !l.trustNameGuj) continue;
    const key = l.trustNameGuj.trim().toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, l);
    } else {
      if (l.status?.includes('સક્રિય') || l.status?.toLowerCase().includes('active')) {
        map.set(key, l);
      }
    }
  }
  
  return Array.from(map.values());
};

export default function App() {`;

code = code.replace('export default function App() {', helperCode);

// 2. Update syncStorage
code = code.replace(
  "saveSystemMasterToFirebase(data, undefined);",
  "saveSystemMasterToFirebase(data, appUsers);"
);
code = code.replace(
  "saveSystemMasterToFirebase(undefined, data);",
  "saveSystemMasterToFirebase(licenses, data);"
);

// 3. Update initial master load & subscription in useEffect
const oldEffect = `    loadSystemMasterFromFirebase().then(res => {
      if (res) {
        if (res.licenses) {
          setLicenses(res.licenses);
          localStorage.setItem('trust_licenses', JSON.stringify(res.licenses));
        }
        if (res.users) {
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

const newEffect = `    loadSystemMasterFromFirebase().then(res => {
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

if (code.includes(oldEffect)) {
  code = code.replace(oldEffect, newEffect);
  console.log("Updated useEffect system master load & subscribe.");
} else {
  console.log("Could not find exact oldEffect block, trying regex or partial match.");
}

// 4. Update handleLogin remoteMaster check
const oldHandleLoginRemote = `          const remoteMaster = await loadSystemMasterFromFirebase();
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

const newHandleLoginRemote = `          const remoteMaster = await loadSystemMasterFromFirebase();
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

if (code.includes(oldHandleLoginRemote)) {
  code = code.replace(oldHandleLoginRemote, newHandleLoginRemote);
  console.log("Updated handleLogin remote master merge.");
} else {
  console.log("Could not find exact oldHandleLoginRemote block.");
}

// 5. Update DEFAULT_USERS fallback in handleLogin
const oldDefaultFallback = `      if (!matchedUser) {
        const defaultMatch = DEFAULT_USERS.find(u => {
          const uName = (u.username || '').trim().toLowerCase();
          const uPass = (u.passwordHash || '').trim();
          return uName === cleanUser && (uPass === cleanPass || uPass.toLowerCase() === cleanPass.toLowerCase());
        });
        if (defaultMatch) {
          matchedUser = defaultMatch;
        }
      }`;

const newDefaultFallback = `      if (!matchedUser) {
        const defaultMatch = DEFAULT_USERS.find(u => {
          const uName = (u.username || '').trim().toLowerCase();
          const uPass = (u.passwordHash || '').trim();
          const matchesCreds = uName === cleanUser && (uPass === cleanPass || uPass.toLowerCase() === cleanPass.toLowerCase());
          if (!matchesCreds) return false;
          if (loginSelectedTrust && loginSelectedTrust !== 'all' && loginSelectedTrust.trim() !== '') {
            return (u.trustNameGuj || '').trim().toLowerCase() === loginSelectedTrust.trim().toLowerCase();
          }
          return true;
        });
        if (defaultMatch) {
          matchedUser = defaultMatch;
        }
      }`;

if (code.includes(oldDefaultFallback)) {
  code = code.replace(oldDefaultFallback, newDefaultFallback);
  console.log("Updated DEFAULT_USERS fallback in handleLogin.");
} else {
  console.log("Could not find exact oldDefaultFallback block.");
}

fs.writeFileSync('src/App.tsx', code);
