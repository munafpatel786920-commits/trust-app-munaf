/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Donor, IncomeReceipt, ExpenseVoucher, TrustMember, BankAccount, Asset, DocumentMeta, AuditLog, TrustLicense, TrustSettings, AgendaTharav, MemberSharePurchase, MemberLoanApplication } from './types';

export const DEFAULT_USERS: User[] = [
  {
    id: 'usr1',
    username: 'admin',
    nameGuj: 'રમણલાલ શાહ (ટ્રસ્ટી)',
    role: 'Admin',
    roleGuj: 'પ્રશાસક (Administrator)',
    passwordHash: 'admin123',
    isActive: true,
    trustNameGuj: 'પ્રોગ્રેસિવ વેલ્ફેર ટ્રસ્ટ , ઇખર'
  },
  {
    id: 'usr-demo',
    username: 'demo',
    nameGuj: 'દેમો યુઝર (ડેમો એડમિન)',
    role: 'Admin',
    roleGuj: 'પ્રશાસક (Administrator)',
    passwordHash: 'demo123',
    isActive: true,
    trustNameGuj: 'દેમો ટ્રસ્ટ'
  },
  {
    id: 'usr-ikhar-admin',
    username: 'admin',
    nameGuj: 'ઇખર મસ્જિદ ટ્રસ્ટી (પ્રશાસક)',
    role: 'Admin',
    roleGuj: 'પ્રશાસક (Administrator)',
    passwordHash: 'admin123',
    isActive: true,
    trustNameGuj: 'ઇખર મસ્જિદ ટ્રસ્ટ'
  },
  {
    id: 'usr2',
    username: 'accountant',
    nameGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)',
    role: 'Accountant',
    roleGuj: 'નામું રાખનાર (Accountant)',
    passwordHash: 'acc123',
    isActive: true,
    trustNameGuj: 'પ્રોગ્રેસિવ વેલ્ફેર ટ્રસ્ટ , ઇખર'
  },
  {
    id: 'usr3',
    username: 'operator',
    nameGuj: 'પરેશ પટેલ (ડેટા એન્ટ્રી)',
    role: 'DataEntry',
    roleGuj: 'ડેટા એન્ટ્રી ઓપરેટર (Data Entry)',
    passwordHash: 'op123',
    isActive: true,
    trustNameGuj: 'પ્રોગ્રેસિવ વેલ્ફેર ટ્રસ્ટ , ઇખર'
  },
  {
    id: 'usr4',
    username: 'readonly',
    nameGuj: 'જયેશભાઈ વ્યાસ (નિરીક્ષક)',
    role: 'ReadOnly',
    roleGuj: 'માત્ર વાંચવા માટે (Read Only)',
    passwordHash: 'read123',
    isActive: true,
    trustNameGuj: 'પ્રોગ્રેસિવ વેલ્ફેર ટ્રસ્ટ , ઇખર'
  }
];

export const DEFAULT_DONORS: Donor[] = [];

export const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [];

export const DEFAULT_INCOME_RECEIPTS: IncomeReceipt[] = [];

export const DEFAULT_EXPENSE_VOUCHERS: ExpenseVoucher[] = [];

export const DEFAULT_MEMBERS: TrustMember[] = [];

export const DEFAULT_SHARE_PURCHASES: MemberSharePurchase[] = [];

export const DEFAULT_LOAN_APPLICATIONS: MemberLoanApplication[] = [];

export const DEFAULT_ASSETS: Asset[] = [];

export const DEFAULT_DOCUMENTS: DocumentMeta[] = [];

export const DEFAULT_AUDIT_LOGS: AuditLog[] = [];

export const DEFAULT_LICENSES: TrustLicense[] = [
  {
    id: 'lic-demo',
    trustNameGuj: 'દેમો ટ્રસ્ટ',
    licenseKey: 'DEMO-TRST-2026-ACTV-9999',
    registeredEmail: 'patelmunaf90@gmail.com',
    registeredPhone: '9876543210',
    activationDate: '2026-01-01',
    expiryDate: '2099-12-31',
    status: 'સક્રિય (Active)',
    version: 'v4.2.0'
  },
  {
    id: 'lic-prog-ikhar',
    trustNameGuj: 'પ્રોગ્રેસિવ વેલ્ફેર ટ્રસ્ટ , ઇખર',
    licenseKey: 'PROG-IKHR-9823-ACTV-8822',
    registeredEmail: 'patelmunaf90@gmail.com',
    registeredPhone: '9825012345',
    activationDate: '2026-01-01',
    expiryDate: '2099-12-31',
    status: 'સક્રિય (Active)',
    version: 'v4.2.0'
  },
  {
    id: 'lic-ikhar-masjid',
    trustNameGuj: 'ઇખર મસ્જિદ ટ્રસ્ટ',
    licenseKey: 'IKHR-MSJD-4729-ACTV-7711',
    registeredEmail: 'patelmunaf90@gmail.com',
    registeredPhone: '9825099887',
    activationDate: '2026-01-01',
    expiryDate: '2099-12-31',
    status: 'સક્રિય (Active)',
    version: 'v4.2.0'
  }
];

export const DEFAULT_TRUST_SETTINGS: TrustSettings = {
  trustNameGuj: 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ',
  trustNameEng: 'Progressive Welfare Trust',
  regNoGuj: 'E/7862/Ahmedabad',
  addressGuj: 'અમદાવાદ, ગુજરાત',
  phone: '+91 98250 12345',
  email: 'info@progressivewelfare.org',
  panNumber: 'AAATP1234F',
  tanNumber: 'AHMP01234G',
  section12ANo: 'AAATP1234F20211',
  section80GNo: 'AAATP1234F20224',
  financialYear: '૨૦૨૬-૨૭ (FY 2026-27)',
  receiptHeaderGuj: 'માનવ સેવા એ જ પ્રભુ સેવા - ૧૦૦% કરમુક્ત દાન પાવતી',
  logoUrl: '',
  openingCashBalance: 0,
  isGstEnabled: false,
  gstNumber: '',
  defaultGstRate: 18
};

export const DEFAULT_THARAVS: AgendaTharav[] = [];

export const DEFAULT_INVENTORY_ITEMS: any[] = [];

export const DEFAULT_PURCHASE_BILLS: any[] = [];

export const DEFAULT_SALES_BILLS: any[] = [];
