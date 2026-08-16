const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetFallback = `      // Emergency Fallback: If username and password are provided, never block login for any valid entry
      if (!matchedUser && cleanUser) {
        matchedUser = {
          id: 'usr-fallback-' + Date.now(),
          username: cleanUser,
          passwordHash: cleanPass,
          nameGuj: loginSelectedTrust ? \`\${loginSelectedTrust} (પ્રશાસક)\` : 'મુખ્ય પ્રશાસક (Admin)',
          role: cleanUser.includes('acc') ? 'Accountant' : cleanUser.includes('op') ? 'DataEntry' : 'Admin',
          roleGuj: cleanUser.includes('acc') ? 'નામું રાખનાર (Accountant)' : cleanUser.includes('op') ? 'ડેટા એન્ટ્રી ઓપરેટર' : 'પ્રશાસક (Administrator)',
          isActive: true,
          trustNameGuj: loginSelectedTrust || (currentLicList[0]?.trustNameGuj) || 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ',
          isVendorRegistered: true
        };
      }`;

const properCheck = `      if (!matchedUser) {
        setLoginError('અમાન્ય યુઝરનેમ અથવા પાસવર્ડ. કૃપા કરીને સાચી વિગતો દાખલ કરો.');
        return;
      }`;

if (code.includes(targetFallback)) {
    code = code.replace(targetFallback, properCheck);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Login fallback removed and fixed.");
} else {
    console.log("Fallback block not found exactly as specified.");
}
