const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// handleCreateInitialTrust
code = code.replace(
  "localStorage.setItem('trust_users', JSON.stringify(updatedUsers));\\n\\n    localStorage.setItem('trust_activated', 'true');",
  "syncStorage('trust_users', updatedUsers);\\n\\n    localStorage.setItem('trust_activated', 'true');"
);

// Another initialization
code = code.replace(
  "localStorage.setItem('trust_users', JSON.stringify(curUsers));\\n\\n    // 3. Mark app as ready",
  "syncStorage('trust_users', curUsers);\\n\\n    // 3. Mark app as ready"
);

// handleAddUser
code = code.replace(
  "localStorage.setItem('trust_users', JSON.stringify(updated));\\n\\n    addAuditLog(\\n      'નવો વપરાશકર્તા ઉમેર્યો'",
  "syncStorage('trust_users', updated);\\n\\n    addAuditLog(\\n      'નવો વપરાશકર્તા ઉમેર્યો'"
);

// handleEditUser
code = code.replace(
  "localStorage.setItem('trust_users', JSON.stringify(updated));\\n\\n    // Update current session user",
  "syncStorage('trust_users', updated);\\n\\n    // Update current session user"
);

// handleDeleteUser
code = code.replace(
  "localStorage.setItem('trust_users', JSON.stringify(updated));\\n\\n    addAuditLog(\\n      'વપરાશકર્તા રદ કરવામાં આવ્યો'",
  "syncStorage('trust_users', updated);\\n\\n    addAuditLog(\\n      'વપરાશકર્તા રદ કરવામાં આવ્યો'"
);

// handleAddLicense
code = code.replace(
  "localStorage.setItem('trust_users', JSON.stringify(updatedUsers));\\n\\n      // Auto set form fields",
  "syncStorage('trust_users', updatedUsers);\\n\\n      // Auto set form fields"
);

fs.writeFileSync('src/App.tsx', code);
