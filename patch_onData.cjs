const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf-8');

const targetSub = `    const unsubMaster = subscribeToSystemMasterFirebase((data) => {
      if (data.licenses && data.licenses.length > 0) {
        setLicenses(data.licenses);
        localStorage.setItem('trust_licenses', JSON.stringify(data.licenses));
      }
      if (data.users && data.users.length > 0) {
        setAppUsers(data.users);
        localStorage.setItem('trust_users', JSON.stringify(data.users));
      }
    });`;

const replacementSub = `    const unsubMaster = subscribeToSystemMasterFirebase((data) => {
      if (data.licenses) {
        setLicenses(data.licenses);
        localStorage.setItem('trust_licenses', JSON.stringify(data.licenses));
      }
      if (data.users) {
        setAppUsers(data.users);
        localStorage.setItem('trust_users', JSON.stringify(data.users));
      }
    });`;

appCode = appCode.replace(targetSub, replacementSub);
fs.writeFileSync('src/App.tsx', appCode);
