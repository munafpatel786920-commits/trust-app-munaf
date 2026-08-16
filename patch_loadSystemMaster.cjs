const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf-8');

const targetLoad = `    loadSystemMasterFromFirebase().then(res => {
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
    })`;

const replacementLoad = `    loadSystemMasterFromFirebase().then(res => {
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
    })`;

appCode = appCode.replace(targetLoad, replacementLoad);
fs.writeFileSync('src/App.tsx', appCode);
