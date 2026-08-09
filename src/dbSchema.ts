/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SQLiteTable {
  name: string;
  description: string;
  sql: string;
}

export const SQLITE_TABLES: SQLiteTable[] = [
  {
    name: 'users',
    description: 'વપરાશકર્તાઓની માહિતી અને પરવાનગીઓની વિગતો (User profiles and role-based access control)',
    sql: `CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name_guj TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('Admin', 'Accountant', 'DataEntry', 'ReadOnly')),
  password_hash TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    name: 'donors',
    description: 'દાતાઓનું રજિસ્ટર (Donors directory for 80G lookup and audit tracking)',
    sql: `CREATE TABLE IF NOT EXISTS donors (
  id TEXT PRIMARY KEY,
  name_guj TEXT NOT NULL,
  phone TEXT,
  address_guj TEXT,
  pan_number TEXT,
  aadhar_number TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_donors_pan ON donors(pan_number);
CREATE INDEX IF NOT EXISTS idx_donors_name ON donors(name_guj);`
  },
  {
    name: 'income_receipts',
    description: 'દરેક પ્રકારની આવકની પાવતીઓનું જર્નલ (Income receipts log with auto-increment sequences)',
    sql: `CREATE TABLE IF NOT EXISTS income_receipts (
  id TEXT PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  date TEXT NOT NULL,
  donor_id TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount > 0),
  payment_mode TEXT NOT NULL CHECK(payment_mode IN ('ரோકડ', 'બેંક', 'ચેક')),
  bank_id TEXT,
  cheque_number TEXT,
  remarks_guj TEXT,
  operator_guj TEXT NOT NULL,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY(donor_id) REFERENCES donors(id),
  FOREIGN KEY(bank_id) REFERENCES bank_accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_receipt_date ON income_receipts(date);
CREATE INDEX IF NOT EXISTS idx_receipt_num ON income_receipts(receipt_number);`
  },
  {
    name: 'expense_vouchers',
    description: 'ખર્ચના વાઉચરોની યાદી (Expense vouchers ledger)',
    sql: `CREATE TABLE IF NOT EXISTS expense_vouchers (
  id TEXT PRIMARY KEY,
  voucher_number TEXT UNIQUE NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount > 0),
  paid_to_guj TEXT NOT NULL,
  payment_mode TEXT NOT NULL,
  bank_id TEXT,
  cheque_number TEXT,
  remarks_guj TEXT,
  approved_by_guj TEXT,
  operator_guj TEXT NOT NULL,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY(bank_id) REFERENCES bank_accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_voucher_date ON expense_vouchers(date);`
  },
  {
    name: 'bank_accounts',
    description: 'ટ્રસ્ટના બેંક ખાતાઓની માહિતી (Trust bank account mappings and initial balances)',
    sql: `CREATE TABLE IF NOT EXISTS bank_accounts (
  id TEXT PRIMARY KEY,
  bank_name_guj TEXT NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  branch_guj TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  balance REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1
);`
  },
  {
    name: 'bank_transactions',
    description: 'બેંક ટ્રાન્ઝેકશન અને ચેક વટાવવાની વિગતો (Bank ledger entries and cheque status reconciliation)',
    sql: `CREATE TABLE IF NOT EXISTS bank_transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('જમા', 'ઉપાડ', 'ટ્રાન્સફર')),
  amount REAL NOT NULL,
  from_account TEXT,
  to_account TEXT,
  cheque_number TEXT,
  is_cleared INTEGER DEFAULT 0,
  clearance_date TEXT,
  remarks_guj TEXT,
  FOREIGN KEY(from_account) REFERENCES bank_accounts(id),
  FOREIGN KEY(to_account) REFERENCES bank_accounts(id)
);`
  },
  {
    name: 'assets',
    description: 'ટ્રસ્ટની મિલકતો અને ઘસારો (Fixed Asset Register with automatic depreciation logging)',
    sql: `CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  name_guj TEXT NOT NULL,
  type_guj TEXT NOT NULL,
  purchase_date TEXT NOT NULL,
  purchase_amount REAL NOT NULL,
  depreciation_rate REAL NOT NULL,
  current_value REAL NOT NULL,
  remarks_guj TEXT
);`
  },
  {
    name: 'audit_logs',
    description: 'ડબલ એન્ટ્રી અને ફેરફારના ઓડિટ લોગ (System audit logs for offline accountability tracking)',
    sql: `CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  username TEXT NOT NULL,
  action_guj TEXT NOT NULL,
  module_guj TEXT NOT NULL,
  details_guj TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(timestamp);`
  }
];

export const RAW_SQL_SEED_QUERY = `-- ગુજારતી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ એકાઉન્ટિંગ ડેટાબેઝ બીજ (Seed Data)
INSERT INTO users (id, username, name_guj, role, password_hash, is_active) VALUES
('usr1', 'admin', 'રમણલાલ શાહ', 'Admin', 'admin123', 1),
('usr2', 'accountant', 'મનીષ મહેતા', 'Accountant', 'acc123', 1),
('usr3', 'dataentry', 'પરેશ રાવલ', 'DataEntry', 'data123', 1);

INSERT INTO bank_accounts (id, bank_name_guj, account_number, branch_guj, ifsc_code, balance, is_active) VALUES
('bnk1', 'એસબીઆઈ બેંક (SBI)', '30491002345', 'આશ્રમ રોડ, અમદાવાદ', 'SBIN0000001', 450000.00, 1),
('bnk2', 'બેંક ઓફ બરોડા (BOB)', '01290200001', 'કાલુપુર, અમદાવાદ', 'BARB0KALUPU', 280000.00, 1);

INSERT INTO donors (id, name_guj, phone, address_guj, pan_number, aadhar_number, email) VALUES
('dnr1', 'ચિંતન રજનીકાંત પટેલ', '9825012345', '૨૪, સુખશાંતિ સોસાયટી, સેટેલાઇટ, અમદાવાદ', 'ABCDE1234F', '123456789012', 'chintan@gmail.com'),
('dnr2', 'મંગળાબેન કેશવલાલ મોદી', '9426098765', '૧૨/એ, લક્ષ્મીકૃપા ફ્લેટ્સ, નવરંગપુરા, અમદાવાદ', 'WXYZR9876Q', '987654321098', 'mangla@yahoo.com');
`;
