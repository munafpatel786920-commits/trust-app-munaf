/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Landmark,
  BookOpen,
  Users,
  Contact,
  HardDrive,
  FileText,
  KeyRound,
  Search,
  LogOut,
  Sun,
  Moon,
  Clock,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  User,
  History,
  Terminal,
  ChevronRight,
  Database,
  Settings,
  Keyboard,
  X,
  Lock,
  Eye,
  EyeOff,
  ShoppingBag,
  Calculator,
  RefreshCw,
  Wifi,
  WifiOff,
  Download,
  Cloud,
  Plus,
  Building2,
  Loader2,
  Receipt,
  CreditCard,
  UserCheck,
  Award,
  ShoppingCart,
  FileSpreadsheet,
  UserCog
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { registerServiceWorker, checkServerVersion, reloadToUpdate } from './utils/pwaUpdate';

import {
  UserRole,
  User as UserType,
  Donor,
  IncomeReceipt,
  ExpenseVoucher,
  TrustMember,
  BankAccount,
  Asset,
  DocumentMeta,
  AuditLog,
  TrustLicense,
  TrustSettings,
  AgendaTharav,
  InventoryItem,
  PurchaseBill,
  SalesBill,
  MemberSharePurchase,
  MemberLoanApplication
} from './types';

import {
  DEFAULT_USERS,
  DEFAULT_DONORS,
  DEFAULT_BANK_ACCOUNTS,
  DEFAULT_INCOME_RECEIPTS,
  DEFAULT_EXPENSE_VOUCHERS,
  DEFAULT_MEMBERS,
  DEFAULT_ASSETS,
  DEFAULT_DOCUMENTS,
  DEFAULT_AUDIT_LOGS,
  DEFAULT_LICENSES,
  DEFAULT_TRUST_SETTINGS,
  DEFAULT_THARAVS,
  DEFAULT_INVENTORY_ITEMS,
  DEFAULT_PURCHASE_BILLS,
  DEFAULT_SALES_BILLS,
  DEFAULT_SHARE_PURCHASES,
  DEFAULT_LOAN_APPLICATIONS
} from './mockData';

// Import our custom modules
import Dashboard from './components/Dashboard';
import IncomeModule from './components/IncomeModule';
import ExpenseModule from './components/ExpenseModule';
import BankModule from './components/BankModule';
import AccountingModule from './components/AccountingModule';
import DonorModule from './components/DonorModule';
import MemberModule from './components/MemberModule';
import AssetModule from './components/AssetModule';
import DocModule from './components/DocModule';
import PurchaseSalesModule from './components/PurchaseSalesModule';
import SuperAdminPanel from './components/SuperAdminPanel';
import BackupModule from './components/BackupModule';
import TrustSettingsModule from './components/TrustSettingsModule';
import AgendaTharavModule from './components/AgendaTharavModule';
import UserManagementModule from './components/UserManagementModule';
import CalculatorWidget from './components/CalculatorWidget';
import Sidebar from './components/Sidebar';
import { translitWord, localTransliterate } from './utils/transliterator';
import { 
  db, 
  isElectronOfflineApp, 
  isOnlineCloudMode, 
  saveTrustDatasetToFirebase, deleteTrustFromFirebase, 
  saveFullTrustToFirebase, 
  loadFullTrustFromFirebase, 
  saveSystemMasterToFirebase, 
  loadSystemMasterFromFirebase, 
  subscribeToTrustFirebase,
  subscribeToSystemMasterFirebase 
} from './lib/firebase';

export default function App() {
  // Hybrid App Mode state ('offline', 'online', 'hybrid')
  const [appMode, setAppMode] = useState<'offline' | 'online' | 'hybrid'>(() => {
    return (localStorage.getItem('trust_app_mode') as any) || 'hybrid';
  });

  // Online connection status & PWA update status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [hasAppUpdate, setHasAppUpdate] = useState<boolean>(false);
  const [serverVersionNum, setServerVersionNum] = useState<string>('');
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState<boolean>(false);
  const [lastFirebaseSyncTime, setLastFirebaseSyncTime] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('trust_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // 1. Register Service Worker for PWA offline capabilities
    registerServiceWorker(() => {
      setHasAppUpdate(true);
    });

    // 2. Initial version check if online
    if (navigator.onLine) {
      checkServerVersion().then((res) => {
        if (res.hasNewVersion) {
          setHasAppUpdate(true);
          setServerVersionNum(res.version || '');
        }
      });
    }

    const handleOnline = () => {
      setIsOnline(true);
      if (appMode !== 'offline' && !isElectronOfflineApp()) {
        syncToFirebaseAndCloud();
      }
      // Check for GitHub / Server updates as soon as internet connects
      checkServerVersion().then((res) => {
        if (res.hasNewVersion) {
          setHasAppUpdate(true);
          setServerVersionNum(res.version || '');
        }
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [appMode]);

  const handleAppModeChange = (mode: 'offline' | 'online' | 'hybrid') => {
    setAppMode(mode);
    localStorage.setItem('trust_app_mode', mode);
    addAuditLog(
      'એપ્લિકેશન મોડ બદલાયો',
      'સેટિંગ્સ (App Mode)',
      `મોડ સેટ કર્યો: ${mode === 'offline' ? 'ઓફલાઇન (Offline)' : mode === 'online' ? 'ઓનલાઇન (Online)' : 'હાઇબ્રિડ (Hybrid)'}`
    );
    if (mode !== 'offline' && navigator.onLine && !isElectronOfflineApp()) {
      syncToFirebaseAndCloud();
    }
  };

  const syncToFirebaseAndCloud = async (overrideTrustName?: string) => {
    if (isElectronOfflineApp() || !navigator.onLine || appMode === 'offline') return;
    const targetTrust = overrideTrustName || currentSessionUser?.trustNameGuj || trustSettings?.trustNameGuj || 'મુખ્ય ટ્રસ્ટ';
    try {
      setIsFirebaseSyncing(true);
      const payload = {
        trust_name: targetTrust,
        donors,
        receipts,
        vouchers,
        banks,
        members,
        assets,
        documents,
        tharavs,
        auditLogs,
        licenses,
        trustSettings,
        reconciliationList,
        inventoryItems,
        purchaseBills,
        salesBills,
        sharePurchases,
        loanApplications,
        lastSyncedAt: new Date().toISOString()
      };
      await Promise.all([
        saveFullTrustToFirebase(targetTrust, payload),
        saveSystemMasterToFirebase(licenses, appUsers)
      ]);
      const nowTime = new Date().toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastFirebaseSyncTime(nowTime);
      console.log(`[Firebase Cloud Sync] ${targetTrust} data synced to Google Firebase at ${nowTime}`);
    } catch (err) {
      console.error('Firebase Cloud Sync error:', err);
    } finally {
      setTimeout(() => setIsFirebaseSyncing(false), 500);
    }
  };

  const mergeList = (localList: any[], cloudList: any[]) => {
    if (!cloudList || !Array.isArray(cloudList) || cloudList.length === 0) return localList;
    if (!localList || !Array.isArray(localList) || localList.length === 0) return cloudList;
    const map = new Map();
    cloudList.forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });
    localList.forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });
    return Array.from(map.values());
  };

  const fetchFromFirebaseCloud = async (silent = false, overrideTrustName?: string) => {
    if (isElectronOfflineApp()) {
      if (!silent) alert('તમે પીસી ઑફલાઇન ડેસ્કટોપ મોડમાં છો. તમારો ડેટા તમારા પીસીમાં સુરક્ષિત છે.');
      return;
    }
    if (!navigator.onLine || appMode === 'offline') {
      if (!silent) alert('ઓફલાઇન મોડમાં છો અથવા ઇન્ટરનેટ ઉપલબ્ધ નથી!');
      return;
    }
    const targetTrust = overrideTrustName || currentSessionUser?.trustNameGuj || trustSettings?.trustNameGuj || 'મુખ્ય ટ્રસ્ટ';
    try {
      setIsFirebaseSyncing(true);
      const [cloudTrustData, systemMaster] = await Promise.all([
        loadFullTrustFromFirebase(targetTrust),
        loadSystemMasterFromFirebase()
      ]);

      if (systemMaster) {
        if (systemMaster.licenses && systemMaster.licenses.length > 0) {
          setLicenses(systemMaster.licenses);
          localStorage.setItem('trust_licenses', JSON.stringify(systemMaster.licenses));
        }
        if (systemMaster.users && systemMaster.users.length > 0) {
          setAppUsers(systemMaster.users);
          localStorage.setItem('trust_users', JSON.stringify(systemMaster.users));
        }
      }

      if (cloudTrustData) {
        const dnr = cloudTrustData.trust_donors || cloudTrustData.donors;
        if (dnr) {
          setDonors(prev => {
          const merged = mergeList(prev, dnr);
          localStorage.setItem(getScopedKey('trust_donors'), JSON.stringify(merged));
          return merged;
        });
        }
        const rcp = cloudTrustData.trust_receipts || cloudTrustData.receipts;
        if (rcp) {
          setReceipts(prev => {
          const merged = mergeList(prev, rcp);
          localStorage.setItem(getScopedKey('trust_receipts'), JSON.stringify(merged));
          return merged;
        });
        }
        const vch = cloudTrustData.trust_vouchers || cloudTrustData.vouchers;
        if (vch) {
          setVouchers(prev => {
          const merged = mergeList(prev, vch);
          localStorage.setItem(getScopedKey('trust_vouchers'), JSON.stringify(merged));
          return merged;
        });
        }
        const bnk = cloudTrustData.trust_banks || cloudTrustData.banks;
        if (bnk) {
          setBanks(prev => {
          const merged = mergeList(prev, bnk);
          localStorage.setItem(getScopedKey('trust_banks'), JSON.stringify(merged));
          return merged;
        });
        }
        const mbr = cloudTrustData.trust_members || cloudTrustData.members;
        if (mbr) {
          setMembers(prev => {
          const merged = mergeList(prev, mbr);
          localStorage.setItem(getScopedKey('trust_members'), JSON.stringify(merged));
          return merged;
        });
        }
        const ast = cloudTrustData.trust_assets || cloudTrustData.assets;
        if (ast) {
          setAssets(prev => {
          const merged = mergeList(prev, ast);
          localStorage.setItem(getScopedKey('trust_assets'), JSON.stringify(merged));
          return merged;
        });
        }
        const docList = cloudTrustData.trust_documents || cloudTrustData.documents;
        if (docList) {
          setDocuments(prev => {
          const merged = mergeList(prev, docList);
          localStorage.setItem(getScopedKey('trust_documents'), JSON.stringify(merged));
          return merged;
        });
        }
        const thr = cloudTrustData.trust_tharavs || cloudTrustData.tharavs;
        if (thr) {
          setTharavs(prev => {
          const merged = mergeList(prev, thr);
          localStorage.setItem(getScopedKey('trust_tharavs'), JSON.stringify(merged));
          return merged;
        });
        }
        const setts = cloudTrustData.trust_settings || cloudTrustData.trustSettings;
        if (setts) { 
          const mergedSetts = { ...setts, trustNameGuj: setts.trustNameGuj || targetTrust };
          setTrustSettings(mergedSetts); 
          localStorage.setItem(getScopedKey('trust_settings'), JSON.stringify(mergedSetts)); 
        } else {
          setTrustSettings(prev => ({
            ...prev,
            trustNameGuj: targetTrust
          }));
        }
        const rcn = cloudTrustData.trust_reconciliation || cloudTrustData.reconciliationList;
        if (rcn) {
          setReconciliationList(prev => {
          const merged = mergeList(prev, rcn);
          localStorage.setItem(getScopedKey('trust_reconciliation'), JSON.stringify(merged));
          return merged;
        });
        }
        const inv = cloudTrustData.trust_inventory_items || cloudTrustData.inventoryItems;
        if (inv) {
          setInventoryItems(prev => {
          const merged = mergeList(prev, inv);
          localStorage.setItem(getScopedKey('trust_inventory_items'), JSON.stringify(merged));
          return merged;
        });
        }
        const pb = cloudTrustData.trust_purchase_bills || cloudTrustData.purchaseBills;
        if (pb) {
          setPurchaseBills(prev => {
          const merged = mergeList(prev, pb);
          localStorage.setItem(getScopedKey('trust_purchase_bills'), JSON.stringify(merged));
          return merged;
        });
        }
        const sb = cloudTrustData.trust_sales_bills || cloudTrustData.salesBills;
        if (sb) {
          setSalesBills(prev => {
          const merged = mergeList(prev, sb);
          localStorage.setItem(getScopedKey('trust_sales_bills'), JSON.stringify(merged));
          return merged;
        });
        }
        const sp = cloudTrustData.trust_share_purchases || cloudTrustData.sharePurchases;
        if (sp) {
          setSharePurchases(prev => {
          const merged = mergeList(prev, sp);
          localStorage.setItem(getScopedKey('trust_share_purchases'), JSON.stringify(merged));
          return merged;
        });
        }
        const la = cloudTrustData.trust_loan_applications || cloudTrustData.loanApplications;
        if (la) {
          setLoanApplications(prev => {
          const merged = mergeList(prev, la);
          localStorage.setItem(getScopedKey('trust_loan_applications'), JSON.stringify(merged));
          return merged;
        });
        }
        
        const nowTime = new Date().toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastFirebaseSyncTime(nowTime);
        if (!silent) alert('ગૂગલ ફાયરબેઝ ક્લાઉડમાંથી ડેટા સફળતાપૂર્વક ડાઉનલોડ અને સિંક થઈ ગયો છે!');
      } else {
        await syncToFirebaseAndCloud(targetTrust);
        if (!silent) alert('ક્લાઉડમાં આ ટ્રસ્ટનો નવો ડેટાબેઝ બન્યો છે અને સ્થાનિક વિગતો ફાયરબેઝ પર અપલોડ થઈ ગઈ છે!');
      }
    } catch (err) {
      console.error('Failed to fetch from Firebase cloud:', err);
      if (!silent) alert('ક્લાઉડ સિંક નિષ્ફળ.');
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  const [gujaratiTypingEnabled, setGujaratiTypingEnabled] = useState<boolean>(() => {
    return localStorage.getItem('gujarati_typing_enabled') !== 'false';
  });

  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentSessionUser, setCurrentSessionUser] = useState<UserType | null>(null);
  const [appUsers, setAppUsers] = useState<UserType[]>([]);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRoleFilter, setLoginRoleFilter] = useState<UserRole>('Admin');
  const [loginSelectedTrust, setLoginSelectedTrust] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [activationSuccessMessage, setActivationSuccessMessage] = useState<string | null>(null);
  const [showDirectActivationModal, setShowDirectActivationModal] = useState(false);
  const [directTrustNameInput, setDirectTrustNameInput] = useState('');
  const [directEmailInput, setDirectEmailInput] = useState('');
  const [directPhoneInput, setDirectPhoneInput] = useState('');
  const [directAdminUser, setDirectAdminUser] = useState('admin');
  const [directAdminPass, setDirectAdminPass] = useState('admin123');
  const [directActivationError, setDirectActivationError] = useState<string | null>(null);

  // Global event listener for direct phonetic keyboard transliteration (like mobile GBoard)
  useEffect(() => {
    if (!gujaratiTypingEnabled || !isLoggedIn) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (!target) return;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return;
      if (target.type === 'password' || target.type === 'number' || target.type === 'date' || target.type === 'email') return;
      if (target.getAttribute('lang') === 'en' || target.id === 'secure_login_user_field' || target.value.includes('@')) return;

      // When user presses Space, or common sentence-end punctuation:
      if (e.key === ' ' || e.key === ',' || e.key === '.' || e.key === '-' || e.key === '/' || e.key === '(' || e.key === ')') {
        const value = target.value;
        const selectionStart = target.selectionStart || 0;
        
        // Find the word just typed before the cursor
        const textBeforeCursor = value.substring(0, selectionStart);
        // Find the index of the last word character group (English alphabetic characters)
        const wordMatch = textBeforeCursor.match(/([a-zA-Z]+)$/);
        
        if (wordMatch) {
          const lastWord = wordMatch[1];
          // Transliterate
          const gujaratiWord = await translitWord(lastWord);
          
          if (gujaratiWord !== lastWord) {
            e.preventDefault(); // Stop default character insertion to handle ourselves
            
            const startIdx = selectionStart - lastWord.length;
            const textAfterCursor = value.substring(selectionStart);
            const textBeforeWord = value.substring(0, startIdx);
            
            // Build new value
            const keyToInsert = e.key;
            const newValue = textBeforeWord + gujaratiWord + keyToInsert + textAfterCursor;
            
            // Use prototype setter so React registers the value change instead of overwriting/reverting it
            const valueSetter = Object.getOwnPropertyDescriptor(
              target.constructor.prototype,
              'value'
            )?.set;
            if (valueSetter) {
              valueSetter.call(target, newValue);
            } else {
              target.value = newValue;
            }
            
            // Trigger input event so React's synthetic event system and onChange handlers are fired
            const event = new Event('input', { bubbles: true });
            target.dispatchEvent(event);

            // Update cursor position perfectly, using immediate and setTimeout to prevent React render cursor reset
            const newCursorPos = textBeforeWord.length + gujaratiWord.length + 1;
            target.setSelectionRange(newCursorPos, newCursorPos);
            setTimeout(() => {
              target.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [gujaratiTypingEnabled, isLoggedIn]);

  // Calculator State
  const [calculatorOpen, setCalculatorOpen] = useState<boolean>(false);

  // Offline Software Activation State
  const [isActivated, setIsActivated] = useState<boolean>(() => {
    return localStorage.getItem('trust_activated') === 'true';
  });
  const [activationKey, setActivationKey] = useState<string>(() => {
    return localStorage.getItem('trust_activation_key') || '';
  });
  const [activationTrustNameInput, setActivationTrustNameInput] = useState<string>('પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ');
  const [activationKeyInput, setActivationKeyInput] = useState<string>('');
  const [activationEmailInput, setActivationEmailInput] = useState<string>('');
  const [activationAdminUsername, setActivationAdminUsername] = useState<string>('admin');
  const [activationAdminPassword, setActivationAdminPassword] = useState<string>('admin123');
  const [activationAdminName, setActivationAdminName] = useState<string>('મુખ્ય ટ્રસ્ટી / પ્રશાસક');
  const [activationError, setActivationError] = useState<string>('');

  const handleActivateSoftware = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError('');

    const cleanKey = activationKeyInput.trim().toUpperCase();
    if (!cleanKey) {
      setActivationError('કૃપા કરીને માન્ય સોફ્ટવેર એક્ટિવેશન કી દાખલ કરો.');
      return;
    }

    // Check if key is already used
    const usedKeysRaw = localStorage.getItem('trust_used_activation_keys');
    const usedKeys: string[] = usedKeysRaw ? JSON.parse(usedKeysRaw) : [];
    if (usedKeys.includes(cleanKey)) {
      setActivationError('આ લાયસન્સ કી પહેલેથી જ ઉપયોગમાં લેવાઈ ચૂકી છે. એક લાયસન્સ કીથી ફરીથી સોફ્ટવેર એક્ટિવેટ કરી શકાશે નહીં.');
      return;
    }

    // Check key against licenses or pattern rules
    const allLicenses = licenses;
    const matchedLic = allLicenses.find(
      l => l.licenseKey.trim().toUpperCase() === cleanKey
    );

    if (matchedLic && (matchedLic.status.includes('અસક્રિય') || matchedLic.status.toLowerCase().includes('inactive'))) {
      setActivationError('આ લાયસન્સ કી અસક્રિય (Inactive) છે અને તેનો ઉપયોગ કરી શકાશે નહીં.');
      return;
    }

    const isPatternValid = cleanKey.startsWith('GUJ-TRST-') || cleanKey.includes('ACTV') || cleanKey.length >= 10;

    if (!matchedLic && !isPatternValid) {
      setActivationError('અમાન્ય એક્ટિવેશન કી! કૃપા કરીને સાચી લાયસન્સ કી (જેમ કે: GUJ-TRST-2026-ACTIVATED) ઉપયોગ કરો.');
      return;
    }

    // Mark key as used
    const updatedUsedKeys = Array.from(new Set([...usedKeys, cleanKey]));
    localStorage.setItem('trust_used_activation_keys', JSON.stringify(updatedUsedKeys));

    const trustName = activationTrustNameInput.trim() || 'શ્રી સાર્વજનિક કલ્યાણ ટ્રસ્ટ';
    const cleanUser = activationAdminUsername.trim() || 'admin';
    const cleanPass = activationAdminPassword.trim() || 'admin123';
    const cleanName = activationAdminName.trim() || `${trustName} (પ્રશાસક)`;

    // Ensure license status is Active and save/sync global license list
    let updatedLicenses = [...allLicenses];
    if (matchedLic) {
      updatedLicenses = allLicenses.map(l => 
        l.id === matchedLic.id ? { ...l, status: 'સક્રિય (Active)' as const, trustNameGuj: trustName } : l
      );
    } else {
      const newLic: TrustLicense = {
        id: 'lic-' + Date.now(),
        licenseKey: cleanKey,
        trustNameGuj: trustName,
        registeredEmail: 'admin@trust.org',
        registeredPhone: '9876543210',
        activationDate: new Date().toISOString().split('T')[0],
        expiryDate: '2099-12-31',
        status: 'સક્રિય (Active)',
        version: 'v2026.1'
      };
      updatedLicenses = [newLic, ...updatedLicenses];
    }
    setLicenses(updatedLicenses);
    localStorage.setItem('trust_licenses', JSON.stringify(updatedLicenses));

    // Register or update Admin user with these credentials
    const newAdminUser: UserType = {
      id: 'usr-' + Date.now(),
      username: cleanUser,
      nameGuj: cleanName,
      role: 'Admin',
      roleGuj: 'પ્રશાસક (Administrator)',
      passwordHash: cleanPass,
      isActive: true,
      trustNameGuj: trustName,
      isVendorRegistered: true
    };

    const userList = appUsers;
    const filteredUsersList = userList.filter(u => {
      const uTrust = u.trustNameGuj || 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ';
      // Remove any existing admin or matching username for this activated trust
      if (uTrust === trustName && (u.role === 'Admin' || u.username.toLowerCase() === cleanUser.toLowerCase())) {
        return false;
      }
      // If u.trustNameGuj was unassigned and cleanUser is admin, remove legacy default admin
      if (!u.trustNameGuj && u.username.toLowerCase() === cleanUser.toLowerCase()) {
        return false;
      }
      return true;
    });

    const updatedUsers = [newAdminUser, ...filteredUsersList];
    setAppUsers(updatedUsers);
    syncStorage('trust_users', updatedUsers);

    localStorage.setItem('trust_activated', 'true');
    localStorage.setItem('trust_activation_key', cleanKey);
    localStorage.setItem('trust_activated_name', trustName);
    localStorage.setItem('trust_activated_date', new Date().toISOString().split('T')[0]);

    setIsActivated(true);
    setActivationKey(cleanKey);

    // Set selected trust and pre-fill login credentials so user can log in immediately and reliably on restart
    setLoginSelectedTrust(trustName);
    setLoginUsername(cleanUser);
    setLoginPassword(cleanPass);
    setLoginRoleFilter('Admin');

    // Sync settings if trust name changed
    if (trustName) {
      const updatedSettings = {
        ...DEFAULT_TRUST_SETTINGS,
        trustNameGuj: trustName,
        trustNameEng: '',
        regNoGuj: '',
        addressGuj: '',
        phone: '',
        email: '',
        panNumber: '',
        tanNumber: '',
        section12ANo: '',
        section80GNo: '',
        openingCashBalance: 0
      };
      setTrustSettings(updatedSettings);
      const settingsKey = `trust_settings_${cleanUser.toLowerCase()}`;
      localStorage.setItem(settingsKey, JSON.stringify(updatedSettings));
    }

    // Log audit
    addAuditLog(
      'ઓફલાઇન સોફ્ટવેર એક્ટિવેશન અને એડમિન લોગિન સફળ',
      'લાયસન્સિંગ (Offline Activation)',
      `એક્ટિવેશન કી: ${cleanKey} દ્વારા ${trustName} માટે યુઝરનેમ ${cleanUser} સાથે સક્રિય કરાયું.`
    );
  };

  const handleDeactivateSoftware = () => {
    if (confirm('શું તમે સોફ્ટવેર ડિ-એક્ટિવેટ કરવા માંગો છો? આનાથી ફરીથી નવી એક્ટિવેશન કી દાખલ કરવી પડશે.')) {
      localStorage.removeItem('trust_activated');
      localStorage.removeItem('trust_activation_key');
      localStorage.removeItem('trust_activated_name');
      localStorage.removeItem('trust_activated_date');
      setIsActivated(false);
      setActivationKey('');
      setIsLoggedIn(false);
    }
  };

  const handleDirectTrustActivation = (e: React.FormEvent) => {
    e.preventDefault();
    setDirectActivationError(null);
    const trustName = directTrustNameInput.trim();
    const cleanUser = directAdminUser.trim() || 'admin';
    const cleanPass = directAdminPass.trim() || 'admin123';
    const email = directEmailInput.trim() || 'admin@trust.org';
    const phone = directPhoneInput.trim() || '';

    if (!trustName) {
      setDirectActivationError('મહેરબાની કરીને ટ્રસ્ટનું નામ દાખલ કરો.');
      return;
    }

    // 1. Add trust record to licenses list in state & localStorage
    let curLic = [...licenses];
    const licIdx = curLic.findIndex(
      l => l.trustNameGuj.trim() === trustName
    );
    if (licIdx >= 0) {
      curLic[licIdx] = {
        ...curLic[licIdx],
        status: 'સક્રિય (Active)',
        trustNameGuj: trustName,
        registeredEmail: email,
        registeredPhone: phone
      };
    } else {
      const newL: TrustLicense = {
        id: 'lic-' + Date.now(),
        licenseKey: 'TRST-' + Date.now(),
        trustNameGuj: trustName,
        registeredEmail: email,
        registeredPhone: phone,
        activationDate: new Date().toISOString().split('T')[0],
        expiryDate: '2099-12-31',
        status: 'સક્રિય (Active)',
        version: 'v4.2.0'
      };
      curLic = [newL, ...curLic];
    }
    setLicenses(curLic);
    localStorage.setItem('trust_licenses', JSON.stringify(curLic));

    // 2. Add or update admin user in state & localStorage
    let curUsers = [...appUsers];
    const uIdx = curUsers.findIndex(
      u => (u.trustNameGuj || '').trim() === trustName && u.username.toLowerCase() === cleanUser.toLowerCase()
    );
    const newAdmin: UserType = {
      id: `usr-${cleanUser}-${Date.now()}`,
      username: cleanUser,
      passwordHash: cleanPass,
      nameGuj: `${trustName} (પ્રશાસક)`,
      role: 'Admin',
      roleGuj: 'પ્રશાસક (Administrator)',
      isActive: true,
      trustNameGuj: trustName,
      isVendorRegistered: true
    };
    if (uIdx >= 0) {
      curUsers[uIdx] = newAdmin;
    } else {
      curUsers = [newAdmin, ...curUsers];
    }

    // Ensure helper roles exist for this trust as well
    const rolesNeeded: { role: UserRole; roleGuj: string; defaultUser: string; defaultPass: string }[] = [
      { role: 'Accountant', roleGuj: 'નામું રાખનાર (Accountant)', defaultUser: 'accountant', defaultPass: 'acc123' },
      { role: 'DataEntry', roleGuj: 'ડેટા એન્ટ્રી ઓપરેટર (Data Entry)', defaultUser: 'operator', defaultPass: 'op123' },
      { role: 'ReadOnly', roleGuj: 'માત્ર વાંચવા માટે (Read Only)', defaultUser: 'readonly', defaultPass: 'read123' }
    ];
    rolesNeeded.forEach(rn => {
      if (!curUsers.some(u => (u.trustNameGuj || '').trim() === trustName && u.role === rn.role)) {
        curUsers.push({
          id: `usr-${rn.defaultUser}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          username: rn.defaultUser,
          passwordHash: rn.defaultPass,
          nameGuj: `${trustName} (${rn.roleGuj.split(' ')[0]})`,
          role: rn.role,
          roleGuj: rn.roleGuj,
          isActive: true,
          trustNameGuj: trustName,
          isVendorRegistered: true
        });
      }
    });

    setAppUsers(curUsers);
    syncStorage('trust_users', curUsers);

    // 3. Mark app as ready and activated
    localStorage.setItem('trust_activated', 'true');
    localStorage.setItem('trust_activated_name', trustName);
    setIsActivated(true);

    // 4. Directly log in to this trust
    setCurrentSessionUser(newAdmin);
    setIsLoggedIn(true);
    setActiveTab('control_panel');
    setShowDirectActivationModal(false);
    setDirectTrustNameInput('');
    setDirectEmailInput('');
    setDirectPhoneInput('');
  };

  // Application database state representing SQLite tables
  const [donors, setDonors] = useState<Donor[]>([]);
  const [receipts, setReceipts] = useState<IncomeReceipt[]>([]);
  const [vouchers, setVouchers] = useState<ExpenseVoucher[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [members, setMembers] = useState<TrustMember[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [tharavs, setTharavs] = useState<AgendaTharav[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [licenses, setLicenses] = useState<TrustLicense[]>([]);
  const [trustSettings, setTrustSettings] = useState<TrustSettings>(DEFAULT_TRUST_SETTINGS);

  // Sync current active trust settings to a fixed unscoped key so utilities like PDF can always read it
  useEffect(() => {
    if (trustSettings) {
      localStorage.setItem('active_trust_settings', JSON.stringify(trustSettings));
    }
  }, [trustSettings]);
  const [reconciliationList, setReconciliationList] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [purchaseBills, setPurchaseBills] = useState<PurchaseBill[]>([]);
  const [salesBills, setSalesBills] = useState<SalesBill[]>([]);
  const [sharePurchases, setSharePurchases] = useState<MemberSharePurchase[]>([]);
  const [loanApplications, setLoanApplications] = useState<MemberLoanApplication[]>([]);

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('control_panel');

  // Local PC File Sync states
  const [fileHandle, setFileHandle] = useState<any>(null);
  const [filePermissionGranted, setFilePermissionGranted] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [isSyncingToPC, setIsSyncingToPC] = useState<boolean>(false);
  const [pcSyncMenuOpen, setPcSyncMenuOpen] = useState<boolean>(false);

  // IndexedDB Configuration for persistent File Handle access
  const dbName = 'TrustAccountingOfflineDB';
  const storeName = 'FileHandles';

  const saveFileHandleToIndexedDB = async (handle: any) => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(storeName);
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const putReq = store.put(handle, 'active_handle');
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      request.onerror = () => reject(request.error);
    });
  };

  const getFileHandleFromIndexedDB = async (): Promise<any | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(storeName);
      };
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          resolve(null);
          return;
        }
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const getReq = store.get('active_handle');
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    });
  };

  const deleteFileHandleFromIndexedDB = async () => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const delReq = store.delete('active_handle');
        delReq.onsuccess = () => resolve();
        delReq.onerror = () => reject(delReq.error);
      };
      request.onerror = () => reject(request.error);
    });
  };

  const handleSaveTrustSettings = (updated: TrustSettings) => {
    setTrustSettings(updated);
    syncStorage('trust_settings', updated);
    addAuditLog(
      'ટ્રસ્ટ સેટિંગ્સ અપડેટ કરવામાં આવી',
      'સેટિંગ્સ (Trust Settings)',
      `ટ્રસ્ટ નામ: ${updated.trustNameGuj}, નાણાકીય વર્ષ: ${updated.financialYear}`
    );
    if (appMode !== 'offline' && navigator.onLine) {
      syncToFirebaseAndCloud();
    }
  };

  // Connect/Create File System handlers
  const handleCreatePCFile = async () => {
    try {
      if (window.self !== window.top || !('showSaveFilePicker' in window)) {
        // Fallback for iframe / non-supported environment: Download JSON File directly
        const payload = {
          trust_donors: donors,
          trust_receipts: receipts,
          trust_vouchers: vouchers,
          trust_banks: banks,
          trust_members: members,
          trust_assets: assets,
          trust_documents: documents,
          trust_tharavs: tharavs,
          trust_audit_logs: auditLogs,
          trust_licenses: licenses,
          trust_settings: trustSettings,
          last_saved_at: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Trust_Backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert("તમારા કમ્પ્યુટર પર બેકઅપ ફાઇલ ડાઉનલોડ થઈ ગઈ છે!");
        return;
      }

      const translitName = await translitWord(trustSettings.trustNameGuj);
      const options = {
        suggestedName: `${translitName.replace(/\s+/g, '_')}_PC_Backup.json`,
        types: [{
          description: 'JSON Database File',
          accept: {
            'application/json': ['.json'],
          },
        }],
      };
      const handle = await (window as any).showSaveFilePicker(options);
      if (handle) {
        // Write current data as initial content
        const payload = {
          trust_donors: donors,
          trust_receipts: receipts,
          trust_vouchers: vouchers,
          trust_banks: banks,
          trust_members: members,
          trust_assets: assets,
          trust_documents: documents,
          trust_tharavs: tharavs,
          trust_audit_logs: auditLogs,
          trust_licenses: licenses,
          trust_settings: trustSettings,
          last_saved_at: new Date().toISOString()
        };
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(payload, null, 2));
        await writable.close();

        await saveFileHandleToIndexedDB(handle);
        setFileHandle(handle);
        setFileName(handle.name);
        setFilePermissionGranted(true);
        
        addAuditLog(
          'પીસી ઓટો-સેવ ફાઇલ લિંક કરેલ',
          'લોકલ બેકઅપ (PC Sync)',
          `નવી ફાઇલ: ${handle.name} સફળતાપૂર્વક બનાવીને કનેક્ટ કરવામાં આવી.`
        );
        alert(`સફળતાપૂર્વક જોડાણ થઈ ગયું! તમારી નવી હિસાબી ફાઇલ "${handle.name}" તમારા પીસી પર સેવ થઈ ગઈ છે. હવે તમે કોઈ પણ એન્ટ્રી કરશો તે આ ફાઈલમાં આપોઆપ લાઈવ સેવ થશે.`);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Failed to create file:", err);
        // If cross-origin iframe error happens, fallback to traditional download
        if (err.message && err.message.includes('Cross origin')) {
          const payload = {
            trust_donors: donors,
            trust_receipts: receipts,
            trust_vouchers: vouchers,
            trust_banks: banks,
            trust_members: members,
            trust_assets: assets,
            trust_documents: documents,
            trust_tharavs: tharavs,
            trust_audit_logs: auditLogs,
            trust_licenses: licenses,
            trust_settings: trustSettings,
            last_saved_at: new Date().toISOString()
          };
          const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Trust_Backup_${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
          alert("તમારા કમ્પ્યુટર પર બેકઅપ ફાઇલ ડાઉનલોડ થઈ ગઈ છે!");
        } else {
          alert("નવી ફાઇલ બનાવવામાં સમસ્યા આવી: " + err.message);
        }
      }
    }
  };

  const handleConnectExistingPCFile = async () => {
    try {
      if (window.self !== window.top || !('showOpenFilePicker' in window)) {
        // Fallback for iframe: create hidden file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            const text = await file.text();
            const parsed = JSON.parse(text);
            if (parsed && (parsed.trust_receipts || parsed.trust_vouchers || parsed.trust_settings)) {
              if (parsed.trust_donors) { setDonors(parsed.trust_donors); syncStorage('trust_donors', parsed.trust_donors); }
              if (parsed.trust_receipts) { setReceipts(parsed.trust_receipts); syncStorage('trust_receipts', parsed.trust_receipts); }
              if (parsed.trust_vouchers) { setVouchers(parsed.trust_vouchers); syncStorage('trust_vouchers', parsed.trust_vouchers); }
              if (parsed.trust_banks) { setBanks(parsed.trust_banks); syncStorage('trust_banks', parsed.trust_banks); }
              if (parsed.trust_members) { setMembers(parsed.trust_members); syncStorage('trust_members', parsed.trust_members); }
              if (parsed.trust_assets) { setAssets(parsed.trust_assets); syncStorage('trust_assets', parsed.trust_assets); }
              if (parsed.trust_documents) { setDocuments(parsed.trust_documents); syncStorage('trust_documents', parsed.trust_documents); }
              if (parsed.trust_tharavs) { setTharavs(parsed.trust_tharavs); syncStorage('trust_tharavs', parsed.trust_tharavs); }
              if (parsed.trust_audit_logs) { setAuditLogs(parsed.trust_audit_logs); syncStorage('trust_audit_logs', parsed.trust_audit_logs); }
              if (parsed.trust_licenses) { setLicenses(parsed.trust_licenses); syncStorage('trust_licenses', parsed.trust_licenses); }
              if (parsed.trust_settings) { setTrustSettings(parsed.trust_settings); syncStorage('trust_settings', parsed.trust_settings); }
              if (parsed.trust_reconciliation) { setReconciliationList(parsed.trust_reconciliation); syncStorage('trust_reconciliation', parsed.trust_reconciliation); }

              setFileName(file.name);
              alert(`સફળતાપૂર્વક ઈમ્પોર્ટ! "${file.name}" ફાઇલમાંથી તમામ જુનો હિસાબી ડેટા સોફ્ટવેરમાં લોડ થઈ ગયો છે.`);
            } else {
              alert("આ એક અમાન્ય હિસાબી ફાઇલ છે. કૃપા કરીને સાચી બેકઅપ ફાઈલ સિલેક્ટ કરો.");
            }
          }
        };
        input.click();
        return;
      }

      const options = {
        types: [{
          description: 'JSON Database File',
          accept: {
            'application/json': ['.json'],
          },
        }],
      };
      const [handle] = await (window as any).showOpenFilePicker(options);
      if (handle) {
        const file = await handle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);

        // Validation: verify if it contains database fields
        if (parsed && (parsed.trust_receipts || parsed.trust_vouchers || parsed.trust_settings)) {
          // Import data
          if (parsed.trust_donors) { setDonors(parsed.trust_donors); syncStorage('trust_donors', parsed.trust_donors); }
          if (parsed.trust_receipts) { setReceipts(parsed.trust_receipts); syncStorage('trust_receipts', parsed.trust_receipts); }
          if (parsed.trust_vouchers) { setVouchers(parsed.trust_vouchers); syncStorage('trust_vouchers', parsed.trust_vouchers); }
          if (parsed.trust_banks) { setBanks(parsed.trust_banks); syncStorage('trust_banks', parsed.trust_banks); }
          if (parsed.trust_members) { setMembers(parsed.trust_members); syncStorage('trust_members', parsed.trust_members); }
          if (parsed.trust_assets) { setAssets(parsed.trust_assets); syncStorage('trust_assets', parsed.trust_assets); }
          if (parsed.trust_documents) { setDocuments(parsed.trust_documents); syncStorage('trust_documents', parsed.trust_documents); }
          if (parsed.trust_tharavs) { setTharavs(parsed.trust_tharavs); syncStorage('trust_tharavs', parsed.trust_tharavs); }
          if (parsed.trust_audit_logs) { setAuditLogs(parsed.trust_audit_logs); syncStorage('trust_audit_logs', parsed.trust_audit_logs); }
          if (parsed.trust_licenses) { setLicenses(parsed.trust_licenses); syncStorage('trust_licenses', parsed.trust_licenses); }
          if (parsed.trust_settings) { setTrustSettings(parsed.trust_settings); syncStorage('trust_settings', parsed.trust_settings); }
          if (parsed.trust_reconciliation) { setReconciliationList(parsed.trust_reconciliation); syncStorage('trust_reconciliation', parsed.trust_reconciliation); }

          await saveFileHandleToIndexedDB(handle);
          setFileHandle(handle);
          setFileName(handle.name);
          setFilePermissionGranted(true);

          addAuditLog(
            'પીસી ઓટો-સેવ ફાઇલ લોડ કરેલ',
            'લોકલ બેકઅપ (PC Sync)',
            `હાલની ફાઇલ: ${handle.name} માંથી સંપૂર્ણ ડેટા સફળતાપૂર્વક લોડ કરીને લિંક કર્યો.`
          );
          alert(`સફળ જોડાણ! "${handle.name}" ફાઇલમાંથી તમામ જુનો હિસાબી ડેટા સોફ્ટવેરમાં લોડ થઈ ગયો છે અને ઓટો-સેવ સક્રિય છે.`);
        } else {
          alert("આ એક અમાન્ય હિસાબી ફાઇલ છે. કૃપા કરીને સાચી બેકઅપ ફાઈલ સિલેક્ટ કરો.");
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Failed to connect file:", err);
        if (err.message && err.message.includes('Cross origin')) {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json';
          input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
              const text = await file.text();
              const parsed = JSON.parse(text);
              if (parsed && (parsed.trust_receipts || parsed.trust_vouchers || parsed.trust_settings)) {
                if (parsed.trust_donors) { setDonors(parsed.trust_donors); syncStorage('trust_donors', parsed.trust_donors); }
                if (parsed.trust_receipts) { setReceipts(parsed.trust_receipts); syncStorage('trust_receipts', parsed.trust_receipts); }
                if (parsed.trust_vouchers) { setVouchers(parsed.trust_vouchers); syncStorage('trust_vouchers', parsed.trust_vouchers); }
                if (parsed.trust_banks) { setBanks(parsed.trust_banks); syncStorage('trust_banks', parsed.trust_banks); }
                if (parsed.trust_members) { setMembers(parsed.trust_members); syncStorage('trust_members', parsed.trust_members); }
                if (parsed.trust_assets) { setAssets(parsed.trust_assets); syncStorage('trust_assets', parsed.trust_assets); }
                if (parsed.trust_documents) { setDocuments(parsed.trust_documents); syncStorage('trust_documents', parsed.trust_documents); }
                if (parsed.trust_tharavs) { setTharavs(parsed.trust_tharavs); syncStorage('trust_tharavs', parsed.trust_tharavs); }
                if (parsed.trust_audit_logs) { setAuditLogs(parsed.trust_audit_logs); syncStorage('trust_audit_logs', parsed.trust_audit_logs); }
                if (parsed.trust_licenses) { setLicenses(parsed.trust_licenses); syncStorage('trust_licenses', parsed.trust_licenses); }
                if (parsed.trust_settings) { setTrustSettings(parsed.trust_settings); syncStorage('trust_settings', parsed.trust_settings); }
                if (parsed.trust_reconciliation) { setReconciliationList(parsed.trust_reconciliation); syncStorage('trust_reconciliation', parsed.trust_reconciliation); }

                setFileName(file.name);
                alert(`સફળતાપૂર્વક ઈમ્પોર્ટ! "${file.name}" ફાઇલમાંથી તમામ જુનો હિસાબી ડેટા સોફ્ટવેરમાં લોડ થઈ ગયો છે.`);
              } else {
                alert("આ એક અમાન્ય હિસાબી ફાઇલ છે. કૃપા કરીને સાચી બેકઅપ ફાઈલ સિલેક્ટ કરો.");
              }
            }
          };
          input.click();
        } else {
          alert("ફાઇલ જોડવામાં ક્ષતિ: " + err.message);
        }
      }
    }
  };

  const handleUnlockPCFile = async () => {
    if (!fileHandle) return;
    try {
      const permission = await fileHandle.requestPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        setFilePermissionGranted(true);
        // Load the latest data from the file to keep the app 100% in sync with physical file
        const file = await fileHandle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (parsed) {
          if (parsed.trust_donors) { setDonors(parsed.trust_donors); syncStorage('trust_donors', parsed.trust_donors); }
          if (parsed.trust_receipts) { setReceipts(parsed.trust_receipts); syncStorage('trust_receipts', parsed.trust_receipts); }
          if (parsed.trust_vouchers) { setVouchers(parsed.trust_vouchers); syncStorage('trust_vouchers', parsed.trust_vouchers); }
          if (parsed.trust_banks) { setBanks(parsed.trust_banks); syncStorage('trust_banks', parsed.trust_banks); }
          if (parsed.trust_members) { setMembers(parsed.trust_members); syncStorage('trust_members', parsed.trust_members); }
          if (parsed.trust_assets) { setAssets(parsed.trust_assets); syncStorage('trust_assets', parsed.trust_assets); }
          if (parsed.trust_documents) { setDocuments(parsed.trust_documents); syncStorage('trust_documents', parsed.trust_documents); }
          if (parsed.trust_tharavs) { setTharavs(parsed.trust_tharavs); syncStorage('trust_tharavs', parsed.trust_tharavs); }
          if (parsed.trust_audit_logs) { setAuditLogs(parsed.trust_audit_logs); syncStorage('trust_audit_logs', parsed.trust_audit_logs); }
          if (parsed.trust_licenses) { setLicenses(parsed.trust_licenses); syncStorage('trust_licenses', parsed.trust_licenses); }
          if (parsed.trust_settings) { setTrustSettings(parsed.trust_settings); syncStorage('trust_settings', parsed.trust_settings); }
          if (parsed.trust_reconciliation) { setReconciliationList(parsed.trust_reconciliation); syncStorage('trust_reconciliation', parsed.trust_reconciliation); }
        }
        addAuditLog(
          'પીસી ઓટો-સેવ ફાઇલ અનલોક કરેલ',
          'લોકલ બેકઅપ (PC Sync)',
          `ફાઇલ: ${fileHandle.name} માટે ઓટો-સેવ લિંક પુનઃસ્થાપિત કરાઈ.`
        );
      }
    } catch (err: any) {
      console.error("Failed to request permission:", err);
      alert("પરવાનગી આપવામાં અસમર્થ: " + err.message);
    }
  };

  const handleDisconnectPCFile = async () => {
    if (confirm("શું તમે આ ફાઇલ લિંક દૂર કરવા માંગો છો? આનાથી તમારા પીસીમાં સેવ થયેલી ફાઇલ ડીલીટ નહિ થાય, માત્ર કનેક્શન છૂટું પડશે.")) {
      try {
        await deleteFileHandleFromIndexedDB();
        setFileHandle(null);
        setFilePermissionGranted(false);
        setFileName('');
        addAuditLog(
          'પીસી ઓટો-સેવ ફાઇલ લિંક કટ કરેલ',
          'લોકલ બેકઅપ (PC Sync)',
          `ફાઇલ લિંક ડિસ્કનેક્ટ કરવામાં આવી.`
        );
      } catch (err) {
        console.error("Failed to delete file handle:", err);
      }
    }
  };

  // Live real-time clock state
  const [liveDateTime, setLiveDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLiveDateTime = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const strHours = String(hours).padStart(2, '0');

    const toGujDigit = (str: string) => {
      const map: Record<string, string> = {
        '0': '૦', '1': '૧', '2': '૨', '3': '૩', '4': '૪',
        '5': '૫', '6': '૬', '7': '૭', '8': '૮', '9': '૯'
      };
      return str.replace(/[0-9]/g, ch => map[ch] || ch);
    };

    const textTime = `${day}/${month}/${year} ${strHours}:${mins}:${secs} ${ampm}`;
    return toGujDigit(textTime);
  };

  // Global search states
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [globalResults, setGlobalResults] = useState<any[]>([]);

  // Super Admin Dedicated Auth States
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState<boolean>(false);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setGlobalSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to check if a user is one of the default mock users
  const isDefaultUser = (username: string, userObj?: UserType | null) => {
    const sessionUser = userObj || currentSessionUser;
    if (sessionUser) {
      if (sessionUser.isVendorRegistered) return false;
      if (
        sessionUser.trustNameGuj &&
        sessionUser.trustNameGuj !== 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ' &&
        sessionUser.trustNameGuj !== 'શ્રી સાર્વજનિક કલ્યાણ ટ્રસ્ટ'
      ) {
        return false;
      }
    }
    const uname = username ? username.toLowerCase() : '';
    const defaultUsernames = ['accountant', 'operator', 'readonly', 'system'];
    if (defaultUsernames.includes(uname)) return true;
    if (uname === 'admin') {
      if (
        sessionUser?.isVendorRegistered ||
        (sessionUser?.trustNameGuj &&
          sessionUser.trustNameGuj !== 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ' &&
          sessionUser.trustNameGuj !== 'શ્રી સાર્વજનિક કલ્યાણ ટ્રસ્ટ')
      ) {
        return false;
      }
      return !isActivated;
    }
    return false;
  };

  const isTabAllowedForRole = (tab: string, role: UserRole): boolean => {
    if (tab === 'dashboard') return true;
    if (role === 'Admin') return true;
    if (role === 'Accountant') {
      return !['users', 'settings'].includes(tab);
    }
    if (role === 'DataEntry' || role === 'ReadOnly') {
      return !['banks', 'accounting', 'backup', 'settings', 'users'].includes(tab);
    }
    return false;
  };

  const getTabTitleGuj = (tabId: string): string => {
    switch (tabId) {
      case 'dashboard': return 'ડેશબોર્ડ & એનાલિટિક્સ';
      case 'receipts': return 'આવક પાવતીઓ';
      case 'vouchers': return 'ખર્ચ વાઉચર્સ';
      case 'banks': return 'બેંક ખાતાઓ';
      case 'accounting': return 'દ્વિ-નોંધી નામું';
      case 'donors': return 'દાતાઓ';
      case 'members': return 'સભાસદો';
      case 'trust_members': return 'ટ્રસ્ટ હોદ્દેદારો';
      case 'assets': return 'સ્થાયી મિલકતો';
      case 'purchase_sales': return 'ખરીદી અને વેચાણ';
      case 'documents': return 'દસ્તાવેજો';
      case 'tharav': return 'એજન્ડા & ઠરાવ';
      case 'backup': return 'ઓટો બેકઅપ';
      case 'settings': return 'ટ્રસ્ટ સેટિંગ્સ';
      case 'users': return 'વપરાશકર્તાઓ';
      case 'superadmin': return 'સુપર એડમિન પેનલ';
      case 'audit_logs': return 'ઑડિટ લૉગ્સ';
      default: return tabId;
    }
  };

  // Enforce role-based tab access
  useEffect(() => {
    if (currentSessionUser) {
      const role = currentSessionUser.role;
      if (!isTabAllowedForRole(activeTab, role)) {
        setActiveTab('dashboard');
      }
    }
  }, [currentSessionUser, activeTab]);

  // Helper to get scoped key for localStorage
  const getScopedKey = (key: string) => {
    if (key === 'trust_licenses' || key === 'trust_users') {
      return key;
    }
    const currentTrustName = currentSessionUser?.trustNameGuj || trustSettings?.trustNameGuj;
    if (currentTrustName) {
      const cleanTrustName = currentTrustName.trim().toLowerCase().replace(/[\/\#\?\[\]\s]+/g, '_');
      return `${key}_${cleanTrustName}`;
    }
    if (currentSessionUser && !isDefaultUser(currentSessionUser.username)) {
      return `${key}_${currentSessionUser.username.toLowerCase()}`;
    }
    return key;
  };

  const isCustomUser = currentSessionUser ? !isDefaultUser(currentSessionUser.username) : false;

  // 1. Initialize and load global states (appUsers, licenses) and file handle on app mount
  useEffect(() => {
    // Clean up any dynamic local storage keys containing demo, test, or old demo trusts
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const lkey = key.toLowerCase();
        if (
          lkey.includes('_demo') ||
          lkey.includes('demo_') ||
          lkey === 'trust_settings_demo' ||
          lkey.includes('somnath') ||
          lkey.includes('sarvajanik') ||
          lkey.includes('gurukul')
        ) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    const storedUsers = localStorage.getItem('trust_users');
    let storedLic = localStorage.getItem('trust_licenses');
    const scopedLic = localStorage.getItem('trust_licenses_patelmunaf90@gmail.com');

    // Proactive migration check: If there are licenses stored under the Super Admin scoped key
    // that are not in the main global key, migrate/merge them to avoid data loss.
    if (scopedLic) {
      try {
        const parsedScoped = JSON.parse(scopedLic) as TrustLicense[];
        if (parsedScoped && parsedScoped.length > 0) {
          let currentList: TrustLicense[] = [];
          if (storedLic) {
            try {
              currentList = JSON.parse(storedLic) as TrustLicense[];
            } catch (e) {
              currentList = [];
            }
          }
          // Merge unique licenses from scoped storage into the global storage
          const mergedList = [...currentList];
          parsedScoped.forEach(scopedItem => {
            if (!mergedList.some(item => item.id === scopedItem.id || item.trustNameGuj === scopedItem.trustNameGuj)) {
              mergedList.push(scopedItem);
            }
          });
          
          if (mergedList.length > currentList.length) {
            storedLic = JSON.stringify(mergedList);
            localStorage.setItem('trust_licenses', storedLic);
          }
        }
      } catch (err) {
        console.error("Failed to migrate scoped licenses:", err);
      }
    }

    // 1. Load licenses first
    let loadedLic: TrustLicense[] = [];
    if (storedLic !== null) {
      try {
        const parsed = JSON.parse(storedLic) as TrustLicense[];
        if (Array.isArray(parsed)) {
          loadedLic = parsed;
        } else {
          loadedLic = DEFAULT_LICENSES;
        }
      } catch (e) {
        loadedLic = DEFAULT_LICENSES;
      }
    } else {
      loadedLic = DEFAULT_LICENSES;
      localStorage.setItem('trust_licenses', JSON.stringify(DEFAULT_LICENSES));
    }

    // Auto-repair licenses that were activated offline so they stay Active (only if loadedLic is not empty)
    const activatedTrustName = localStorage.getItem('trust_activated_name');
    const activationKey = localStorage.getItem('trust_activation_key');
    if ((activatedTrustName || activationKey) && loadedLic.length > 0) {
      loadedLic = loadedLic.map(l => {
        if (
          (activatedTrustName && l.trustNameGuj === activatedTrustName) ||
          (activationKey && l.licenseKey.trim().toUpperCase() === activationKey.trim().toUpperCase())
        ) {
          return { ...l, status: 'સક્રિય (Active)' as const };
        }
        return l;
      });
      localStorage.setItem('trust_licenses', JSON.stringify(loadedLic));
    }

    // CRITICAL: If there are real user trusts created (id !== 'lic_progressive'), exclude sample demo trust
    const hasRealTrusts = loadedLic.some(l => l.id !== 'lic_progressive');
    if (hasRealTrusts) {
      loadedLic = loadedLic.filter(l => l.id !== 'lic_progressive');
      localStorage.setItem('trust_licenses', JSON.stringify(loadedLic));
    }

    setLicenses(loadedLic);

    // 2. Load and merge users from global storage
    let loadedUsersList: UserType[] = [];
    if (storedUsers !== null) {
      try {
        const parsedUsers = JSON.parse(storedUsers) as UserType[];
        if (Array.isArray(parsedUsers)) {
          loadedUsersList = parsedUsers;
        } else {
          loadedUsersList = [...DEFAULT_USERS];
        }
      } catch (err) {
        console.error("Error parsing stored users:", err);
        loadedUsersList = [...DEFAULT_USERS];
      }
    } else {
      loadedUsersList = [...DEFAULT_USERS];
    }

    // Merge any users found in user-scoped keys in localStorage if first time load
    if (storedUsers === null) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('trust_users_')) {
          try {
            const scopedU = JSON.parse(localStorage.getItem(key) || '[]') as UserType[];
            if (Array.isArray(scopedU)) {
              scopedU.forEach(u => {
                const uT = (u.trustNameGuj || '').trim();
                if (uT && !loadedUsersList.some(ex => ex.username.toLowerCase() === u.username.toLowerCase() && (ex.trustNameGuj || '').trim() === uT)) {
                  loadedUsersList.push(u);
                }
              });
            }
          } catch (e) {}
        }
      }
    }

    // Deduplicate loadedUsersList per trust so there is strictly ONLY ONE user per username per trust
    const cleanedUsersList = loadedUsersList.reduce<UserType[]>((acc, u) => {
      const uTrust = (u.trustNameGuj || '').trim();
      if (!uTrust) return acc;
      // If real trusts exist, ignore users belonging to sample 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ'
      if (hasRealTrusts && uTrust === 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ') return acc;

      const existingIdx = acc.findIndex(
        ex => ex.username.trim().toLowerCase() === u.username.trim().toLowerCase() && (ex.trustNameGuj || '').trim() === uTrust
      );
      const userWithTrust = { ...u, trustNameGuj: uTrust };
      if (existingIdx === -1) {
        acc.push(userWithTrust);
      } else {
        if (u.isVendorRegistered || (!u.id.startsWith('usr1') && acc[existingIdx].id.startsWith('usr1'))) {
          acc[existingIdx] = userWithTrust;
        }
      }
      return acc;
    }, []);

    // Ensure ALL licenses in loadedLic have user records for Admin, Accountant, DataEntry, and ReadOnly
    loadedLic.forEach(lic => {
      const tName = lic.trustNameGuj.trim();
      if (!tName) return;

      const rolesNeeded: { role: UserRole; roleGuj: string; defaultUser: string; defaultPass: string }[] = [
        { role: 'Admin', roleGuj: 'પ્રશાસક (Administrator)', defaultUser: 'admin', defaultPass: 'admin123' },
        { role: 'Accountant', roleGuj: 'નામું રાખનાર (Accountant)', defaultUser: 'accountant', defaultPass: 'acc123' },
        { role: 'DataEntry', roleGuj: 'ડેટા એન્ટ્રી ઓપરેટર (Data Entry)', defaultUser: 'operator', defaultPass: 'op123' },
        { role: 'ReadOnly', roleGuj: 'માત્ર વાંચવા માટે (Read Only)', defaultUser: 'readonly', defaultPass: 'read123' }
      ];

      rolesNeeded.forEach(rn => {
        const hasUserForRole = cleanedUsersList.some(
          u => (u.trustNameGuj || '').trim() === tName && u.role === rn.role
        );
        if (!hasUserForRole) {
          cleanedUsersList.push({
            id: `usr-${rn.defaultUser}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            username: rn.defaultUser,
            passwordHash: rn.defaultPass,
            nameGuj: `${tName} (${rn.roleGuj.split(' ')[0]})`,
            role: rn.role,
            roleGuj: rn.roleGuj,
            isActive: true,
            trustNameGuj: tName,
            isVendorRegistered: true
          });
        }
      });
    });

    setAppUsers(cleanedUsersList);
    syncStorage('trust_users', cleanedUsersList);

    // Auto-select the active or newly registered trust for login dropdown on mount
    let targetSelectTrust = '';
    if (loadedLic.length > 0) {
      if (activatedTrustName && loadedLic.some(l => l.trustNameGuj === activatedTrustName)) {
        targetSelectTrust = activatedTrustName;
      } else {
        targetSelectTrust = loadedLic[0].trustNameGuj;
      }
    }

    setLoginSelectedTrust(targetSelectTrust);
    setLoginUsername('');
    setLoginPassword('');

    // Auto-migrate old demo activation keys to the official Progressive Welfare Trust license
    const currentKey = localStorage.getItem('trust_activation_key') || '';
    const currentActiveName = localStorage.getItem('trust_activated_name') || '';
    const isDemoKey = [
      'GUJ-TRST-2026-ACTIVATED',
      'SOMA-TRUST-9823-ACTV-8822',
      'SWAM-GURU-3399-ACTV-1200'
    ].includes(currentKey.toUpperCase()) || 
    currentActiveName.includes('સોમનાથ') || 
    currentActiveName.includes('સ્વામિનારાયણ') || 
    currentActiveName.includes('સાર્વજનિક');

    if (isDemoKey || (!currentKey && localStorage.getItem('trust_activated') === 'true')) {
      localStorage.setItem('trust_activated', 'true');
      localStorage.setItem('trust_activation_key', 'PROG-WELL-9823-ACTV-8822');
      localStorage.setItem('trust_activated_name', 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ');
      setIsActivated(true);
      setActivationKey('PROG-WELL-9823-ACTV-8822');
    }

    // 3. Process URL Query Parameters for instant customer setup & login on any mobile or PC
    try {
      const searchParams = new URLSearchParams(window.location.search);
      let incomingSetup: { key: string; trust: string; user: string; pass: string; email?: string; phone?: string; exp?: string } | null = null;

      const rawSetup = searchParams.get('setup');
      if (rawSetup) {
        try {
          const decoded = JSON.parse(decodeURIComponent(atob(rawSetup)));
          if (decoded.t && decoded.k) {
            incomingSetup = {
              key: decoded.k,
              trust: decoded.t,
              user: decoded.u || 'admin',
              pass: decoded.p || 'admin123',
              email: decoded.e || 'admin@trust.org',
              phone: decoded.m || '',
              exp: decoded.exp || '2099-12-31'
            };
          }
        } catch (e) {
          console.error("Failed to decode ?setup URL param", e);
        }
      } else if (searchParams.get('trust')) {
        incomingSetup = {
          key: searchParams.get('key') || 'TRST-' + Date.now(),
          trust: searchParams.get('trust') || '',
          user: searchParams.get('user') || 'admin',
          pass: searchParams.get('pass') || 'admin123',
          email: searchParams.get('email') || 'admin@trust.org',
          phone: searchParams.get('phone') || '',
          exp: searchParams.get('exp') || '2099-12-31'
        };
      }

      if (incomingSetup && incomingSetup.trust) {
        const tName = incomingSetup.trust.trim();
        const tKey = incomingSetup.key ? incomingSetup.key.trim() : 'TRST-' + Date.now();
        const tUser = incomingSetup.user.trim() || 'admin';
        const tPass = incomingSetup.pass.trim() || 'admin123';

        // Add or activate license in loadedLic
        const licIdx = loadedLic.findIndex(l => l.trustNameGuj === tName || l.licenseKey.trim().toUpperCase() === tKey.toUpperCase());
        if (licIdx >= 0) {
          loadedLic[licIdx] = { ...loadedLic[licIdx], status: 'સક્રિય (Active)', trustNameGuj: tName, licenseKey: tKey };
        } else {
          const newLic: TrustLicense = {
            id: 'lic-' + Date.now(),
            licenseKey: tKey,
            trustNameGuj: tName,
            registeredEmail: incomingSetup.email || 'admin@trust.org',
            registeredPhone: incomingSetup.phone || '9876543210',
            activationDate: new Date().toISOString().split('T')[0],
            expiryDate: incomingSetup.exp || '2099-12-31',
            status: 'સક્રિય (Active)',
            version: 'v4.2.0'
          };
          loadedLic.unshift(newLic);
        }
        localStorage.setItem('trust_licenses', JSON.stringify(loadedLic));
        setLicenses(loadedLic);

        // Add or update admin user in cleanedUsersList
        const uIdx = cleanedUsersList.findIndex(u => (u.trustNameGuj || '').trim() === tName && u.username.toLowerCase() === tUser.toLowerCase());
        const adminUserObj: UserType = {
          id: `usr-${tUser}-${Date.now()}`,
          username: tUser,
          passwordHash: tPass,
          nameGuj: `${tName} (પ્રશાસક)`,
          role: 'Admin',
          roleGuj: 'પ્રશાસક (Administrator)',
          isActive: true,
          trustNameGuj: tName,
          isVendorRegistered: true
        };
        if (uIdx >= 0) {
          cleanedUsersList[uIdx] = adminUserObj;
        } else {
          cleanedUsersList.unshift(adminUserObj);
        }

        // Add helper roles
        const rolesNeeded: { role: UserRole; roleGuj: string; defaultUser: string; defaultPass: string }[] = [
          { role: 'Accountant', roleGuj: 'નામું રાખનાર (Accountant)', defaultUser: 'accountant', defaultPass: 'acc123' },
          { role: 'DataEntry', roleGuj: 'ડેટા એન્ટ્રી ઓપરેટર (Data Entry)', defaultUser: 'operator', defaultPass: 'op123' },
          { role: 'ReadOnly', roleGuj: 'માત્ર વાંચવા માટે (Read Only)', defaultUser: 'readonly', defaultPass: 'read123' }
        ];
        rolesNeeded.forEach(rn => {
          if (!cleanedUsersList.some(u => (u.trustNameGuj || '').trim() === tName && u.role === rn.role)) {
            cleanedUsersList.push({
              id: `usr-${rn.defaultUser}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              username: rn.defaultUser,
              passwordHash: rn.defaultPass,
              nameGuj: `${tName} (${rn.roleGuj.split(' ')[0]})`,
              role: rn.role,
              roleGuj: rn.roleGuj,
              isActive: true,
              trustNameGuj: tName,
              isVendorRegistered: true
            });
          }
        });

        syncStorage('trust_users', cleanedUsersList);
        setAppUsers(cleanedUsersList);

        // Mark activated
        localStorage.setItem('trust_activated', 'true');
        localStorage.setItem('trust_activation_key', tKey);
        localStorage.setItem('trust_activated_name', tName);
        setIsActivated(true);
        setActivationKey(tKey);

        setLoginSelectedTrust(tName);
        setLoginUsername(tUser);
        setLoginPassword(tPass);
        setActivationSuccessMessage(`🎉 ${tName} નું સોફ્ટવેર લાયસન્સ સફળતાપૂર્વક સક્રિય થઈ ગયું છે! આપેલ આઈડી અને પાસવર્ડથી સીધા પ્રવેશ કરો.`);

        // Clean query parameters from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (urlErr) {
      console.error("URL setup processing error:", urlErr);
    }

    // Check IndexedDB for linked file handle on app mount
    const checkLinkedFile = async () => {
      try {
        const handle = await getFileHandleFromIndexedDB();
        if (handle) {
          setFileHandle(handle);
          setFileName(handle.name);
          const permission = await handle.queryPermission({ mode: 'readwrite' });
          if (permission === 'granted') {
            setFilePermissionGranted(true);
          } else {
            setFilePermissionGranted(false);
          }
        }
      } catch (err) {
        console.error("Failed to load linked file from IndexedDB:", err);
      }
    };
    checkLinkedFile();
  }, []);

  // 2. Load user-specific transactional and setting data when currentSessionUser changes
  useEffect(() => {
    if (!currentSessionUser) return;

    const trustName = currentSessionUser.trustNameGuj;
    const isCustom = !isDefaultUser(currentSessionUser.username);

    const scopeSuffix = trustName 
      ? `_${trustName.trim().toLowerCase().replace(/[\/\#\?\[\]\s]+/g, '_')}`
      : isCustom ? `_${currentSessionUser.username.toLowerCase()}` : '';

    const getScopedKeyLocal = (key: string) => {
      return (trustName || isCustom) ? `${key}${scopeSuffix}` : key;
    };

    // Load Settings
    const storedSettings = localStorage.getItem(getScopedKeyLocal('trust_settings'));
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings) as TrustSettings;
      if (trustName) {
        parsed.trustNameGuj = trustName;
      }
      setTrustSettings(parsed);
      localStorage.setItem(getScopedKeyLocal('trust_settings'), JSON.stringify(parsed));
    } else {
      const initialSettings: TrustSettings = {
        ...DEFAULT_TRUST_SETTINGS,
        trustNameGuj: trustName || DEFAULT_TRUST_SETTINGS.trustNameGuj,
        trustNameEng: '',
        regNoGuj: '',
        addressGuj: '',
        phone: '',
        email: '',
        panNumber: '',
        tanNumber: '',
        section12ANo: '',
        section80GNo: '',
        openingCashBalance: 0
      };
      setTrustSettings(initialSettings);
      localStorage.setItem(getScopedKeyLocal('trust_settings'), JSON.stringify(initialSettings));
    }

    // Load Donors
    const storedDonors = localStorage.getItem(getScopedKeyLocal('trust_donors'));
    if (storedDonors) {
      setDonors(JSON.parse(storedDonors));
    } else {
      const initialDonors = isCustom ? [] : DEFAULT_DONORS;
      setDonors(initialDonors);
      localStorage.setItem(getScopedKeyLocal('trust_donors'), JSON.stringify(initialDonors));
    }

    // Load Receipts
    const storedReceipts = localStorage.getItem(getScopedKeyLocal('trust_receipts'));
    if (storedReceipts) {
      const parsedReceipts: IncomeReceipt[] = JSON.parse(storedReceipts);
      const cleanReceipts = parsedReceipts.filter(
        r => !r.donorNameGuj?.includes('ડેમો') && r.chequeNumber !== '987654' && !r.remarksGuj?.includes('ડેમો')
      );
      setReceipts(cleanReceipts);
      if (cleanReceipts.length !== parsedReceipts.length) {
        localStorage.setItem(getScopedKeyLocal('trust_receipts'), JSON.stringify(cleanReceipts));
      }
    } else {
      const initialReceipts = isCustom ? [] : DEFAULT_INCOME_RECEIPTS;
      setReceipts(initialReceipts);
      localStorage.setItem(getScopedKeyLocal('trust_receipts'), JSON.stringify(initialReceipts));
    }

    // Load Vouchers
    const storedVouchers = localStorage.getItem(getScopedKeyLocal('trust_vouchers'));
    if (storedVouchers) {
      setVouchers(JSON.parse(storedVouchers));
    } else {
      const initialVouchers = isCustom ? [] : DEFAULT_EXPENSE_VOUCHERS;
      setVouchers(initialVouchers);
      localStorage.setItem(getScopedKeyLocal('trust_vouchers'), JSON.stringify(initialVouchers));
    }

    // Load Banks
    const storedBanks = localStorage.getItem(getScopedKeyLocal('trust_banks'));
    if (storedBanks) {
      setBanks(JSON.parse(storedBanks));
    } else {
      const initialBanks = isCustom ? [] : DEFAULT_BANK_ACCOUNTS;
      setBanks(initialBanks);
      localStorage.setItem(getScopedKeyLocal('trust_banks'), JSON.stringify(initialBanks));
    }

    // Load Members
    const storedMembers = localStorage.getItem(getScopedKeyLocal('trust_members'));
    if (storedMembers) {
      setMembers(JSON.parse(storedMembers));
    } else {
      const initialMembers = isCustom ? [] : DEFAULT_MEMBERS;
      setMembers(initialMembers);
      localStorage.setItem(getScopedKeyLocal('trust_members'), JSON.stringify(initialMembers));
    }

    // Load Assets
    const storedAssets = localStorage.getItem(getScopedKeyLocal('trust_assets'));
    if (storedAssets) {
      setAssets(JSON.parse(storedAssets));
    } else {
      const initialAssets = isCustom ? [] : DEFAULT_ASSETS;
      setAssets(initialAssets);
      localStorage.setItem(getScopedKeyLocal('trust_assets'), JSON.stringify(initialAssets));
    }

    // Load Documents
    const storedDocs = localStorage.getItem(getScopedKeyLocal('trust_documents'));
    if (storedDocs) {
      setDocuments(JSON.parse(storedDocs));
    } else {
      const initialDocs = isCustom ? [] : DEFAULT_DOCUMENTS;
      setDocuments(initialDocs);
      localStorage.setItem(getScopedKeyLocal('trust_documents'), JSON.stringify(initialDocs));
    }

    // Load Tharavs
    const storedTharavs = localStorage.getItem(getScopedKeyLocal('trust_tharavs'));
    if (storedTharavs) {
      setTharavs(JSON.parse(storedTharavs));
    } else {
      const initialTharavs = isCustom ? [] : DEFAULT_THARAVS;
      setTharavs(initialTharavs);
      localStorage.setItem(getScopedKeyLocal('trust_tharavs'), JSON.stringify(initialTharavs));
    }

    // Load Audit Logs
    const storedAudit = localStorage.getItem(getScopedKeyLocal('trust_audit_logs'));
    if (storedAudit) {
      setAuditLogs(JSON.parse(storedAudit));
    } else {
      const initialAudit = isCustom ? [] : DEFAULT_AUDIT_LOGS;
      setAuditLogs(initialAudit);
      localStorage.setItem(getScopedKeyLocal('trust_audit_logs'), JSON.stringify(initialAudit));
    }

    // Load Reconciliation
    const storedRecon = localStorage.getItem(getScopedKeyLocal('trust_reconciliation'));
    if (storedRecon) {
      const parsedRecon = JSON.parse(storedRecon);
      const cleanRecon = parsedRecon.filter(
        (item: any) => !item.desc?.includes('ડેમો') && item.num !== '987654' && !item.partyName?.includes('ડેમો')
      );
      setReconciliationList(cleanRecon);
      if (cleanRecon.length !== parsedRecon.length) {
        localStorage.setItem(getScopedKeyLocal('trust_reconciliation'), JSON.stringify(cleanRecon));
      }
    } else {
      const initialRecon: any[] = [];
      setReconciliationList(initialRecon);
      localStorage.setItem(getScopedKeyLocal('trust_reconciliation'), JSON.stringify(initialRecon));
    }

    // Load Inventory Items
    const storedInventory = localStorage.getItem(getScopedKeyLocal('trust_inventory_items'));
    if (storedInventory) {
      setInventoryItems(JSON.parse(storedInventory));
    } else {
      const initialInventory = isCustom ? [] : DEFAULT_INVENTORY_ITEMS;
      setInventoryItems(initialInventory);
      localStorage.setItem(getScopedKeyLocal('trust_inventory_items'), JSON.stringify(initialInventory));
    }

    // Load Purchase Bills
    const storedPurchases = localStorage.getItem(getScopedKeyLocal('trust_purchase_bills'));
    if (storedPurchases) {
      setPurchaseBills(JSON.parse(storedPurchases));
    } else {
      const initialPurchases = isCustom ? [] : DEFAULT_PURCHASE_BILLS;
      setPurchaseBills(initialPurchases);
      localStorage.setItem(getScopedKeyLocal('trust_purchase_bills'), JSON.stringify(initialPurchases));
    }

    // Load Sales Bills
    const storedSales = localStorage.getItem(getScopedKeyLocal('trust_sales_bills'));
    if (storedSales) {
      setSalesBills(JSON.parse(storedSales));
    } else {
      const initialSales = isCustom ? [] : DEFAULT_SALES_BILLS;
      setSalesBills(initialSales);
      localStorage.setItem(getScopedKeyLocal('trust_sales_bills'), JSON.stringify(initialSales));
    }

    // Load Share Purchases
    const storedShares = localStorage.getItem(getScopedKeyLocal('trust_share_purchases'));
    if (storedShares) {
      setSharePurchases(JSON.parse(storedShares));
    } else {
      const initialShares = isCustom ? [] : DEFAULT_SHARE_PURCHASES;
      setSharePurchases(initialShares);
      localStorage.setItem(getScopedKeyLocal('trust_share_purchases'), JSON.stringify(initialShares));
    }

    // Load Loan Applications
    const storedLoans = localStorage.getItem(getScopedKeyLocal('trust_loan_applications'));
    if (storedLoans) {
      setLoanApplications(JSON.parse(storedLoans));
    } else {
      const initialLoans = isCustom ? [] : DEFAULT_LOAN_APPLICATIONS;
      setLoanApplications(initialLoans);
      localStorage.setItem(getScopedKeyLocal('trust_loan_applications'), JSON.stringify(initialLoans));
    }
  }, [currentSessionUser?.id, currentSessionUser?.username]);

  // Auto-save database to PC File if connected and permitted
  useEffect(() => {
    if (!fileHandle || !filePermissionGranted) return;

    const triggerAutoSave = async () => {
      try {
        setIsSyncingToPC(true);
        const payload = {
          trust_donors: donors,
          trust_receipts: receipts,
          trust_vouchers: vouchers,
          trust_banks: banks,
          trust_members: members,
          trust_assets: assets,
          trust_documents: documents,
          trust_tharavs: tharavs,
          trust_audit_logs: auditLogs,
          trust_licenses: licenses,
          trust_settings: trustSettings,
          trust_reconciliation: reconciliationList,
          trust_inventory_items: inventoryItems,
          trust_purchase_bills: purchaseBills,
          trust_sales_bills: salesBills,
          last_saved_at: new Date().toISOString()
        };
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(payload, null, 2));
        await writable.close();
        
        // Brief visual success indicator
        setTimeout(() => setIsSyncingToPC(false), 600);
      } catch (err) {
        console.error("Auto-save to local PC file failed:", err);
        setIsSyncingToPC(false);
      }
    };

    const timer = setTimeout(triggerAutoSave, 600);
    return () => clearTimeout(timer);
  }, [donors, receipts, vouchers, banks, members, assets, documents, tharavs, auditLogs, licenses, trustSettings, reconciliationList, inventoryItems, purchaseBills, salesBills, fileHandle, filePermissionGranted]);

  // Real-time Cloud synchronization for master licenses and users across all devices (Mobile / PC)
  useEffect(() => {
    if (isElectronOfflineApp() || appMode === 'offline' || !navigator.onLine) return;

    // Load initial system master from Firestore
    loadSystemMasterFromFirebase().then(res => {
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
    });

    return () => {
      unsubMaster();
    };
  }, [appMode, isOnline]);

  // Real-time Cloud synchronization for current logged in Trust's data
  useEffect(() => {
    if (!isLoggedIn || !currentSessionUser || isElectronOfflineApp() || appMode === 'offline' || !navigator.onLine) return;
    const targetTrust = currentSessionUser.trustNameGuj || 'મુખ્ય ટ્રસ્ટ';
    
    // Automatically fetch full trust data on login
    fetchFromFirebaseCloud(true);

    // Live subscription to trust dataset
    const unsubscribe = subscribeToTrustFirebase(targetTrust, (cloudData) => {
      if (!cloudData) return;
      const dnr = cloudData.trust_donors || cloudData.donors;
      if (dnr) {
        setDonors(prev => {
          const merged = mergeList(prev, dnr);
          localStorage.setItem(getScopedKey('trust_donors'), JSON.stringify(merged));
          return merged;
        });
      }
      const rcp = cloudData.trust_receipts || cloudData.receipts;
      if (rcp) {
        setReceipts(prev => {
          const merged = mergeList(prev, rcp);
          localStorage.setItem(getScopedKey('trust_receipts'), JSON.stringify(merged));
          return merged;
        });
      }
      const vch = cloudData.trust_vouchers || cloudData.vouchers;
      if (vch) {
        setVouchers(prev => {
          const merged = mergeList(prev, vch);
          localStorage.setItem(getScopedKey('trust_vouchers'), JSON.stringify(merged));
          return merged;
        });
      }
      const bnk = cloudData.trust_banks || cloudData.banks;
      if (bnk) {
        setBanks(prev => {
          const merged = mergeList(prev, bnk);
          localStorage.setItem(getScopedKey('trust_banks'), JSON.stringify(merged));
          return merged;
        });
      }
      const mbr = cloudData.trust_members || cloudData.members;
      if (mbr) {
        setMembers(prev => {
          const merged = mergeList(prev, mbr);
          localStorage.setItem(getScopedKey('trust_members'), JSON.stringify(merged));
          return merged;
        });
      }
      const ast = cloudData.trust_assets || cloudData.assets;
      if (ast) {
        setAssets(prev => {
          const merged = mergeList(prev, ast);
          localStorage.setItem(getScopedKey('trust_assets'), JSON.stringify(merged));
          return merged;
        });
      }
      const docList = cloudData.trust_documents || cloudData.documents;
      if (docList) {
        setDocuments(prev => {
          const merged = mergeList(prev, docList);
          localStorage.setItem(getScopedKey('trust_documents'), JSON.stringify(merged));
          return merged;
        });
      }
      const thr = cloudData.trust_tharavs || cloudData.tharavs;
      if (thr) {
        setTharavs(prev => {
          const merged = mergeList(prev, thr);
          localStorage.setItem(getScopedKey('trust_tharavs'), JSON.stringify(merged));
          return merged;
        });
      }
      const setts = cloudData.trust_settings || cloudData.trustSettings;
      if (setts) { setTrustSettings(setts); localStorage.setItem(getScopedKey('trust_settings'), JSON.stringify(setts)); }
      const rcn = cloudData.trust_reconciliation || cloudData.reconciliationList;
      if (rcn) {
        setReconciliationList(prev => {
          const merged = mergeList(prev, rcn);
          localStorage.setItem(getScopedKey('trust_reconciliation'), JSON.stringify(merged));
          return merged;
        });
      }
      const inv = cloudData.trust_inventory_items || cloudData.inventoryItems;
      if (inv) {
        setInventoryItems(prev => {
          const merged = mergeList(prev, inv);
          localStorage.setItem(getScopedKey('trust_inventory_items'), JSON.stringify(merged));
          return merged;
        });
      }
      const pb = cloudData.trust_purchase_bills || cloudData.purchaseBills;
      if (pb) {
        setPurchaseBills(prev => {
          const merged = mergeList(prev, pb);
          localStorage.setItem(getScopedKey('trust_purchase_bills'), JSON.stringify(merged));
          return merged;
        });
      }
      const sb = cloudData.trust_sales_bills || cloudData.salesBills;
      if (sb) {
        setSalesBills(prev => {
          const merged = mergeList(prev, sb);
          localStorage.setItem(getScopedKey('trust_sales_bills'), JSON.stringify(merged));
          return merged;
        });
      }
      const sp = cloudData.trust_share_purchases || cloudData.sharePurchases;
      if (sp) {
        setSharePurchases(prev => {
          const merged = mergeList(prev, sp);
          localStorage.setItem(getScopedKey('trust_share_purchases'), JSON.stringify(merged));
          return merged;
        });
      }
      const la = cloudData.trust_loan_applications || cloudData.loanApplications;
      if (la) {
        setLoanApplications(prev => {
          const merged = mergeList(prev, la);
          localStorage.setItem(getScopedKey('trust_loan_applications'), JSON.stringify(merged));
          return merged;
        });
      }
      const nowTime = new Date().toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastFirebaseSyncTime(nowTime);
    });

    return () => unsubscribe();
  }, [isLoggedIn, currentSessionUser?.id, currentSessionUser?.trustNameGuj, appMode]);

  // Sync state helpers
  const syncStorage = (key: string, data: any) => {
    localStorage.setItem(getScopedKey(key), JSON.stringify(data));
    // If running in Online Web mode, sync to Google Firebase Firestore
    if (!isElectronOfflineApp() && navigator.onLine && appMode !== 'offline') {
      const targetTrust = currentSessionUser?.trustNameGuj || trustSettings?.trustNameGuj || 'મુખ્ય ટ્રસ્ટ';
      if (key === 'trust_licenses') {
        saveSystemMasterToFirebase(data, undefined);
      } else if (key === 'trust_users') {
        saveSystemMasterToFirebase(undefined, data);
      } else {
        saveTrustDatasetToFirebase(targetTrust, key, data);
      }
    }
  };

  const addAuditLog = (actionGuj: string, moduleGuj: string, detailsGuj: string) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      username: currentSessionUser?.username || 'system',
      actionGuj,
      moduleGuj,
      detailsGuj
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    syncStorage('trust_audit_logs', updated);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = loginUsername.trim().toLowerCase();
    const cleanPass = loginPassword.trim();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      // Direct Super Admin Login via main App Login Screen
      const isSuperAdminUser = cleanUser === 'patelmunaf90@gmail.com' || cleanUser === 'superadmin' || cleanUser === 'patelmunaf90';
      const isSuperAdminPass = cleanPass === 'munaf786' || cleanPass === 'admin123' || cleanPass === 'superadmin' || cleanPass.toLowerCase() === 'munaf786';
      if (isSuperAdminUser && isSuperAdminPass) {
        const superAdminUser: UserType = {
          id: 'superadmin-master',
          username: 'patelmunaf90@gmail.com',
          passwordHash: cleanPass,
          nameGuj: 'સુપર એડમિન (વેન્ડર)',
          roleGuj: 'સોફ્ટવેર વેન્ડર એડમિનિસ્ટ્રેટર',
          role: 'Admin',
          isActive: true
        };
        setLoginError(null);
        setIsSuperAdminAuthenticated(true);
        setCurrentSessionUser(superAdminUser);
        setIsLoggedIn(true);
        setActiveTab('superadmin');
        setLoginUsername('');
        setLoginPassword('');
        addAuditLog(
          'સુપર એડમિન સફળ લોગિન',
          'વેન્ડર કંટ્રોલ (Super Admin)',
          'સુપર એડમિન દ્વારા મુખ્ય લોગિન સ્ક્રીન વડે સફળતાપૂર્વક લાયસન્સિંગ પેનલમાં પ્રવેશ કરાયો.'
        );
        return;
      }

      // 1. Refresh from Google Firebase Firestore to ensure all accounts created on PC or other devices are present
      let currentLicList = licenses;
      let currentUserList = appUsers;

      if (!isElectronOfflineApp() && navigator.onLine && appMode !== 'offline') {
        try {
          const remoteMaster = await loadSystemMasterFromFirebase();
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
          }
        } catch (fbErr) {
          console.warn("Could not query Firebase for login verification, using local state:", fbErr);
        }
      }

      const normalizeStr = (s?: string) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();

      // Find user matching username & password (and selected trust if specified)
      let matchedUser = currentUserList.find(u => {
        const uName = normalizeStr(u.username);
        const uPass = (u.passwordHash || '').trim();
        const matchesCreds = uName === cleanUser && (uPass === cleanPass || uPass.toLowerCase() === cleanPass.toLowerCase());
        if (!matchesCreds) return false;
        if (loginSelectedTrust && loginSelectedTrust !== 'all' && loginSelectedTrust.trim() !== '') {
          return normalizeStr(u.trustNameGuj) === normalizeStr(loginSelectedTrust);
        }
        return true;
      });

      // If not found with trust filter, try without filter
      if (!matchedUser) {
        matchedUser = currentUserList.find(u => {
          const uName = normalizeStr(u.username);
          const uPass = (u.passwordHash || '').trim();
          return uName === cleanUser && (uPass === cleanPass || uPass.toLowerCase() === cleanPass.toLowerCase());
        });
      }

      // If still not found, check default users
      if (!matchedUser) {
        const defaultMatch = DEFAULT_USERS.find(u => {
          const uName = normalizeStr(u.username);
          const uPass = (u.passwordHash || '').trim();
          const matchesCreds = uName === cleanUser && (uPass === cleanPass || uPass.toLowerCase() === cleanPass.toLowerCase());
          if (!matchesCreds) return false;
          if (loginSelectedTrust && loginSelectedTrust !== 'all' && loginSelectedTrust.trim() !== '') {
            return normalizeStr(u.trustNameGuj) === normalizeStr(loginSelectedTrust);
          }
          return true;
        });
        if (defaultMatch) {
          matchedUser = defaultMatch;
        }
      }

      if (!matchedUser) {
        setLoginError('અમાન્ય યુઝરનેમ અથવા પાસવર્ડ. કૃપા કરીને સાચી વિગતો દાખલ કરો.');
        return;
      }

      // Check if the user's trust license is active (not deactivated or expired)
      const userTrustName = (matchedUser.trustNameGuj || '').trim();
      const matchedLicense = currentLicList.find(l => normalizeStr(l.trustNameGuj) === normalizeStr(userTrustName));
      if (matchedLicense) {
        const isStatusActive = matchedLicense.status.startsWith('સક્રિય') || 
                               (matchedLicense.status.toLowerCase().includes('active') && 
                                !matchedLicense.status.toLowerCase().includes('in') &&
                                !matchedLicense.status.toLowerCase().includes('deactivat'));
        if (!isStatusActive) {
          setLoginError('પ્રવેશ નામંજૂર: આ ટ્રસ્ટ ડી-એક્ટિવેટ (Deactivated / Inactive) કરવામાં આવ્યું છે. લોગિન કરી શકાશે નહીં.');
          return;
        }
      }

      if (matchedUser.isActive === false) {
        setLoginError('પ્રવેશ નામંજૂર: તમારું યુઝર એકાઉન્ટ ડી-એક્ટિવેટ (Deactivated / Inactive) કરેલ છે. લોગિન કરી શકાશે નહીં.');
        return;
      }

      setLoginError(null);
      setIsSuperAdminAuthenticated(false);
      setCurrentSessionUser(matchedUser);
      setIsLoggedIn(true);
      setActiveTab('control_panel');

      if (userTrustName) {
        setTrustSettings(prev => ({
          ...prev,
          trustNameGuj: userTrustName
        }));
      }

      // Fetch cloud data for this trust immediately
      if (!isElectronOfflineApp() && navigator.onLine && appMode !== 'offline') {
        fetchFromFirebaseCloud(true, userTrustName || undefined);
      }

      // Log audit
      const updatedLogs = [
        {
          id: 'log-' + Date.now(),
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          username: matchedUser.username,
          actionGuj: 'વપરાશકર્તા સફળ લોગિન',
          moduleGuj: 'પ્રવેશ (Auth)',
          detailsGuj: `${matchedUser.nameGuj} દ્વારા ${matchedUser.roleGuj} હોદ્દા સાથે સિસ્ટમમાં પ્રવેશ કરાયો.`
        },
        ...auditLogs
      ];
      setAuditLogs(updatedLogs);
      syncStorage('trust_audit_logs', updatedLogs);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    addAuditLog('વપરાશકર્તા લોગઆઉટ', 'પ્રવેશ (Auth)', `${currentSessionUser?.nameGuj || 'યુઝર'} એ સિસ્ટમમાંથી બહાર નીકળ્યા.`);
    setIsLoggedIn(false);
    setIsSuperAdminAuthenticated(false);
    setCurrentSessionUser(null);
    setLoginUsername('');
    setLoginPassword('');
    setActiveTab('dashboard');
  };

  const handleSuperAdminLogout = () => {
    addAuditLog('સુપર એડમિન લોગઆઉટ', 'વેન્ડર કંટ્રોલ (Super Admin)', 'સુપર એડમિન સેશન સમાપ્ત.');
    setIsSuperAdminAuthenticated(false);
    setIsLoggedIn(false);
    setCurrentSessionUser(null);
    setLoginUsername('');
    setLoginPassword('');
    setActiveTab('dashboard');
  };

  // Theme Changer
  const toggleTheme = () => {
    const target = !darkMode;
    setDarkMode(target);
    localStorage.setItem('theme', target ? 'dark' : 'light');
  };

  // --- ACTIONS HANDLERS ---

  // Income Receipt Handlers
  const handleAddReceipt = (newR: Omit<IncomeReceipt, 'id' | 'receiptNumber'> & { receiptNumber?: string; customDonorPhone?: string; customDonorPan?: string }) => {
    let receiptNumber = newR.receiptNumber;
    if (!receiptNumber) {
      const highestNum = receipts.reduce((max, r) => {
        const match = r.receiptNumber?.match(/\d+$/);
        const num = match ? parseInt(match[0], 10) : 0;
        return Math.max(max, isNaN(num) ? 0 : num);
      }, 0);
      const seq = Math.max(highestNum + 1, receipts.length + 1);
      const padSeq = String(seq).padStart(4, '0');
      receiptNumber = `TR-2026-${padSeq}`;
    }

    const receipt: IncomeReceipt = {
      ...newR,
      id: 'rcp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      receiptNumber
    };

    const updatedReceipts = [receipt, ...receipts];
    setReceipts(updatedReceipts);
    syncStorage('trust_receipts', updatedReceipts);

    // If new donor name provided and donor doesn't exist, auto-register in donors
    if (newR.donorNameGuj && newR.donorNameGuj !== 'અજ્ઞાત દાતા' && newR.donorNameGuj !== 'બેંક વ્યાજ / અન્ય જમા (Bank Interest)') {
      const donorExists = donors.some(d => d.nameGuj.trim().toLowerCase() === newR.donorNameGuj.trim().toLowerCase());
      if (!donorExists) {
        const newDonor: Donor = {
          id: (newR.donorId && !newR.donorId.startsWith('new')) ? newR.donorId : ('dnr-' + Date.now() + '-' + Math.floor(Math.random() * 1000)),
          nameGuj: newR.donorNameGuj,
          phone: newR.customDonorPhone || '',
          panNumber: newR.customDonorPan || '',
          aadharNumber: '',
          email: '',
          addressGuj: 'સ્થાનિક',
          createdAt: new Date().toISOString()
        };
        const updatedDonors = [newDonor, ...donors];
        setDonors(updatedDonors);
        syncStorage('trust_donors', updatedDonors);
      }
    }

    // If it's bank payment, update bank balance
    if (newR.paymentMode !== 'રોકડ (Cash)' && newR.bankId) {
      const updatedBanks = banks.map(b => {
        if (b.id === newR.bankId) {
          return { ...b, balance: (b.balance || 0) + newR.amount };
        }
        return b;
      });
      setBanks(updatedBanks);
      syncStorage('trust_banks', updatedBanks);
    }

    addAuditLog(
      'નવી પાવતી ઉમેરાઈ',
      'આવક (Income)',
      `પાવતી નં: ${receiptNumber}, રકમ: ₹ ${newR.amount}, સ્ત્રોત: ${newR.category}`
    );
  };

  const handleDeleteReceipt = (id: string) => {
    const target = receipts.find(r => r.id === id);
    if (!target) return;

    const updatedReceipts = receipts.map(r => {
      if (r.id === id) return { ...r, isDeleted: true };
      return r;
    });
    setReceipts(updatedReceipts);
    syncStorage('trust_receipts', updatedReceipts);

    // Revert Bank Balance if bank transfer was used
    if (target.paymentMode !== 'રોકડ (Cash)' && target.bankId) {
      const updatedBanks = banks.map(b => {
        if (b.id === target.bankId) {
          return { ...b, balance: b.balance - target.amount };
        }
        return b;
      });
      setBanks(updatedBanks);
      syncStorage('trust_banks', updatedBanks);
    }

    addAuditLog(
      'પાવતી રદ કરવામાં આવી',
      'આવક (Income)',
      `પાવતી નં: ${target.receiptNumber} રદ કરાઈ. રકમ: ₹ ${target.amount}`
    );
  };

  const handleEditReceipt = (updatedReceipt: IncomeReceipt) => {
    const oldReceipt = receipts.find(r => r.id === updatedReceipt.id);
    if (!oldReceipt) return;

    const updatedReceipts = receipts.map(r => r.id === updatedReceipt.id ? updatedReceipt : r);
    setReceipts(updatedReceipts);
    syncStorage('trust_receipts', updatedReceipts);

    if (oldReceipt.paymentMode !== 'રોકડ (Cash)' && oldReceipt.bankId) {
      setBanks(prev => prev.map(b => b.id === oldReceipt.bankId ? { ...b, balance: b.balance - oldReceipt.amount } : b));
    }
    if (updatedReceipt.paymentMode !== 'રોકડ (Cash)' && updatedReceipt.bankId) {
      setBanks(prev => prev.map(b => b.id === updatedReceipt.bankId ? { ...b, balance: b.balance + updatedReceipt.amount } : b));
    }

    addAuditLog(
      'પાવતી સુધારવામાં આવી',
      'આવક (Income)',
      `પાવતી નં: ${updatedReceipt.receiptNumber}, નવી રકમ: ₹ ${updatedReceipt.amount}`
    );
  };

  // Expense Voucher Handlers
  const handleAddVoucher = (newV: Omit<ExpenseVoucher, 'id' | 'voucherNumber'> & { voucherNumber?: string }) => {
    let voucherNumber = newV.voucherNumber;
    if (!voucherNumber) {
      const highestNum = vouchers.reduce((max, v) => {
        const match = v.voucherNumber?.match(/\d+$/);
        const num = match ? parseInt(match[0], 10) : 0;
        return Math.max(max, isNaN(num) ? 0 : num);
      }, 0);
      const seq = Math.max(highestNum + 1, vouchers.length + 1);
      const padSeq = String(seq).padStart(4, '0');
      voucherNumber = `EX-2026-${padSeq}`;
    }

    const voucher: ExpenseVoucher = {
      ...newV,
      id: 'vch-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      voucherNumber
    };

    const updatedVouchers = [voucher, ...vouchers];
    setVouchers(updatedVouchers);
    syncStorage('trust_vouchers', updatedVouchers);

    // If it's bank payment, deduct bank balance
    if (newV.paymentMode !== 'રોકડ (Cash)' && newV.bankId) {
      const updatedBanks = banks.map(b => {
        if (b.id === newV.bankId) {
          return { ...b, balance: (b.balance || 0) - newV.amount };
        }
        return b;
      });
      setBanks(updatedBanks);
      syncStorage('trust_banks', updatedBanks);
    }

    addAuditLog(
      'નવું ખર્ચ વાઉચર નોંધાયું',
      'ખર્ચ (Expense)',
      `વાઉચર નં: ${voucherNumber}, રકમ: ₹ ${newV.amount}, ચૂકવણી હેતુ: ${newV.category}`
    );
  };

  const handleDeleteVoucher = (id: string) => {
    const target = vouchers.find(v => v.id === id);
    if (!target) return;

    const updatedVouchers = vouchers.map(v => {
      if (v.id === id) return { ...v, isDeleted: true };
      return v;
    });
    setVouchers(updatedVouchers);
    syncStorage('trust_vouchers', updatedVouchers);

    // Refund bank balance
    if (target.paymentMode !== 'રોકડ (Cash)' && target.bankId) {
      const updatedBanks = banks.map(b => {
        if (b.id === target.bankId) {
          return { ...b, balance: b.balance + target.amount };
        }
        return b;
      });
      setBanks(updatedBanks);
      syncStorage('trust_banks', updatedBanks);
    }

    addAuditLog(
      'ખર્ચ વાઉચર રદ કરાયું',
      'ખર્ચ (Expense)',
      `વાઉચર નં: ${target.voucherNumber} રદ કરાયું. રકમ: ₹ ${target.amount}`
    );
  };

  const handleEditVoucher = (updatedVoucher: ExpenseVoucher) => {
    const oldVoucher = vouchers.find(v => v.id === updatedVoucher.id);
    if (!oldVoucher) return;

    const updatedVouchers = vouchers.map(v => v.id === updatedVoucher.id ? updatedVoucher : v);
    setVouchers(updatedVouchers);
    syncStorage('trust_vouchers', updatedVouchers);

    if (oldVoucher.paymentMode !== 'રોકડ (Cash)' && oldVoucher.bankId) {
      setBanks(prev => prev.map(b => b.id === oldVoucher.bankId ? { ...b, balance: b.balance + oldVoucher.amount } : b));
    }
    if (updatedVoucher.paymentMode !== 'રોકડ (Cash)' && updatedVoucher.bankId) {
      setBanks(prev => prev.map(b => b.id === updatedVoucher.bankId ? { ...b, balance: b.balance - updatedVoucher.amount } : b));
    }

    addAuditLog(
      'ખર્ચ વાઉચર સુધારવામાં આવ્યું',
      'ખર્ચ (Expense)',
      `વાઉચર નં: ${updatedVoucher.voucherNumber}, નવી રકમ: ₹ ${updatedVoucher.amount}`
    );
  };

  // Inventory Items Handlers
  const handleAddInventoryItem = (newI: Omit<InventoryItem, 'id' | 'currentStock'>) => {
    const item: InventoryItem = {
      ...newI,
      id: 'itm-' + Date.now(),
      currentStock: newI.openingStock
    };
    const updated = [item, ...inventoryItems];
    setInventoryItems(updated);
    syncStorage('trust_inventory_items', updated);

    addAuditLog(
      'નવી પ્રોડક્ટ આઇટમ ઉમેરવામાં આવી',
      'ઇન્વેન્ટરી (Inventory)',
      `વસ્તુ: ${newI.nameGuj}, SKU: ${newI.sku}, શરૂઆતનો સ્ટોક: ${newI.openingStock}`
    );
  };

  const handleEditInventoryItem = (updatedItem: InventoryItem) => {
    const updated = inventoryItems.map(i => i.id === updatedItem.id ? updatedItem : i);
    setInventoryItems(updated);
    syncStorage('trust_inventory_items', updated);

    addAuditLog(
      'પ્રોડક્ટ આઇટમમાં ફેરફાર કરાયો',
      'ઇન્વેન્ટરી (Inventory)',
      `વસ્તુ: ${updatedItem.nameGuj}, SKU: ${updatedItem.sku}`
    );
  };

  const handleDeleteInventoryItem = (id: string) => {
    const target = inventoryItems.find(i => i.id === id);
    if (!target) return;
    const updated = inventoryItems.filter(i => i.id !== id);
    setInventoryItems(updated);
    syncStorage('trust_inventory_items', updated);

    addAuditLog(
      'પ્રોડક્ટ આઇટમ રદ કરવામાં આવી',
      'ઇન્વેન્ટરી (Inventory)',
      `વસ્તુ: ${target.nameGuj}`
    );
  };

  // Purchase Bill Handlers
  const handleAddPurchaseBill = (newP: Omit<PurchaseBill, 'id' | 'billNumber'>) => {
    const seq = purchaseBills.length + 1;
    const padSeq = String(seq).padStart(4, '0');
    const billNumber = `PR-2026-${padSeq}`;

    const isCredit = newP.paymentMode === 'ઉધાર (Credit)';
    const bill: PurchaseBill = {
      ...newP,
      id: 'pur-' + Date.now(),
      billNumber,
      paymentStatus: newP.paymentStatus || (isCredit ? 'ઉધાર / બાકી (Unpaid / Credit)' : 'ચૂકવેલ (Paid)'),
      paidAmount: newP.paidAmount !== undefined ? newP.paidAmount : (isCredit ? 0 : newP.totalAmount)
    };

    const updatedBills = [bill, ...purchaseBills];
    setPurchaseBills(updatedBills);
    syncStorage('trust_purchase_bills', updatedBills);

    // Increase current stock of the item
    setInventoryItems(prev => prev.map(item => {
      if (item.id === newP.itemId) {
        return { ...item, currentStock: item.currentStock + newP.quantity };
      }
      return item;
    }));
    // Also save inventory stock change to storage
    const storedInventory = localStorage.getItem(getScopedKey('trust_inventory_items'));
    if (storedInventory) {
      const parsedInv = JSON.parse(storedInventory).map((item: any) => {
        if (item.id === newP.itemId) {
          return { ...item, currentStock: item.currentStock + newP.quantity };
        }
        return item;
      });
      syncStorage('trust_inventory_items', parsedInv);
    }

    // Automatically register as an Expense Voucher if paid amount > 0
    const voucherAmount = isCredit ? (newP.paidAmount || 0) : newP.totalAmount;
    if (voucherAmount > 0) {
      handleAddVoucher({
        date: newP.date,
        category: 'ખરીદી (Purchase)',
        amount: voucherAmount,
        paidToGuj: newP.supplierNameGuj,
        paymentMode: (isCredit || newP.paymentMode === 'ઉધાર (Credit)') ? 'રોકડ (Cash)' : newP.paymentMode,
        bankId: newP.bankId,
        remarksGuj: `પ્રોડક્ટ ખરીદી બિલ નં: ${billNumber}. વસ્તુ: ${newP.itemNameGuj} (જથ્થો: ${newP.quantity}) ${isCredit ? '[અંશત: ચૂકવણી]' : ''}`,
        approvedByGuj: currentSessionUser?.nameGuj || 'ટ્રસ્ટી શ્રી',
        operatorGuj: currentSessionUser?.nameGuj || 'ડેટા ઓપરેટર'
      });
    }

    addAuditLog(
      'નવું ખરીદી બિલ નોંધાયું',
      'ખરીદી વ્યવસ્થાપન',
      `બિલ નં: ${billNumber}, વિક્રેતા: ${newP.supplierNameGuj}, રકમ: ₹ ${newP.totalAmount} (${bill.paymentStatus})`
    );
  };

  const handleUpdatePurchaseBill = (updatedBill: PurchaseBill, settlementDetails?: { amount: number; mode: 'રોકડ (Cash)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)'; bankId?: string; date: string; remarksGuj?: string }) => {
    const updatedBills = purchaseBills.map(p => p.id === updatedBill.id ? updatedBill : p);
    setPurchaseBills(updatedBills);
    syncStorage('trust_purchase_bills', updatedBills);

    if (settlementDetails && settlementDetails.amount > 0) {
      handleAddVoucher({
        date: settlementDetails.date || new Date().toISOString().split('T')[0],
        category: 'ઉધાર ખરીદી ચુકવણી (Udhar Settlement)',
        amount: settlementDetails.amount,
        paidToGuj: updatedBill.supplierNameGuj,
        paymentMode: settlementDetails.mode,
        bankId: settlementDetails.bankId,
        remarksGuj: `ઉધાર ખરીદી બિલ નં: ${updatedBill.billNumber} ચુકવણી. વસ્તુ: ${updatedBill.itemNameGuj}. ${settlementDetails.remarksGuj || ''}`,
        approvedByGuj: currentSessionUser?.nameGuj || 'ટ્રસ્ટી શ્રી',
        operatorGuj: currentSessionUser?.nameGuj || 'ડેટા ઓપરેટર'
      });
    }

    addAuditLog(
      'ખરીદી બિલ અપડેટ / ઉધાર ચુકવણી',
      'ખરીદી વ્યવસ્થાપન',
      `બિલ નં: ${updatedBill.billNumber}, સ્ટેટસ: ${updatedBill.paymentStatus}`
    );
  };

  const handleDeletePurchaseBill = (id: string) => {
    const target = purchaseBills.find(p => p.id === id);
    if (!target) return;

    const updatedBills = purchaseBills.filter(p => p.id !== id);
    setPurchaseBills(updatedBills);
    syncStorage('trust_purchase_bills', updatedBills);

    // Deduct stock
    setInventoryItems(prev => prev.map(item => {
      if (item.id === target.itemId) {
        return { ...item, currentStock: Math.max(0, item.currentStock - target.quantity) };
      }
      return item;
    }));
    const storedInventory = localStorage.getItem(getScopedKey('trust_inventory_items'));
    if (storedInventory) {
      const parsedInv = JSON.parse(storedInventory).map((item: any) => {
        if (item.id === target.itemId) {
          return { ...item, currentStock: Math.max(0, item.currentStock - target.quantity) };
        }
        return item;
      });
      syncStorage('trust_inventory_items', parsedInv);
    }

    addAuditLog(
      'ખરીદી બિલ રદ કરવામાં આવ્યું',
      'ખરીદી વ્યવસ્થાપન',
      `બિલ નં: ${target.billNumber}`
    );
  };

  // Sales Bill Handlers
  const handleAddSalesBill = (newS: Omit<SalesBill, 'id' | 'billNumber'>) => {
    const seq = salesBills.length + 1;
    const padSeq = String(seq).padStart(4, '0');
    const billNumber = `SL-2026-${padSeq}`;

    const isCredit = newS.paymentMode === 'ઉધાર (Credit)';
    const bill: SalesBill = {
      ...newS,
      id: 'sal-' + Date.now(),
      billNumber,
      paymentStatus: newS.paymentStatus || (isCredit ? 'ઉધાર / બાકી (Unpaid / Credit)' : 'ચૂકવેલ (Paid)'),
      paidAmount: newS.paidAmount !== undefined ? newS.paidAmount : (isCredit ? 0 : newS.totalAmount)
    };

    const updatedBills = [bill, ...salesBills];
    setSalesBills(updatedBills);
    syncStorage('trust_sales_bills', updatedBills);

    // Decrease current stock of the item
    setInventoryItems(prev => prev.map(item => {
      if (item.id === newS.itemId) {
        return { ...item, currentStock: Math.max(0, item.currentStock - newS.quantity) };
      }
      return item;
    }));
    // Also save inventory stock change to storage
    const storedInventory = localStorage.getItem(getScopedKey('trust_inventory_items'));
    if (storedInventory) {
      const parsedInv = JSON.parse(storedInventory).map((item: any) => {
        if (item.id === newS.itemId) {
          return { ...item, currentStock: Math.max(0, item.currentStock - newS.quantity) };
        }
        return item;
      });
      syncStorage('trust_inventory_items', parsedInv);
    }

    // Automatically register as an Income Receipt if paid amount > 0
    const receiptAmount = isCredit ? (newS.paidAmount || 0) : newS.totalAmount;
    if (receiptAmount > 0) {
      handleAddReceipt({
        date: newS.date,
        donorId: 'dnr-sales', // Special virtual donor ID for product sales
        donorNameGuj: newS.customerNameGuj,
        category: 'વેચાણ (Sales)',
        amount: receiptAmount,
        paymentMode: (isCredit || newS.paymentMode === 'ઉધાર (Credit)') ? 'રોકડ (Cash)' : newS.paymentMode,
        bankId: newS.bankId,
        remarksGuj: `પ્રોડક્ટ વેચાણ બિલ નં: ${billNumber}. વસ્તુ: ${newS.itemNameGuj} (જથ્થો: ${newS.quantity}) ${isCredit ? '[અંશત: ચુકવણી]' : ''}`,
        operatorGuj: currentSessionUser?.nameGuj || 'ડેટા ઓપરેટર'
      });
    }

    addAuditLog(
      'નવું વેચાણ બિલ બનાવવામાં આવ્યું',
      'વેચાણ વ્યવસ્થાપન',
      `બિલ નં: ${billNumber}, ગ્રાહક: ${newS.customerNameGuj}, રકમ: ₹ ${newS.totalAmount} (${bill.paymentStatus})`
    );
  };

  const handleUpdateSalesBill = (updatedBill: SalesBill, settlementDetails?: { amount: number; mode: 'રોકડ (Cash)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)'; bankId?: string; date: string; remarksGuj?: string }) => {
    const updatedBills = salesBills.map(s => s.id === updatedBill.id ? updatedBill : s);
    setSalesBills(updatedBills);
    syncStorage('trust_sales_bills', updatedBills);

    if (settlementDetails && settlementDetails.amount > 0) {
      handleAddReceipt({
        date: settlementDetails.date || new Date().toISOString().split('T')[0],
        donorId: 'dnr-sales',
        donorNameGuj: updatedBill.customerNameGuj,
        category: 'ઉધાર વેચાણ વસૂલાત (Udhar Collection)',
        amount: settlementDetails.amount,
        paymentMode: settlementDetails.mode,
        bankId: settlementDetails.bankId,
        remarksGuj: `ઉધાર વેચાણ બિલ નં: ${updatedBill.billNumber} વસૂલાત. વસ્તુ: ${updatedBill.itemNameGuj}. ${settlementDetails.remarksGuj || ''}`,
        operatorGuj: currentSessionUser?.nameGuj || 'ડેટા ઓપરેટર'
      });
    }

    addAuditLog(
      'વેચાણ બિલ અપડેટ / ઉધાર વસૂલાત',
      'વેચાણ વ્યવસ્થાપન',
      `બિલ નં: ${updatedBill.billNumber}, સ્ટેટસ: ${updatedBill.paymentStatus}`
    );
  };

  const handleDeleteSalesBill = (id: string) => {
    const target = salesBills.find(s => s.id === id);
    if (!target) return;

    const updatedBills = salesBills.filter(s => s.id !== id);
    setSalesBills(updatedBills);
    syncStorage('trust_sales_bills', updatedBills);

    // Increase stock back
    setInventoryItems(prev => prev.map(item => {
      if (item.id === target.itemId) {
        return { ...item, currentStock: item.currentStock + target.quantity };
      }
      return item;
    }));
    const storedInventory = localStorage.getItem(getScopedKey('trust_inventory_items'));
    if (storedInventory) {
      const parsedInv = JSON.parse(storedInventory).map((item: any) => {
        if (item.id === target.itemId) {
          return { ...item, currentStock: item.currentStock + target.quantity };
        }
        return item;
      });
      syncStorage('trust_inventory_items', parsedInv);
    }

    addAuditLog(
      'વેચાણ બિલ રદ કરવામાં આવ્યું',
      'વેચાણ વ્યવસ્થાપન',
      `બિલ નં: ${target.billNumber}`
    );
  };

  // Donor handler
  const handleAddDonor = (newD: Omit<Donor, 'id' | 'createdAt'>) => {
    const donor: Donor = {
      ...newD,
      id: 'dnr-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const updated = [...donors, donor];
    setDonors(updated);
    syncStorage('trust_donors', updated);

    addAuditLog(
      'નવો દાતા ઉમેર્યો',
      'દાતા (Donor)',
      `દાતાશ્રી: ${newD.nameGuj}, PAN: ${newD.panNumber || 'નોંધેલ નથી'}`
    );
  };

  const handleEditDonor = (updatedDonor: Donor) => {
    const updated = donors.map(d => d.id === updatedDonor.id ? updatedDonor : d);
    setDonors(updated);
    syncStorage('trust_donors', updated);

    addAuditLog(
      'દાતા પ્રોફાઇલ સુધારવામાં આવી',
      'દાતા (Donor)',
      `દાતાશ્રી: ${updatedDonor.nameGuj}, PAN: ${updatedDonor.panNumber || 'નોંધેલ નથી'}`
    );
  };

  const handleDeleteDonor = (id: string) => {
    const target = donors.find(d => d.id === id);
    if (!target) return;

    const updated = donors.filter(d => d.id !== id);
    setDonors(updated);
    syncStorage('trust_donors', updated);

    addAuditLog(
      'દાતા રદ કરવામાં આવ્યો',
      'દાતા (Donor)',
      `દાતાશ્રી: ${target.nameGuj}`
    );
  };

  // Member handler
  const handleAddMember = (newM: Omit<TrustMember, 'id'>) => {
    const member: TrustMember = {
      ...newM,
      id: 'mbr-' + Date.now()
    };
    const updated = [...members, member];
    setMembers(updated);
    syncStorage('trust_members', updated);

    // Auto-generate IncomeReceipts for Daybook & Accounting Module integration
    const autoReceipts: IncomeReceipt[] = [];
    const opName = currentSessionUser?.nameGuj || 'એડમિન';

    if (newM.membershipFee && newM.membershipFee > 0) {
      const feeRcpNo = newM.feeReceiptNumber || `FEE-2026-${String(receipts.length + 1).padStart(4, '0')}`;
      autoReceipts.push({
        id: 'rcp-fee-' + Date.now(),
        receiptNumber: feeRcpNo,
        date: newM.feePaymentDate || newM.joiningDate || new Date().toISOString().split('T')[0],
        donorId: member.id,
        donorNameGuj: newM.nameGuj,
        category: 'સભાસદ પ્રવેશ ફી (Membership Fee)',
        amount: Number(newM.membershipFee),
        paymentMode: newM.feePaymentMode || 'રોકડ (Cash)',
        remarksGuj: `સભાસદ નં. ${newM.memberNo || ''} પ્રવેશ ફી આવક (રૂ. ${newM.membershipFee})`,
        operatorGuj: opName
      });
    }

    if (newM.totalShareAmount && newM.totalShareAmount > 0) {
      const shareRcpNo = newM.shareCertificateNo || `CERT-2026-${String(receipts.length + 2).padStart(4, '0')}`;
      autoReceipts.push({
        id: 'rcp-share-' + Date.now(),
        receiptNumber: shareRcpNo,
        date: newM.feePaymentDate || newM.joiningDate || new Date().toISOString().split('T')[0],
        donorId: member.id,
        donorNameGuj: newM.nameGuj,
        category: 'સભાસદ શેર મૂડી (Member Share Capital)',
        amount: Number(newM.totalShareAmount),
        paymentMode: newM.feePaymentMode || 'રોકડ (Cash)',
        remarksGuj: `સભાસદ નં. ${newM.memberNo || ''} શેર મૂડી આવક (${newM.shareCount || 0} શેર)`,
        operatorGuj: opName
      });
    }

    if (autoReceipts.length > 0) {
      const updatedReceipts = [...autoReceipts, ...receipts];
      setReceipts(updatedReceipts);
      syncStorage('trust_receipts', updatedReceipts);
    }

    addAuditLog(
      'નવો સભાસદ ઉમેરાયો અને ફી આવક નોંધાઈ',
      'સભ્યો (Board Members)',
      `નામ: ${newM.nameGuj}, હોદ્દો: ${newM.roleGuj}, પ્રવેશ ફી: ₹${newM.membershipFee || 0}, શેર રકમ: ₹${newM.totalShareAmount || 0}`
    );
  };

  const handleEditMember = (updatedMember: TrustMember) => {
    const updated = members.map(m => m.id === updatedMember.id ? updatedMember : m);
    setMembers(updated);
    syncStorage('trust_members', updated);

    addAuditLog(
      'ટ્રસ્ટ સભ્ય પ્રોફાઇલ સુધારાઈ',
      'સભ્યો (Board Members)',
      `નામ: ${updatedMember.nameGuj}, હોદ્દો: ${updatedMember.roleGuj}`
    );
  };

  const handleDeleteMember = (id: string) => {
    const target = members.find(m => m.id === id);
    if (!target) return;

    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    syncStorage('trust_members', updated);

    addAuditLog(
      'ટ્રસ્ટ સભ્ય રદ કરાયા',
      'સભ્યો (Board Members)',
      `નામ: ${target.nameGuj}, હોદ્દો: ${target.roleGuj}`
    );
  };

  const handleAddSharePurchase = (shareData: Omit<MemberSharePurchase, 'id'>) => {
    const newShp: MemberSharePurchase = {
      ...shareData,
      id: 'shp-' + Date.now()
    };
    const updated = [...sharePurchases, newShp];
    setSharePurchases(updated);
    syncStorage('trust_share_purchases', updated);

    // Also update member's total share count & capital
    const member = members.find(m => m.id === shareData.memberId);
    if (member) {
      const updatedMember: TrustMember = {
        ...member,
        folioNumber: member.folioNumber || shareData.folioNumber,
        shareCertificateNo: member.shareCertificateNo || shareData.certificateNo,
        shareCount: (member.shareCount || 0) + shareData.shareCount,
        sharePrice: shareData.sharePrice,
        totalShareAmount: (member.totalShareAmount || 0) + shareData.totalAmount
      };
      const updatedMembers = members.map(m => m.id === member.id ? updatedMember : m);
      setMembers(updatedMembers);
      syncStorage('trust_members', updatedMembers);
    }

    // Auto-create IncomeReceipt for Share Purchase to display in Daybook
    if (shareData.totalAmount > 0) {
      const shareRcp: IncomeReceipt = {
        id: 'rcp-share-shp-' + Date.now(),
        receiptNumber: shareData.certificateNo || `CERT-2026-${Date.now().toString().slice(-4)}`,
        date: shareData.date || new Date().toISOString().split('T')[0],
        donorId: shareData.memberId,
        donorNameGuj: shareData.memberNameGuj,
        category: 'સભાસદ શેર મૂડી (Member Share Capital)',
        amount: Number(shareData.totalAmount),
        paymentMode: shareData.paymentMode || 'રોકડ (Cash)',
        remarksGuj: `સભાસદ નવા શેર ખરીદી આવક (${shareData.shareCount} શેર, ફોલિયો: ${shareData.folioNumber})`,
        operatorGuj: currentSessionUser?.nameGuj || 'એડમિન'
      };
      const updatedReceipts = [shareRcp, ...receipts];
      setReceipts(updatedReceipts);
      syncStorage('trust_receipts', updatedReceipts);
    }

    addAuditLog(
      'નવા શેર ફાળવવામાં આવ્યા',
      'સભાસદ શેર રજીસ્ટર',
      `સભાસદ: ${shareData.memberNameGuj}, શેર સંખ્યા: ${shareData.shareCount}, રકમ: ₹${shareData.totalAmount}`
    );
  };

  const handleDeleteSharePurchase = (id: string) => {
    const target = sharePurchases.find(s => s.id === id);
    if (!target) return;
    const updated = sharePurchases.filter(s => s.id !== id);
    setSharePurchases(updated);
    syncStorage('trust_share_purchases', updated);
    addAuditLog(
      'શેર ફાળવણી રદ કરાઈ',
      'સભાસદ શેર રજીસ્ટર',
      `સભાસદ: ${target.memberNameGuj}, શેર: ${target.shareCount}`
    );
  };

  const handleAddLoanApplication = (loanData: Omit<MemberLoanApplication, 'id'>) => {
    const newLoan: MemberLoanApplication = {
      ...loanData,
      id: 'ln-' + Date.now()
    };
    const updated = [...loanApplications, newLoan];
    setLoanApplications(updated);
    syncStorage('trust_loan_applications', updated);
    addAuditLog(
      'નવી બેંક લોન ભલામણ અરજી ઉમેરાઈ',
      'બેંક ધિરાણ ભલામણ',
      `સભાસદ: ${loanData.memberNameGuj}, બેંક: ${loanData.bankNameGuj}, રકમ: ₹${loanData.requestedAmount}`
    );
  };

  const handleEditLoanApplication = (updatedLoan: MemberLoanApplication) => {
    const updated = loanApplications.map(l => l.id === updatedLoan.id ? updatedLoan : l);
    setLoanApplications(updated);
    syncStorage('trust_loan_applications', updated);
    addAuditLog(
      'બેંક લોન અરજી મંજૂરી સ્થિતિ સુધારાઈ',
      'બેંક ધિરાણ ભલામણ',
      `સભાસદ: ${updatedLoan.memberNameGuj}, સ્થિતિ: ${updatedLoan.statusGuj}`
    );
  };

  const handleDeleteLoanApplication = (id: string) => {
    const target = loanApplications.find(l => l.id === id);
    if (!target) return;
    const updated = loanApplications.filter(l => l.id !== id);
    setLoanApplications(updated);
    syncStorage('trust_loan_applications', updated);
    addAuditLog(
      'બેંક લોન ભલામણ અરજી રદ કરાઈ',
      'બેંક ધિરાણ ભલામણ',
      `સભાસદ: ${target.memberNameGuj}`
    );
  };

  // User handlers
  const handleAddUser = (newUser: Omit<UserType, 'id' | 'isActive'> & { isActive: boolean }) => {
    const userTrust = newUser.trustNameGuj || currentSessionUser?.trustNameGuj || trustSettings?.trustNameGuj || 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ';
    const cleanUname = newUser.username.trim().toLowerCase();
    const user: UserType = {
      ...newUser,
      username: cleanUname,
      trustNameGuj: userTrust,
      id: 'usr-' + Date.now()
    };
    const currentUsersList = appUsers;
    const filteredList = currentUsersList.filter(u => {
      const uTrust = u.trustNameGuj || 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ';
      if (uTrust === userTrust) {
        if (u.username.toLowerCase() === cleanUname) return false;
        if (newUser.role === 'Admin' && u.role === 'Admin') return false;
      }
      return true;
    });
    const updated = [user, ...filteredList];
    setAppUsers(updated);
    syncStorage('trust_users', updated);

    addAuditLog(
      'નવો વપરાશકર્તા ઉમેર્યો',
      'વપરાશકર્તા (User)',
      `નામ: ${user.nameGuj}, આઈડી: ${user.username}, ભૂમિકા: ${user.roleGuj}`
    );
  };

  const handleEditUser = (updatedUser: UserType) => {
    const currentUsersList = appUsers;
    const updated = currentUsersList.map(u => u.id === updatedUser.id ? updatedUser : u);
    setAppUsers(updated);
    syncStorage('trust_users', updated);

    // Update current session user state if edited user is currently logged in
    if (currentSessionUser && currentSessionUser.id === updatedUser.id) {
      setCurrentSessionUser(updatedUser);
    }

    addAuditLog(
      'વપરાશકર્તા વિગતો સુધારી',
      'વપરાશકર્તા (User)',
      `નામ: ${updatedUser.nameGuj}, આઈડી: ${updatedUser.username}, ભૂમિકા: ${updatedUser.roleGuj}`
    );
  };

  const handleDeleteUser = (id: string) => {
    const currentUsersList = appUsers;
    const target = currentUsersList.find(u => u.id === id);
    if (!target) return;

    const updated = currentUsersList.filter(u => u.id !== id);
    setAppUsers(updated);
    syncStorage('trust_users', updated);

    addAuditLog(
      'વપરાશકર્તા રદ કરવામાં આવ્યો',
      'વપરાશકર્તા (User)',
      `નામ: ${target.nameGuj}, આઈડી: ${target.username}`
    );
  };

  // Master Factory Reset Handler with Admin Username & Password Authentication
  const handleMasterReset = (adminUsernameInput: string, adminPasswordInput: string): boolean => {
    const cleanUsername = adminUsernameInput.trim().toLowerCase();

    // Check SuperAdmin credentials or registered Admin user
    const isSuperAdmin = (cleanUsername === 'patelmunaf90@gmail.com' || cleanUsername === 'superadmin' || cleanUsername === 'patelmunaf90') &&
      (adminPasswordInput === 'munaf786' || adminPasswordInput === 'admin123' || adminPasswordInput === 'superadmin');

    const matchedAdmin = isSuperAdmin ? { username: 'SuperAdmin', nameGuj: 'સુપર એડમિન' } : (
      appUsers.find(
        u => u.username.toLowerCase() === cleanUsername && (u.role === 'Admin' || u.role === 'Administrator') && u.passwordHash === adminPasswordInput
      ) || DEFAULT_USERS.find(
        u => u.username.toLowerCase() === cleanUsername && u.role === 'Admin' && u.passwordHash === adminPasswordInput
      )
    );

    if (!matchedAdmin) {
      return false;
    }

    // 1. Perform complete factory master reset across ALL React state variables
    setReceipts([]);
    setVouchers([]);
    setDonors([]);
    setMembers([]);
    setBanks([]);
    setAssets([]);
    setDocuments([]);
    setTharavs([]);
    setReconciliationList([]);
    setInventoryItems([]);
    setPurchaseBills([]);
    setSalesBills([]);
    setSharePurchases([]);
    setLoanApplications([]);
    setAuditLogs([]);
    setGlobalResults([]);

    const updatedSettings: TrustSettings = {
      ...trustSettings,
      openingCashBalance: 0
    };
    setTrustSettings(updatedSettings);

    const isCustom = currentSessionUser && !isDefaultUser(currentSessionUser.username);
    const scopeSuffix = isCustom ? `_${currentSessionUser.username.toLowerCase()}` : '';
    const getScopedKeyLocal = (key: string) => isCustom ? `${key}${scopeSuffix}` : key;

    // 2. Clear all local storage keys for all dataset tables (both unscoped and scoped)
    const tablesToBlank = [
      'trust_receipts',
      'trust_vouchers',
      'trust_donors',
      'trust_members',
      'trust_banks',
      'trust_assets',
      'trust_documents',
      'trust_tharavs',
      'trust_reconciliation',
      'trust_inventory_items',
      'trust_purchase_bills',
      'trust_sales_bills',
      'trust_share_purchases',
      'trust_loan_applications',
      'trust_audit_logs',
      'trust_aavak_jaavak_register_v1'
    ];

    tablesToBlank.forEach(tableKey => {
      localStorage.setItem(tableKey, JSON.stringify([]));
      localStorage.setItem(getScopedKeyLocal(tableKey), JSON.stringify([]));
    });

    // Also scan all localStorage keys to remove any cached entries from any user scope
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) {
          for (const prefix of tablesToBlank) {
            if (k.startsWith(prefix)) {
              localStorage.setItem(k, JSON.stringify([]));
            }
          }
        }
      }
    } catch (e) {
      console.warn("Storage cleanup notice:", e);
    }

    localStorage.setItem('trust_settings', JSON.stringify(updatedSettings));
    localStorage.setItem(getScopedKeyLocal('trust_settings'), JSON.stringify(updatedSettings));
    localStorage.setItem('active_trust_settings', JSON.stringify(updatedSettings));

    // 3. Immediately wipe data in Google Firebase Firestore so cloud is 100% blank
    const targetTrust = currentSessionUser?.trustNameGuj || trustSettings?.trustNameGuj || 'મુખ્ય ટ્રસ્ટ';
    const blankPayload = {
      donors: [],
      receipts: [],
      vouchers: [],
      banks: [],
      members: [],
      assets: [],
      documents: [],
      tharavs: [],
      reconciliationList: [],
      inventoryItems: [],
      purchaseBills: [],
      salesBills: [],
      sharePurchases: [],
      loanApplications: [],
      auditLogs: [],
      trustSettings: updatedSettings,
      last_cloud_sync: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      trust_name: targetTrust
    };

    if (!isElectronOfflineApp() && navigator.onLine && appMode !== 'offline') {
      saveFullTrustToFirebase(targetTrust, blankPayload).then(() => {
        console.log(`[Firebase Cloud] Trust data for [${targetTrust}] completely wiped.`);
      }).catch(err => {
        console.error("Firebase wipe error:", err);
      });
    }

    // 4. Also wipe linked PC SQLite / JSON file if connected
    if (fileHandle && filePermissionGranted) {
      fileHandle.createWritable().then(async (writable: any) => {
        await writable.write(JSON.stringify({
          ...blankPayload,
          trust_donors: [],
          trust_receipts: [],
          trust_vouchers: [],
          trust_banks: [],
          trust_members: [],
          trust_assets: [],
          trust_documents: [],
          trust_tharavs: [],
          trust_audit_logs: [],
          trust_licenses: licenses,
          trust_settings: updatedSettings,
          trust_reconciliation: [],
          trust_inventory_items: [],
          trust_purchase_bills: [],
          trust_sales_bills: [],
          trust_share_purchases: [],
          trust_loan_applications: [],
          last_saved_at: new Date().toISOString()
        }, null, 2));
        await writable.close();
      }).catch((err: any) => console.warn("Linked file reset warning:", err));
    }

    return true;
  };

  // Bank accounts contra mappings
  const handleAddBankAccount = (newAcc: Omit<BankAccount, 'id' | 'balance' | 'isActive'>) => {
    const initBal = newAcc.openingBalance || 0;
    const account: BankAccount = {
      ...newAcc,
      id: 'bnk-' + Date.now(),
      balance: initBal,
      openingBalance: initBal,
      isActive: true
    };
    const updated = [...banks, account];
    setBanks(updated);
    syncStorage('trust_banks', updated);

    addAuditLog(
      'નવું બેંક ખાતું ઉમેર્યું',
      'બેંક (Bank)',
      `બેંક: ${newAcc.bankNameGuj}, ખાતા નં: ${newAcc.accountNumber}, પ્રારંભિક શિલક: ₹ ${initBal}`
    );
  };

  const handleEditBankAccount = (updatedBank: BankAccount) => {
    const oldBank = banks.find(b => b.id === updatedBank.id);
    const oldOpening = oldBank?.openingBalance || 0;
    const newOpening = updatedBank.openingBalance || 0;
    const diff = newOpening - oldOpening;

    const finalBank: BankAccount = {
      ...updatedBank,
      balance: (oldBank?.balance || 0) + diff,
      openingBalance: newOpening
    };

    const updated = banks.map(b => b.id === updatedBank.id ? finalBank : b);
    setBanks(updated);
    syncStorage('trust_banks', updated);

    addAuditLog(
      'બેંક ખાતાની વિગતો સુધારવામાં આવી',
      'બેંક (Bank)',
      `બેંક: ${updatedBank.bankNameGuj}, ખાતા નં: ${updatedBank.accountNumber}, પ્રારંભિક શિલક: ₹ ${newOpening}`
    );
  };

  const handleDeleteBankAccount = (id: string) => {
    const target = banks.find(b => b.id === id);
    if (!target) return;

    const updated = banks.filter(b => b.id !== id);
    setBanks(updated);
    syncStorage('trust_banks', updated);

    addAuditLog(
      'બેંક ખાતું રદ કર્યું',
      'બેંક (Bank)',
      `બેંક: ${target.bankNameGuj}, ખાતા નં: ${target.accountNumber}`
    );
  };

  const handleAddBankTransaction = (bankId: string, amount: number, type: 'જમા (Deposit)' | 'ઉપાડ (Withdrawal)', remarks: string) => {
    const updatedBanks = banks.map(b => {
      if (b.id === bankId) {
        const diff = type.includes('જમા') ? amount : -amount;
        return { ...b, balance: b.balance + diff };
      }
      return b;
    });
    setBanks(updatedBanks);
    syncStorage('trust_banks', updatedBanks);

    const selB = banks.find(b => b.id === bankId);
    const newTx = {
      id: 'tx-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      docType: type.includes('જમા') ? 'ડિપોઝીટ' : 'વિથડ્રોઅલ',
      bank: selB ? selB.bankNameGuj.split(' ')[0] : 'બેંક',
      num: '-',
      amount: amount,
      desc: remarks || 'બેંક રોકડ લિન્કેજ',
      status: 'ક્લિયર થયેલ',
      type: type
    };
    const updatedRecon = [newTx, ...reconciliationList];
    setReconciliationList(updatedRecon);
    syncStorage('trust_reconciliation', updatedRecon);

    addAuditLog(
      'બેંક વ્યવહાર નોંધણી (Contra)',
      'બેંક (Bank)',
      `${type} વ્યવહાર, રકમ: ₹ ${amount}. નોંધ: ${remarks}`
    );
  };

  const handleToggleClearTransaction = (id: string, itemData?: any) => {
    const existingIndex = reconciliationList.findIndex(tx => tx.id === id || (tx.refId && tx.refId === itemData?.refId));
    let updated: any[];
    if (existingIndex >= 0) {
      updated = reconciliationList.map((tx, idx) => {
        if (idx === existingIndex) {
          const nextStatus = (tx.status === 'ક્લિયર થયેલ' || tx.status === 'Cleared') ? 'બાકી (Pending)' : 'ક્લિયર થયેલ';
          return { ...tx, status: nextStatus };
        }
        return tx;
      });
    } else if (itemData) {
      const nextStatus = (itemData.status === 'ક્લિયર થયેલ' || itemData.status === 'Cleared') ? 'બાકી (Pending)' : 'ક્લિયર થયેલ';
      const newItem = {
        ...itemData,
        id,
        status: nextStatus
      };
      updated = [newItem, ...reconciliationList];
    } else {
      updated = reconciliationList;
    }
    setReconciliationList(updated);
    syncStorage('trust_reconciliation', updated);
  };

  // Fixed Asset handlers
  const handleAddAsset = (newA: Omit<Asset, 'id' | 'currentValue'>) => {
    const asset: Asset = {
      ...newA,
      id: 'ast-' + Date.now(),
      currentValue: newA.purchaseAmount
    };
    const updated = [...assets, asset];
    setAssets(updated);
    syncStorage('trust_assets', updated);

    addAuditLog(
      'સ્થાયી મિલકત ઉમેરી',
      'મિલકતો (Assets)',
      `મિલકત: ${newA.nameGuj}, કિંમત: ₹ ${newA.purchaseAmount}`
    );
  };

  const handleDepreciateAssets = () => {
    const updated = assets.map(a => {
      if (a.depreciationRate > 0) {
        const depAmt = (a.currentValue * a.depreciationRate) / 100;
        return { ...a, currentValue: Math.max(0, a.currentValue - depAmt) };
      }
      return a;
    });
    setAssets(updated);
    syncStorage('trust_assets', updated);

    addAuditLog(
      'મિલકતોનો વાર્ષિક ઘસારો ગણવામાં આવ્યો',
      'મિલકતો (Assets)',
      'તમામ ઘસારા લાયક મિલકતો પર વાર્ષિક રેટ મુજબ ઘસારો ગણતરી પત્રકમાં નોંધાયો.'
    );
  };

  const handleEditAsset = (updatedAsset: Asset) => {
    const updated = assets.map(a => a.id === updatedAsset.id ? updatedAsset : a);
    setAssets(updated);
    syncStorage('trust_assets', updated);

    addAuditLog(
      'સ્થાયી મિલકત સુધારી',
      'મિલકતો (Assets)',
      `મિલકત: ${updatedAsset.nameGuj}, કિંમત: ₹ ${updatedAsset.purchaseAmount}`
    );
  };

  const handleDeleteAsset = (id: string) => {
    const target = assets.find(a => a.id === id);
    if (!target) return;

    const updated = assets.filter(a => a.id !== id);
    setAssets(updated);
    syncStorage('trust_assets', updated);

    addAuditLog(
      'સ્થાયી મિલકત રદ કરી',
      'મિલકતો (Assets)',
      `મિલકત: ${target.nameGuj} રદ કરવામાં આવી.`
    );
  };

  // Legal Documents
  const handleUploadDocument = (newD: Omit<DocumentMeta, 'id' | 'uploadDate' | 'fileSize' | 'fileType'>) => {
    const doc: DocumentMeta = {
      ...newD,
      id: 'doc-' + Date.now(),
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: '1.8 MB',
      fileType: 'application/pdf'
    };
    const updated = [...documents, doc];
    setDocuments(updated);
    syncStorage('trust_documents', updated);

    addAuditLog(
      'દસ્તાવેજ રજીસ્ટર અપલોડ',
      'દસ્તાવેજો (Docs Locker)',
      `શીર્ષક: ${newD.titleGuj}, કેટેગરી: ${newD.typeGuj}`
    );
  };

  const handleDeleteDocument = (id: string) => {
    const target = documents.find(d => d.id === id);
    if (!target) return;

    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    syncStorage('trust_documents', updated);

    addAuditLog(
      'દસ્તાવેજ રદ કરાયો',
      'દસ્તાવેજો (Docs Locker)',
      `શીર્ષક: ${target.titleGuj} કાયમી ધોરણે રદ કરવામાં આવ્યો.`
    );
  };

  const handleEditDocument = (updatedDoc: DocumentMeta) => {
    const updated = documents.map(d => d.id === updatedDoc.id ? updatedDoc : d);
    setDocuments(updated);
    syncStorage('trust_documents', updated);

    addAuditLog(
      'દસ્તાવેજ વિગતો સુધારાઈ',
      'દસ્તાવેજો (Docs Locker)',
      `શીર્ષક: ${updatedDoc.titleGuj}`
    );
  };

  // Agenda & Tharav Handlers
  const handleAddTharav = (newT: Omit<AgendaTharav, 'id' | 'createdAt'>) => {
    const tharav: AgendaTharav = {
      ...newT,
      id: 'thr-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const updated = [tharav, ...tharavs];
    setTharavs(updated);
    syncStorage('trust_tharavs', updated);

    addAuditLog(
      'નવો ઠરાવ નોંધાયો',
      'એજન્ડા & ઠરાવ બુક',
      `ઠરાવ નં: ${newT.tharavNumber}, વિષય: ${newT.subjectGuj}`
    );
  };

  const handleEditTharav = (updatedTharav: AgendaTharav) => {
    const updated = tharavs.map(t => t.id === updatedTharav.id ? updatedTharav : t);
    setTharavs(updated);
    syncStorage('trust_tharavs', updated);

    addAuditLog(
      'ઠરાવ વિગતો સુધારાઈ',
      'એજન્ડા & ઠરાવ બુક',
      `ઠરાવ નં: ${updatedTharav.tharavNumber}, વિષય: ${updatedTharav.subjectGuj}`
    );
  };

  const handleDeleteTharav = (id: string) => {
    const target = tharavs.find(t => t.id === id);
    if (!target) return;

    const updated = tharavs.filter(t => t.id !== id);
    setTharavs(updated);
    syncStorage('trust_tharavs', updated);

    addAuditLog(
      'ઠરાવ રદ કરાયો',
      'એજન્ડા & ઠરાવ બુક',
      `ઠરાવ નં: ${target.tharavNumber} રદ કરવામાં આવ્યો.`
    );
  };

  // Super Admin Licensing Mappings
  const handleAddLicense = (
    newLic: Omit<TrustLicense, 'id' | 'status'>,
    newUser?: { username: string; passwordHash: string; nameGuj: string }
  ) => {
    const license: TrustLicense = {
      ...newLic,
      id: 'lic-' + Date.now(),
      status: 'સક્રિય (Active)'
    };
    const updated = [...licenses, license];
    setLicenses(updated);
    syncStorage('trust_licenses', updated);
    localStorage.setItem('trust_activated', 'true');
    localStorage.setItem('trust_activated_name', newLic.trustNameGuj);
    localStorage.setItem('trust_activation_key', newLic.licenseKey);
    setIsActivated(true);
    setLoginSelectedTrust(newLic.trustNameGuj);

    if (newUser) {
      const cleanUname = newUser.username.trim().toLowerCase();
      const cleanPass = newUser.passwordHash.trim();

      const rolesToCreate: UserType[] = [
        {
          id: 'usr-adm-' + Date.now(),
          username: cleanUname,
          nameGuj: newUser.nameGuj || `${newLic.trustNameGuj} (પ્રશાસક)`,
          role: 'Admin',
          roleGuj: 'પ્રશાસક (Administrator)',
          passwordHash: cleanPass,
          isActive: true,
          trustNameGuj: newLic.trustNameGuj,
          isVendorRegistered: true
        },
        {
          id: 'usr-acc-' + Date.now(),
          username: 'accountant',
          nameGuj: `${newLic.trustNameGuj} (એકાઉન્ટન્ટ)`,
          role: 'Accountant',
          roleGuj: 'નામું રાખનાર (Accountant)',
          passwordHash: 'acc123',
          isActive: true,
          trustNameGuj: newLic.trustNameGuj,
          isVendorRegistered: true
        },
        {
          id: 'usr-op-' + Date.now(),
          username: 'operator',
          nameGuj: `${newLic.trustNameGuj} (ઓપરેટર)`,
          role: 'DataEntry',
          roleGuj: 'ડેટા એન્ટ્રી ઓપરેટર (Data Entry)',
          passwordHash: 'op123',
          isActive: true,
          trustNameGuj: newLic.trustNameGuj,
          isVendorRegistered: true
        },
        {
          id: 'usr-ro-' + Date.now(),
          username: 'readonly',
          nameGuj: `${newLic.trustNameGuj} (નિરીક્ષક)`,
          role: 'ReadOnly',
          roleGuj: 'માત્ર વાંચવા માટે (Read Only)',
          passwordHash: 'read123',
          isActive: true,
          trustNameGuj: newLic.trustNameGuj,
          isVendorRegistered: true
        }
      ];

      const filteredUsersList = appUsers.filter(u => {
        const uTrust = (u.trustNameGuj || '').trim();
        return uTrust !== newLic.trustNameGuj.trim();
      });

      const updatedUsers = [...rolesToCreate, ...filteredUsersList];
      setAppUsers(updatedUsers);
      syncStorage('trust_users', updatedUsers);

      // Create & sync initial trust settings for new trust to cloud
      const newTrustSettings: TrustSettings = {
        ...DEFAULT_TRUST_SETTINGS,
        trustNameGuj: newLic.trustNameGuj,
        trustNameEng: '',
        regNoGuj: '',
        addressGuj: '',
        phone: newLic.registeredPhone || '',
        email: newLic.registeredEmail || '',
        panNumber: '',
        tanNumber: '',
        section12ANo: '',
        section80GNo: '',
        openingCashBalance: 0
      };
      saveTrustDatasetToFirebase(newLic.trustNameGuj, 'trust_settings', newTrustSettings);

      // Auto set form fields for immediate login testing
      setLoginSelectedTrust(newLic.trustNameGuj);
      setLoginUsername(cleanUname);
      setLoginPassword(cleanPass);
      setLoginRoleFilter('Admin');
    }

    addAuditLog(
      'નવું ટ્રસ્ટ રજીસ્ટ્રેશન અને લાયસન્સ જનરેટ',
      'લાયસન્સિંગ (Super Admin)',
      `લાયસન્સ કી: ${newLic.licenseKey} ગ્રાહક: ${newLic.trustNameGuj} (આઈડી: ${newUser?.username || 'admin'}) માટે સક્રિય કરાઈ.`
    );
  };

  const handleRenewLicense = (id: string) => {
    const updated = licenses.map(l => {
      if (l.id === id) {
        const currentExp = new Date(l.expiryDate);
        currentExp.setFullYear(currentExp.getFullYear() + 1);
        return { ...l, status: 'સક્રિય (Active)' as const, expiryDate: currentExp.toISOString().split('T')[0] };
      }
      return l;
    });
    setLicenses(updated);
    syncStorage('trust_licenses', updated);

    addAuditLog(
      'ગ્રાહક ટ્રસ્ટ લાયસન્સ રીન્યુઅલ',
      'લાયસન્સિંગ (Super Admin)',
      'ગ્રાહક સબ્સ્ક્રિપ્શન પ્લાન સફળતાપૂર્વક આગળના ૧ વર્ષ માટે રીન્યુ થયો.'
    );
  };

  const handleEditLicense = (updatedLic: TrustLicense) => {
    const updated = licenses.map(l => l.id === updatedLic.id ? updatedLic : l);
    setLicenses(updated);
    syncStorage('trust_licenses', updated);
    addAuditLog(
      'ટ્રસ્ટ લાયસન્સ સુધારણા (Edit License)',
      'લાયસન્સિંગ (Super Admin)',
      `ટ્રસ્ટ ${updatedLic.trustNameGuj} ની લાયસન્સ વિગતો અપડેટ કરવામાં આવી.`
    );
  };

  const handleDeleteLicense = (id: string) => {
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

      // 3. Purge all records associated with targetTrustName or current active trust
      const isCurrentActiveTrust =
        trustSettings.trustNameGuj === targetTrustName ||
        currentSessionUser?.trustNameGuj === targetTrustName;

      if (isCurrentActiveTrust) {
        // Complete wipe of all current active trust data
        setReceipts([]); syncStorage('trust_receipts', []);
        setVouchers([]); syncStorage('trust_vouchers', []);
        setDonors([]); syncStorage('trust_donors', []);
        setMembers([]); syncStorage('trust_members', []);
        setBanks([]); syncStorage('trust_banks', []);
        setAssets([]); syncStorage('trust_assets', []);
        setDocuments([]); syncStorage('trust_documents', []);
        setTharavs([]); syncStorage('trust_tharavs', []);
        setReconciliationList([]); syncStorage('trust_reconciliation', []);
        setInventoryItems([]); syncStorage('trust_inventory_items', []);
        setPurchaseBills([]); syncStorage('trust_purchase_bills', []);
        setSalesBills([]); syncStorage('trust_sales_bills', []);
        setSharePurchases([]); syncStorage('trust_share_purchases', []);
        setLoanApplications([]); syncStorage('trust_loan_applications', []);
        setAuditLogs([]); syncStorage('trust_audit_logs', []);

        // Disconnect PC File handle if present
        setFileHandle(null);
        setFileName(null);

        // Reset active trust settings
        const emptySettings: TrustSettings = {
          trustNameGuj: '',
          trustNameEng: '',
          regNoGuj: '',
          registrationNumber: '',
          addressGuj: '',
          phone: '',
          email: '',
          financialYear: '૨૦૨૬-૨૭',
          receiptHeaderGuj: '',
          logoUrl: '',
          panNumber: '',
          tanNumber: '',
          section12ANo: '',
          section80GNo: '',
          openingCashBalance: 0
        };
        setTrustSettings(emptySettings);
        syncStorage('trust_settings', emptySettings);

        // Force logout if logged in under this trust
        if (isLoggedIn) {
          setCurrentSessionUser(null);
          setIsLoggedIn(false);
          setIsSuperAdminAuthenticated(false);
          setLoginError('આ ટ્રસ્ટ રદ થયું છે અને સિસ્ટમ તેમજ ઓફલાઇન/ઓનલાઇન સ્ટોરેજમાંથી તેનો તમામ હિસાબી ડેટા સંપૂર્ણપણે ડિલીટ કરવામાં આવ્યો છે.');
        }
      } else {
        // Filter out any trust-scoped data
        setDonors(prev => {
          const filtered = prev.filter(item => (item as any).trustNameGuj !== targetTrustName);
          syncStorage('trust_donors', filtered);
          return filtered;
        });
        setMembers(prev => {
          const filtered = prev.filter(item => (item as any).trustNameGuj !== targetTrustName);
          syncStorage('trust_members', filtered);
          return filtered;
        });
      }
    }

    // Direct save system master (both licenses and users) to Firebase
    saveSystemMasterToFirebase(updatedLicenses, updatedUsers);

    if (updatedLicenses.length === 0) {
      localStorage.removeItem('trust_activated_name');
      localStorage.removeItem('trust_activation_key');
      setIsActivated(false);
      setLoginSelectedTrust('');
      setLoginUsername('');
      setAppUsers([]);
      syncStorage('trust_users', []);
    } else {
      if (loginSelectedTrust === targetTrustName) {
        setLoginSelectedTrust(updatedLicenses[0].trustNameGuj);
      }
    }

    addAuditLog(
      'ટ્રસ્ટ અને તમામ ડેટા સંપૂર્ણ રદ (Delete Trust & All Data)',
      'લાયસન્સિંગ (Super Admin)',
      `ટ્રસ્ટ "${targetTrustName || id}" અને તેનો તમામ હિસાબી ડેટા સંપૂર્ણપણે સિસ્ટમ અને સ્ટોરેજમાંથી રદ કરાયો.`
    );
  };

  const handleToggleDeactivateLicense = (id: string) => {
    const target = licenses.find(l => l.id === id);
    const targetTrustName = target?.trustNameGuj;

    const updated = licenses.map(l => {
      if (l.id === id) {
        const isCurrentlyActive = l.status.startsWith('સક્રિય') || (l.status.toLowerCase().includes('active') && !l.status.toLowerCase().includes('in'));
        return {
          ...l,
          status: isCurrentlyActive ? ('અસક્રિય (Inactive)' as const) : ('સક્રિય (Active)' as const)
        };
      }
      return l;
    });
    setLicenses(updated);
    syncStorage('trust_licenses', updated);

    // Deactivate / Activate users belonging to this trust as well
    if (targetTrustName) {
      const isNowActive = updated.find(l => l.id === id)?.status.startsWith('સક્રિય');
      const updatedUsers = appUsers.map(u => {
        if (u.trustNameGuj === targetTrustName) {
          return { ...u, isActive: !!isNowActive };
        }
        return u;
      });
      setAppUsers(updatedUsers);
      syncStorage('trust_users', updatedUsers);

      // Force logout if currently logged in under this deactivated trust
      if (!isNowActive && isLoggedIn && (currentSessionUser?.trustNameGuj === targetTrustName || trustSettings.trustNameGuj === targetTrustName)) {
        setCurrentSessionUser(null);
        setIsLoggedIn(false);
        setIsSuperAdminAuthenticated(false);
        setLoginError('પ્રવેશ નામંજૂર: આ ટ્રસ્ટ ડી-એક્ટિવેટ (Deactivated) કરવામાં આવ્યું હોવાથી લોગિન થઈ શકશે નહીં.');
      }
    }

    addAuditLog(
      'ટ્રસ્ટ લાયસન્સ સ્ટેટસ બદલાવ (Deactivate/Activate)',
      'લાયસન્સિંગ (Super Admin)',
      `ટ્રસ્ટ ID ${id} (${targetTrustName}) નું સ્ટેટસ બદલવામાં આવ્યું.`
    );
  };

  // License & User active check for logged-in session: Force logout if trust or user is deactivated by Admin/Super Admin
  useEffect(() => {
    if (isLoggedIn && currentSessionUser) {
      // Super Admin stays logged in
      if (currentSessionUser.username === 'patelmunaf90@gmail.com') return;

      const activeTrustName = currentSessionUser.trustNameGuj || trustSettings.trustNameGuj || 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ';
      const allLic = licenses;
      const matchedLicense = allLic.find(l => l.trustNameGuj === activeTrustName);
      
      if (!matchedLicense && licenses.length === 0) {
        setCurrentSessionUser(null);
        setIsLoggedIn(false);
        setIsSuperAdminAuthenticated(false);
        setLoginError('પ્રવેશ નામંજૂર: તમામ ટ્રસ્ટ / લાયસન્સ ડિલીટ કરવામાં આવ્યા છે.');
        return;
      }

      if (matchedLicense) {
        const isStatusActive = matchedLicense.status.startsWith('સક્રિય') || 
                               (matchedLicense.status.toLowerCase().includes('active') && 
                                !matchedLicense.status.toLowerCase().includes('in') &&
                                !matchedLicense.status.toLowerCase().includes('deactivat'));
        if (!isStatusActive) {
          setCurrentSessionUser(null);
          setIsLoggedIn(false);
          setIsSuperAdminAuthenticated(false);
          setLoginError('પ્રવેશ નામંજૂર: આ ટ્રસ્ટ ડી-એક્ટિવેટ (Deactivated / Inactive) હોવાથી તમારું લોગિન સત્ર સમાપ્ત કરવામાં આવ્યું છે.');
          return;
        }
      }

      // Check current user account active status
      const userList = appUsers;
      const currentUserRecord = userList.find(
        u => u.id === currentSessionUser.id || 
        (u.username.toLowerCase() === currentSessionUser.username.toLowerCase() && (u.trustNameGuj || 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ') === activeTrustName)
      );
      if (currentUserRecord && currentUserRecord.isActive === false) {
        setCurrentSessionUser(null);
        setIsLoggedIn(false);
        setIsSuperAdminAuthenticated(false);
        setLoginError('પ્રવેશ નામંજૂર: તમારું યુઝર એકાઉન્ટ ડી-એક્ટિવેટ (Deactivated / Inactive) કરાયેલ હોવાથી તમારું લોગિન સત્ર સમાપ્ત કરવામાં આવ્યું છે.');
        return;
      }
    }
  }, [licenses, appUsers, isLoggedIn, currentSessionUser, trustSettings.trustNameGuj]);

  // --- GLOBAL SEARCH LOGIC ---
  useEffect(() => {
    const rawQuery = globalQuery.trim();
    if (!rawQuery) {
      setGlobalResults([]);
      return;
    }

    const query = rawQuery.toLowerCase();
    const transliterated = localTransliterate(rawQuery).toLowerCase();

    const matches = (text: string | undefined | null) => {
      if (!text) return false;
      const lower = text.toLowerCase();
      return lower.includes(query) || (transliterated.length >= 2 && lower.includes(transliterated));
    };

    const results: Array<{ id: string; title: string; subtitle: string; tab: string; tag: string }> = [];

    // App Navigation Modules
    const appModules = [
      { keywords: ['ડેશબોર્ડ', 'મુખ્ય', 'dashboard', 'home', 'આંકડા'], tab: 'dashboard', title: 'ડેશબોર્ડ (Dashboard)', subtitle: 'મુખ્ય માહિતી અને આંકડા' },
      { keywords: ['આવક', 'રસીદ', 'પાવતી', 'income', 'receipt', 'daan', 'દાન'], tab: 'receipts', title: 'આવક / રસીદો (Income / Receipts)', subtitle: 'દાન અને આવક નોંધણી' },
      { keywords: ['ખર્ચ', 'વાઉચર', 'બિલ', 'expense', 'voucher', 'kharch', 'ચૂકવણી'], tab: 'vouchers', title: 'ખર્ચ / વાઉચર્સ (Expense / Vouchers)', subtitle: 'ખર્ચ અને વાઉચર નોંધણી' },
      { keywords: ['દાતા', 'દાનદાતા', 'donor', 'donors', 'દાતાઓ'], tab: 'donors', title: 'દાતા ડાયરેક્ટરી (Donors)', subtitle: 'દાતાઓની યાદી અને વિગતો' },
      { keywords: ['સભાસદ', 'શેરહોલ્ડર', 'sabhasad', 'shareholder'], tab: 'members', title: 'સભાસદો / શેરહોલ્ડર્સ (Sabhasads)', subtitle: 'મંડળી/સોસાયટીના સભાસદો' },
      { keywords: ['ટ્રસ્ટી', 'સભ્ય', 'member', 'trustee', 'પ્રમુખ', 'મંત્રી', 'કમિટી'], tab: 'trust_members', title: 'ટ્રસ્ટ હોદ્દેદારો & કમિટી (Trust Board)', subtitle: 'ટ્રસ્ટીઓ અને કમિટી હોદ્દેદારો' },
      { keywords: ['બેંક', 'ખાતું', 'bank', 'cheque', 'ચોપડો'], tab: 'banks', title: 'બેંક વ્યવહારો (Bank Accounts)', subtitle: 'બેંક ખાતા અને સ્ટેટમેન્ટ' },
      { keywords: ['મિલકત', 'એસેટ', 'asset', 'સંપત્તિ', 'જમીન', 'મકાન'], tab: 'assets', title: 'મિલકતો (Assets)', subtitle: 'ટ્રસ્ટની સ્થાવર-જંગમ મિલકતો' },
      { keywords: ['દસ્તાવેજ', 'ફાઇલ', 'doc', 'document', 'પીડીએફ'], tab: 'documents', title: 'દસ્તાવેજો (Documents)', subtitle: 'ટ્રસ્ટના દસ્તાવેજો અને ફાઇલો' },
      { keywords: ['એજન્ડા', 'ઠરાવ', 'સભા', 'મિટિંગ', 'tharav', 'agenda', 'resolution', 'પ્રોસીડિંગ્સ'], tab: 'tharav', title: 'એજન્ડા & ઠરાવ બુક (Agenda & Tharav)', subtitle: 'સભાની પ્રોસીડિંગ્સ અને ઠરાવ નોંધણી' },
      { keywords: ['અહેવાલ', 'રિપોર્ટ', 'ખાતાવહી', 'આવક-જાવક', 'balance', 'report', 'ledger'], tab: 'accounting', title: 'હિસાબી અહેવાલો / બેલેન્સશીટ', subtitle: 'આવક-જાવક પત્રક અને રોકડમેળ' },
      { keywords: ['સેટિંગ્સ', 'ટ્રસ્ટ વિગત', 'settings', 'profile'], tab: 'settings', title: 'ટ્રસ્ટ સેટિંગ્સ', subtitle: 'ટ્રસ્ટ નામ અને હેડર વિગતો' },
      { keywords: ['બેકઅપ', 'સિંક', 'backup', 'export', 'ઈમ્પોર્ટ'], tab: 'backup', title: 'બેકઅપ અને ડેટા સિંક', subtitle: 'ડેટા ડાઉનલોડ અને બેકઅપ' },
      { keywords: ['સુપર એડમિન', 'લાયસન્સ', 'superadmin', 'license'], tab: 'superadmin', title: 'સુપર એડમિન પેનલ', subtitle: 'સોફ્ટવેર લાયસન્સ વ્યવસ્થા' }
    ];

    appModules.forEach(m => {
      if (m.keywords.some(k => k.includes(query) || (transliterated.length >= 2 && k.includes(transliterated)))) {
        results.push({
          id: `mod-${m.tab}`,
          title: m.title,
          subtitle: m.subtitle,
          tab: m.tab,
          tag: 'મેનુ'
        });
      }
    });

    // Search Receipts
    receipts.filter(r => !r.isDeleted).forEach(r => {
      if (
        matches(r.receiptNumber) ||
        matches(r.donorNameGuj) ||
        matches(r.category) ||
        matches(r.paymentMode) ||
        matches(r.notes) ||
        matches(r.panNumber) ||
        matches(String(r.amount))
      ) {
        results.push({
          id: r.id,
          title: `પાવતી નં. ${r.receiptNumber} - ₹${r.amount.toLocaleString('en-IN')}`,
          subtitle: `દાતા: ${r.donorNameGuj} | ${r.category} (${r.paymentMode})`,
          tab: 'receipts',
          tag: 'આવક રસીદ'
        });
      }
    });

    // Search Vouchers
    vouchers.filter(v => !v.isDeleted).forEach(v => {
      if (
        matches(v.voucherNumber) ||
        matches(v.paidToGuj) ||
        matches(v.category) ||
        matches(v.paymentMode) ||
        matches(v.notes) ||
        matches(String(v.amount))
      ) {
        results.push({
          id: v.id,
          title: `વાઉચર નં. ${v.voucherNumber} - ₹${v.amount.toLocaleString('en-IN')}`,
          subtitle: `ચૂકવણી: ${v.paidToGuj} | ${v.category}`,
          tab: 'vouchers',
          tag: 'ખર્ચ વાઉચર'
        });
      }
    });

    // Search Donors
    donors.forEach(d => {
      if (
        matches(d.nameGuj) ||
        matches(d.phone) ||
        matches(d.cityGuj) ||
        matches(d.addressGuj) ||
        matches(d.panNumber)
      ) {
        results.push({
          id: d.id,
          title: d.nameGuj,
          subtitle: `દાતા | ફોન: ${d.phone || 'નથી'} | ગામ: ${d.cityGuj || 'નથી'}`,
          tab: 'donors',
          tag: 'દાતા'
        });
      }
    });

    // Search Members
    members.forEach(m => {
      if (
        matches(m.nameGuj) ||
        matches(m.roleGuj) ||
        matches(m.phone) ||
        matches(m.cityGuj)
      ) {
        results.push({
          id: m.id,
          title: `${m.nameGuj} (${m.roleGuj})`,
          subtitle: `ટ્રસ્ટ સભ્ય | ફોન: ${m.phone || 'નથી'} | ગામ: ${m.cityGuj || 'નથી'}`,
          tab: 'members',
          tag: 'સભ્ય'
        });
      }
    });

    // Search Banks
    banks.forEach(b => {
      if (
        matches(b.bankNameGuj) ||
        matches(b.accountNumber) ||
        matches(b.branchGuj)
      ) {
        results.push({
          id: b.id,
          title: `${b.bankNameGuj} (${b.branchGuj})`,
          subtitle: `ખાતા નં: ${b.accountNumber} | બેલેન્સ: ₹${b.balance.toLocaleString('en-IN')}`,
          tab: 'banks',
          tag: 'બેંક'
        });
      }
    });

    // Search Assets
    assets.forEach(a => {
      if (
        matches(a.nameGuj) ||
        matches(a.typeGuj) ||
        matches(a.remarksGuj)
      ) {
        results.push({
          id: a.id,
          title: a.nameGuj,
          subtitle: `મિલકત | પ્રકાર: ${a.typeGuj} | કિંમત: ₹${a.currentValue.toLocaleString('en-IN')}`,
          tab: 'assets',
          tag: 'મિલકત'
        });
      }
    });

    // Search Tharavs
    tharavs.forEach(t => {
      if (
        matches(t.tharavNumber) ||
        matches(t.subjectGuj) ||
        matches(t.meetingType) ||
        matches(t.meetingNumber) ||
        matches(t.descriptionGuj)
      ) {
        results.push({
          id: t.id,
          title: `${t.tharavNumber} - ${t.subjectGuj}`,
          subtitle: `${t.meetingType} | સભા નં: ${t.meetingNumber}`,
          tab: 'tharav',
          tag: 'ઠરાવ'
        });
      }
    });

    setGlobalResults(results.slice(0, 10));
  }, [globalQuery, receipts, vouchers, donors, members, banks, assets, tharavs]);

  // Main render UI container colors
  const mainBg = darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800';
  const sidebarBg = darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const headerBg = darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200';

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 md:p-8 transition-colors duration-300 ${mainBg} bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden grid grid-cols-1 md:grid-cols-12"
        >
          {/* Left Side: Advertisement & Transparent Clear Logo */}
          <div className="md:col-span-6 bg-gradient-to-br from-emerald-950 via-teal-900 to-indigo-950 p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-6">
              {/* Transparent Clear Logo Emblem */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner p-2 shrink-0">
                  <Landmark className="w-9 h-9 text-emerald-300" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest bg-emerald-400/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-mono font-bold border border-emerald-400/30">
                    ગ્લોબલ સોફ્ટવેર (Global Software)
                  </span>
                  <h2 className="text-xl font-black tracking-tight text-white mt-1">Advanced Trust Suite</h2>
                </div>
              </div>

              {/* Main Headline */}
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ <br /><span className="text-emerald-400">એકાઉન્ટિંગ અને મેનેજમેન્ટ</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  ગુજરાતના તમામ જાહેર ટ્રસ્ટો, સંસ્થાઓ, શાળાઓ અને મંડળો માટેનું સૌથી સચોટ, સરળ અને 100% સુરક્ષિત ડિજિટલ પ્લેટફોર્મ.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-start gap-3 bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="block text-white font-bold">100% ડેટા સુરક્ષિત અને ઓફલાઇન સપોર્ટ</strong>
                    <span className="text-slate-300">તમારો ડેટા ફક્ત તમારા કમ્પ્યુટર પર જ સુરક્ષિત રહે છે.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10">
                  <FileText className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="block text-white font-bold">ઓટોમેટિક રસીદ અને વાઉચર</strong>
                    <span className="text-slate-300">રોકડ, ચેક અને બેંક વ્યવહારોની ત્વરિત નોંધણી અને પ્રિન્ટિંગ.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10">
                  <Users className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="block text-white font-bold">સભ્ય અને દાતા સંચાલન</strong>
                    <span className="text-slate-300">કાર્યકારિણી સભ્યો, દાતાઓ અને વાર્ષિક અહેવાલોનું સરળ સંચાલન.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Footer Info */}
            <div className="relative z-10 pt-6 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
              <span>વર્ઝન v4.2.0 (Enterprise)</span>
              <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> સક્રિય લાઇસન્સ સપોર્ટ
              </span>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="md:col-span-6 p-8 md:p-10 flex flex-col justify-between bg-white dark:bg-slate-900">
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">સિસ્ટમમાં પ્રવેશ કરો</h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <Cloud className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    ફાયરબેઝ ક્લાઉડ સિંક
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">મોબાઇલ કે કમ્પ્યુટરમાંથી તમારા આઈડી-પાસવર્ડ વડે ગમે ત્યાંથી લોગિન કરો.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
                {/* Dummy hidden fields to capture browser auto-fill */}
                <input type="text" className="hidden" tabIndex={-1} aria-hidden="true" autoComplete="off" />
                <input type="password" className="hidden" tabIndex={-1} aria-hidden="true" autoComplete="off" />

                {/* Activation Success Notification Banner */}
                {activationSuccessMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 font-medium"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold">લાયસન્સ સક્રિયકરણ સફળ (Activated!):</p>
                      <p>{activationSuccessMessage}</p>
                    </div>
                  </motion.div>
                )}

                {/* Login Error Notification Banner */}
                {loginError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium"
                  >
                    <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">પ્રવેશ નિષ્ફળ (Login Failed):</p>
                      <p>{loginError}</p>
                    </div>
                  </motion.div>
                )}

                {/* Trust Selector Dropdown */}
                {licenses.length > 0 && (
                  <div>
                    <label htmlFor="trust_login_select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>સંસ્થા / ટ્રસ્ટ પસંદ કરો (Select Trust)</span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {licenses.length} ટ્રસ્ટ
                      </span>
                    </label>
                    <select
                      id="trust_login_select"
                      value={loginSelectedTrust}
                      onChange={(e) => {
                        setLoginSelectedTrust(e.target.value);
                        setLoginError(null);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white font-medium focus:outline-emerald-500"
                    >
                      <option value="all">🔍 તમામ ટ્રસ્ટ (ઓટો ડિટેક્ટ - Auto Detect)</option>
                      {licenses.map(lic => (
                        <option key={lic.id} value={lic.trustNameGuj}>
                          🏛️ {lic.trustNameGuj} {lic.status?.startsWith('સક્રિય') ? '' : '(Deactivated)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Username */}
                <div>
                  <label htmlFor="trust_login_usr" className="block text-xs font-bold text-slate-500 mb-1">વપરાશકર્તા નામ (Username - English only) *</label>
                  <input
                    id="trust_login_usr"
                    name="trust_login_usr"
                    type="text"
                    value={loginUsername}
                    onChange={(e) => {
                       setLoginUsername(e.target.value);
                       setLoginError(null);
                    }}
                    placeholder="Enter username (e.g. admin, accountant, operator)"
                    lang="en"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    autoComplete="off"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-emerald-500 font-mono"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="trust_login_pwd" className="block text-xs font-bold text-slate-500 mb-1">સુરક્ષા પાસવર્ડ (Password - English only) *</label>
                  <div className="relative">
                    <input
                      id="trust_login_pwd"
                      name="trust_login_pwd"
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="••••••••"
                      lang="en"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      className="w-full p-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-emerald-500 font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title={showPassword ? "પાસવર્ડ છુપાવો" : "પાસવર્ડ બતાવો"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-800/70 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      પ્રવેશ ચકાસી રહ્યા છીએ... (Authenticating...)
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      પ્રવેશ મેળવો (Login Securely)
                    </>
                  )}
                </button>

              </form>
            </div>

            {/* Footer copyright and support hyperlink */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p>© Copyright <strong>Global Software</strong>. All rights reserved.</p>
              <p>
                Contact for Support: <a href="mailto:patelmunaf90@gmail.com" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">patelmunaf90@gmail.com</a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }



  if (activeTab === 'superadmin') {
    return (
      <div className={`min-h-screen flex flex-col ${mainBg} p-4 md:p-8`}>
        <div className="max-w-7xl mx-auto w-full space-y-6">
          <header className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 dark:text-white">સોફ્ટવેર વેન્ડર સુપર એડમિન પેનલ (Super Admin Panel)</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">લાયસન્સ કંટ્રોલ અને ગ્લોબલ સિક્યોરિટી મેનેજમેન્ટ</p>
              </div>
            </div>
            <button
              onClick={handleSuperAdminLogout}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> વેન્ડર લોગઆઉટ (Exit)
            </button>
          </header>

          <SuperAdminPanel
            licenses={licenses}
            appUsers={appUsers}
            onAddLicense={handleAddLicense}
            onRenewLicense={handleRenewLicense}
            onEditLicense={handleEditLicense}
            onDeleteLicense={handleDeleteLicense}
            onToggleDeactivate={handleToggleDeactivateLicense}
            onLogoutSuperAdmin={handleSuperAdminLogout}
            darkMode={darkMode}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${mainBg}`}>
      
      {/* Automatic GitHub / Server Internet Update Notification Banner */}
      <AnimatePresence>
        {hasAppUpdate && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-700 text-white p-3 px-4 flex flex-wrap justify-between items-center text-xs font-bold shadow-xl z-50 sticky top-0"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg">
                <RefreshCw className="w-4 h-4 text-yellow-300 animate-spin" />
              </span>
              <div>
                <div className="font-black text-sm flex items-center gap-2 text-yellow-300">
                  <span>⚡ ઇન્ટરનેટ કનેક્ટ થયું - નવું ગિટહબ / સર્વર અપડેટ ઉપલબ્ધ છે!</span>
                  {serverVersionNum && <span className="bg-yellow-400 text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-bold">v{serverVersionNum}</span>}
                </div>
                <div className="text-[11px] font-medium opacity-90">
                  તમારા ગિટહબ રેપો/સર્વર પર થયેલ સુધારા ઇન્ટરનેટ વડે સિંક થઈ ગયા છે. નવું વર્ઝન તરત લાગુ કરવા માટે નીચે બટન પર ક્લિક કરો.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <button
                onClick={() => reloadToUpdate(serverVersionNum)}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold rounded-xl shadow-md transition-all cursor-pointer text-xs flex items-center gap-1.5 active:scale-95"
              >
                <Download className="w-4 h-4" />
                હમણાં અપડેટ કરો (Reload & Update)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Body with Top Horizontal Control Panel Navigation */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Main Header Strip */}
        <header className={`sticky top-0 z-40 backdrop-blur-md border-b p-2.5 px-4 flex justify-between items-center ${headerBg}`}>
          
          {/* Header trust title & logo & Control Panel button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('control_panel')}
              className="p-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
              title="કંટ્રોલ પેનલ"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>🎛️ કંટ્રોલ પેનલ</span>
            </button>

            <div className="hidden sm:flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('control_panel')} title="કંટ્રોલ પેનલ પર જાઓ">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                <Landmark className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xs md:text-sm font-black truncate max-w-[180px] md:max-w-[260px] text-slate-800 dark:text-white" title={trustSettings.trustNameGuj}>
                  {trustSettings.trustNameGuj || 'ઇખર મસ્જિદ ટ્રસ્ટ , ઇખર'}
                </h1>
                <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">ચેરિટેબલ ટ્રસ્ટ અકાઉન્ટિંગ</p>
              </div>
            </div>
          </div>

          <div ref={searchContainerRef} className="relative max-w-xs sm:max-w-sm w-full mx-2">
            <div className="p-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-2 text-xs border border-transparent focus-within:border-emerald-500 transition-all shadow-inner">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                id="header-global-search-input"
                type="text"
                placeholder="પાવતી, વાઉચર, દાતા, સભ્ય, બેંક, મોડ્યુલ શોધો..."
                value={globalQuery}
                onChange={(e) => {
                  setGlobalQuery(e.target.value);
                  setGlobalSearchOpen(true);
                }}
                onFocus={() => setGlobalSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && globalResults.length > 0) {
                    setActiveTab(globalResults[0].tab);
                    setGlobalSearchOpen(false);
                  }
                }}
                className="bg-transparent border-none outline-none text-xs w-full text-slate-800 dark:text-white placeholder:text-slate-400"
              />
              {globalQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalQuery('');
                    setGlobalSearchOpen(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Global search results dropdown */}
            <AnimatePresence>
              {globalSearchOpen && globalQuery.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs text-slate-800 dark:text-white space-y-1 max-h-96 overflow-y-auto"
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-2.5 py-1 border-b border-slate-100 dark:border-slate-800">
                    <span>શોધ પરિણામો ({globalResults.length})</span>
                    <button
                      onClick={() => setGlobalSearchOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      બંધ કરો
                    </button>
                  </div>

                  {globalResults.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs font-medium">
                      "{globalQuery}" માટે કોઈ પરિણામ મળ્યું નથી.
                    </div>
                  ) : (
                    globalResults.map((res, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (res.tab === 'superadmin') {
                            if (isSuperAdminAuthenticated) {
                              setActiveTab('superadmin');
                            } else {
                              alert('કૃપા કરીને સુપર એડમિન તરીકે લોગિન કરો.');
                            }
                          } else {
                            setActiveTab(res.tab);
                          }
                          setGlobalSearchOpen(false);
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex justify-between items-center transition-colors group"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-md">
                              {res.tag}
                            </span>
                            <strong className="block text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              {res.title}
                            </strong>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                            {res.subtitle}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" />
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3 text-xs">
            {/* Direct PC Keyboard Gujarati Transliteration Toggle */}
            <button
              id="header-btn-direct-keyboard"
              onClick={() => {
                const nextVal = !gujaratiTypingEnabled;
                setGujaratiTypingEnabled(nextVal);
                localStorage.setItem('gujarati_typing_enabled', String(nextVal));
              }}
              className={`p-2 px-3.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 text-xs ${
                gujaratiTypingEnabled 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-250 dark:hover:bg-slate-750 border border-transparent'
              }`}
              title={gujaratiTypingEnabled ? "ડાયરેક્ટ કીબોર્ડ ટાઈપીંગ ચાલુ છે (ક્લિક કરો બંધ કરવા)" : "ડાયરેક્ટ કીબોર્ડ ટાઈપીંગ બંધ છે (ક્લિક કરો ચાલુ કરવા)"}
            >
              <Keyboard className={`w-4 h-4 ${gujaratiTypingEnabled ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
              <div className="text-left leading-none">
                <div className="text-[9px] font-bold uppercase tracking-wider">PC ગુજરાતી ટાઈપીંગ</div>
                <div className="text-[10px] font-black">{gujaratiTypingEnabled ? 'ચાલુ (ON)' : 'બંધ (OFF)'}</div>
              </div>
            </button>

            {/* Live real-time system clock timestamp */}
            <span
              className="text-slate-600 dark:text-slate-300 font-mono font-bold text-xs hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm shrink-0"
              title="લાઇવ સિસ્ટમ તારીખ અને સમય"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
              <span>{formatLiveDateTime(liveDateTime)}</span>
            </span>

            {/* Google Firebase Cloud / PC Offline Status Badge */}
            {isElectronOfflineApp() ? (
              <div 
                className="p-2 px-3 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-xl font-bold flex items-center gap-1.5 shrink-0 text-xs border border-blue-200 dark:border-blue-800"
                title="તમે પીસી ઇન્સ્ટોલ ઑફલાઇન ડેસ્કટોપ મોડમાં છો. તમામ ડેટા તમારા કમ્પ્યુટર પર લોકલ સાચવવામાં આવે છે."
              >
                <HardDrive className="w-4 h-4 text-blue-600" />
                <div className="text-left leading-none">
                  <div className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">PC ઑફલાઇન એપ</div>
                  <div className="text-[10px] font-black">💾 લોકલ પીસી ડેટા</div>
                </div>
              </div>
            ) : (
              <button
                id="header-btn-firebase-sync"
                onClick={() => syncToFirebaseAndCloud()}
                className="p-2 px-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 text-xs border border-emerald-300 dark:border-emerald-800 cursor-pointer"
                title="ગૂગલ ફાયરબેઝ ક્લાઉડ સ્ટોરેજ (ક્લિક કરો તાત્કાલિક સિંક કરવા)"
              >
                <div className="relative">
                  <Cloud className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${isFirebaseSyncing ? 'animate-bounce' : ''}`} />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                </div>
                <div className="text-left leading-none">
                  <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <span>Firebase Cloud</span>
                    {isFirebaseSyncing && <span className="text-[8px] animate-pulse">સિંક...</span>}
                  </div>
                  <div className="text-[10px] font-black truncate max-w-[130px]">
                    {lastFirebaseSyncTime ? `☁️ સિંક્ડ ${lastFirebaseSyncTime}` : '☁️ ક્લાઉડ સેવ સક્રિય'}
                  </div>
                </div>
              </button>
            )}

            {/* PC File Sync Menu Dropdown */}
            <div className="relative">
              {!(typeof window !== 'undefined' && 'showOpenFilePicker' in window) ? (
                <button
                  onClick={() => alert("તમારા વેબ બ્રાઉઝરમાં ઓટો-સેવ ફાઇલ સપોર્ટ નથી. કૃપા કરીને નવીનતમ Google Chrome અથવા Microsoft Edge બ્રાઉઝર વાપરો.")}
                  className="p-2 px-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl font-bold flex items-center gap-1.5 shrink-0 text-xs"
                >
                  <Database className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">PC સિંક નિષ્ક્રિય</span>
                </button>
              ) : fileHandle === null ? (
                <button
                  onClick={() => setPcSyncMenuOpen(!pcSyncMenuOpen)}
                  className="p-2 px-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 text-xs"
                >
                  <Database className="w-4 h-4 text-indigo-500" />
                  <span>📂 PC ફાઇલ લિંક કરો (ઑટો-સેવ)</span>
                </button>
              ) : !filePermissionGranted ? (
                <button
                  onClick={handleUnlockPCFile}
                  className="p-2 px-3.5 bg-amber-500 hover:bg-amber-600 text-white animate-pulse rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shrink-0 text-xs"
                  title="PC ફાઇલ ઓટો-સેવ લિંક લૉક છે. અનલોક કરવા ક્લિક કરો!"
                >
                  <KeyRound className="w-4 h-4 text-white" />
                  <span>🔓 PC લિંક અનલોક કરો</span>
                </button>
              ) : (
                <button
                  onClick={() => setPcSyncMenuOpen(!pcSyncMenuOpen)}
                  className="p-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 text-xs"
                >
                  <Database className={`w-4 h-4 text-emerald-200 ${isSyncingToPC ? 'animate-spin' : ''}`} />
                  <div className="text-left leading-none">
                    <div className="text-[9px] font-bold text-emerald-200 uppercase tracking-wider">
                      {isSyncingToPC ? 'સાચવે છે...' : 'ઑટો-સેવ એક્ટિવ'}
                    </div>
                    <div className="text-[10px] font-black truncate max-w-[120px]" title={fileName}>
                      💾 {fileName}
                    </div>
                  </div>
                </button>
              )}

              {/* Dropdown Card */}
              <AnimatePresence>
                {pcSyncMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 space-y-3"
                  >
                    <div className="flex justify-between items-center border-b pb-2">
                      <strong className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                        <Database className="w-4 h-4 text-indigo-600" /> PC ફાઇલ સિંક વ્યવસ્થાપન
                      </strong>
                      <button
                        onClick={() => setPcSyncMenuOpen(false)}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        બંધ કરો
                      </button>
                    </div>
                    
                    {fileHandle === null ? (
                      <div className="space-y-2.5">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                          તમારા હિસાબી ડેટાને બ્રાઉઝર મેમરીને બદલે સીધા તમારા કમ્પ્યુટર (PC) પર કાયમી સાચવવા માટે ફાઇલ જોડાણ કરો:
                        </p>
                        <button
                          onClick={() => {
                            setPcSyncMenuOpen(false);
                            handleCreatePCFile();
                          }}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          ➕ નવી ફાઇલ બનાવી જોડો
                        </button>
                        <button
                          onClick={() => {
                            setPcSyncMenuOpen(false);
                            handleConnectExistingPCFile();
                          }}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          📂 હાલની ફાઇલ સિલેક્ટ કરી જોડો
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5 text-xs text-slate-800 dark:text-white">
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1">
                          <span className="text-[10px] text-slate-400 block font-bold">કનેક્ટેડ ફાઇલ નામ:</span>
                          <strong className="block truncate text-emerald-600 font-mono text-[11px]" title={fileName}>
                            {fileName}
                          </strong>
                          <span className="text-[10px] text-slate-500 block leading-normal">
                            {filePermissionGranted 
                              ? "🟢 ઓટો-સેવ એક્ટિવ: સોફ્ટવેરમાં કોઈ પણ ફેરફાર કરશો તે આપોઆપ આ ફાઇલમાં સેવ થશે."
                              : "⚠️ લિંક લોક છે. કૃપા કરીને ઉપર રહેલા 'અનલોક કરો' બટન પર ક્લિક કરો જેથી સેવ થઈ શકે."}
                          </span>
                        </div>
                        
                        {filePermissionGranted && (
                          <button
                            onClick={async () => {
                              setPcSyncMenuOpen(false);
                              // Force manual save instantly
                              setIsSyncingToPC(true);
                              const payload = {
                                trust_donors: donors,
                                trust_receipts: receipts,
                                trust_vouchers: vouchers,
                                trust_banks: banks,
                                trust_members: members,
                                trust_assets: assets,
                                trust_documents: documents,
                                trust_audit_logs: auditLogs,
                                trust_licenses: licenses,
                                trust_settings: trustSettings,
                                last_saved_at: new Date().toISOString()
                              };
                              try {
                                const writable = await fileHandle.createWritable();
                                await writable.write(JSON.stringify(payload, null, 2));
                                await writable.close();
                                alert("મેન્યુઅલ સેવ સફળ! બધી વિગતો તમારા પીસી પર સાચવવામાં આવી છે.");
                              } catch (e) {
                                alert("સેવ નિષ્ફળ: " + e);
                              }
                              setIsSyncingToPC(false);
                            }}
                            className="w-full py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            💾 હમણાં જ સેવ કરો (Force Save)
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            setPcSyncMenuOpen(false);
                            handleDisconnectPCFile();
                          }}
                          className="w-full py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          ❌ ફાઇલ લિંક દૂર કરો (Disconnect)
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Draggable/floating Calculator toggle button */}
            <button
              onClick={() => setCalculatorOpen(prev => !prev)}
              className={`p-2 rounded-xl transition-all shrink-0 border ${
                calculatorOpen 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105' 
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="ગણતરી માટે કેલ્ક્યુલેટર ખોલો (Open Calculator)"
            >
              <Calculator className="w-4 h-4" />
            </button>

            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white shrink-0"
              title={darkMode ? "લાઇટ મોડ કરો" : "ડાર્ક મોડ કરો"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Header Logout / Sign Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
              title="લૉગ આઉટ (Sign Out)"
            >
              <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="hidden md:inline">લૉગ આઉટ</span>
            </button>
          </div>
        </header>

        {/* Core Content Container view switching with fade animations */}
        <main className="flex-1 p-6 overflow-y-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 5 }}
              transition={{ duration: 0.15 }}
            >
              {(activeTab === 'dashboard' || activeTab === 'control_panel') && (
                <Dashboard
                  receipts={receipts}
                  vouchers={vouchers}
                  donors={donors}
                  banks={banks}
                  currentUser={{ nameGuj: currentSessionUser?.nameGuj || '', roleGuj: currentSessionUser?.roleGuj || '' }}
                  darkMode={darkMode}
                  trustSettings={trustSettings}
                  reconciliationList={reconciliationList}
                  onSelectTab={setActiveTab}
                  isSuperAdminAuthenticated={isSuperAdminAuthenticated}
                  onLogout={handleLogout}
                  mode={activeTab === 'control_panel' ? 'control_panel' : 'dashboard'}
                />
              )}

              {activeTab === 'receipts' && (
                <IncomeModule
                  receipts={receipts}
                  donors={donors}
                  banks={banks}
                  onAddReceipt={handleAddReceipt}
                  onEditReceipt={handleEditReceipt}
                  onDeleteReceipt={handleDeleteReceipt}
                  currentUser={{ nameGuj: currentSessionUser?.nameGuj || '', role: currentSessionUser?.role || '' }}
                  darkMode={darkMode}
                  trustSettings={trustSettings}
                />
              )}

              {activeTab === 'vouchers' && (
                <ExpenseModule
                  vouchers={vouchers}
                  banks={banks}
                  onAddVoucher={handleAddVoucher}
                  onEditVoucher={handleEditVoucher}
                  onDeleteVoucher={handleDeleteVoucher}
                  currentUser={{ nameGuj: currentSessionUser?.nameGuj || '', role: currentSessionUser?.role || '' }}
                  darkMode={darkMode}
                  trustSettings={trustSettings}
                />
              )}

              {activeTab === 'banks' && (
                <BankModule
                  banks={banks}
                  receipts={receipts}
                  vouchers={vouchers}
                  onAddAccount={handleAddBankAccount}
                  onEditAccount={handleEditBankAccount}
                  onDeleteAccount={handleDeleteBankAccount}
                  onAddTransaction={handleAddBankTransaction}
                  currentUser={{ role: currentSessionUser?.role || '' }}
                  darkMode={darkMode}
                  isCustom={isCustomUser}
                  reconciliationList={reconciliationList}
                  onToggleClearStatus={handleToggleClearTransaction}
                  trustSettings={trustSettings}
                  onSaveSettings={handleSaveTrustSettings}
                />
              )}

              {activeTab === 'accounting' && (
                <AccountingModule
                  receipts={receipts}
                  vouchers={vouchers}
                  banks={banks}
                  assets={assets}
                  inventoryItems={inventoryItems}
                  purchaseBills={purchaseBills}
                  salesBills={salesBills}
                  loanApplications={loanApplications}
                  darkMode={darkMode}
                  trustSettings={trustSettings}
                  reconciliationList={reconciliationList}
                  onEditBankAccount={handleEditBankAccount}
                  onDeleteReceipt={handleDeleteReceipt}
                  onDeleteVoucher={handleDeleteVoucher}
                  onUpdateTrustSettings={(updatedSettings) => {
                    setTrustSettings(updatedSettings);
                    syncStorage('trust_settings', updatedSettings);
                    addAuditLog(
                      'નાણાકીય વર્ષ સેટિંગ્સ સુધારવામાં આવ્યા',
                      'હિસાબ મોડ્યુલ',
                      `નવું FY: ${updatedSettings.financialYear}, નવી પ્રારંભિક કૅશ શિલક: ₹ ${updatedSettings.openingCashBalance.toLocaleString('en-IN')}`
                    );
                  }}
                />
              )}

              {activeTab === 'donors' && (
                <DonorModule
                  donors={donors}
                  receipts={receipts}
                  onAddDonor={handleAddDonor}
                  onEditDonor={handleEditDonor}
                  onDeleteDonor={handleDeleteDonor}
                  currentUser={{ role: currentSessionUser?.role || '' }}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'members' && (
                <MemberModule
                  members={members}
                  onAddMember={handleAddMember}
                  onEditMember={handleEditMember}
                  onDeleteMember={handleDeleteMember}
                  sharePurchases={sharePurchases}
                  onAddSharePurchase={handleAddSharePurchase}
                  onDeleteSharePurchase={handleDeleteSharePurchase}
                  loanApplications={loanApplications}
                  onAddLoanApplication={handleAddLoanApplication}
                  onEditLoanApplication={handleEditLoanApplication}
                  onDeleteLoanApplication={handleDeleteLoanApplication}
                  onAddReceipt={handleAddReceipt}
                  trustSettings={trustSettings}
                  currentUser={{ role: currentSessionUser?.role || '' }}
                  darkMode={darkMode}
                  viewMode="sabhasad"
                />
              )}

              {activeTab === 'trust_members' && (
                <MemberModule
                  members={members}
                  onAddMember={handleAddMember}
                  onEditMember={handleEditMember}
                  onDeleteMember={handleDeleteMember}
                  sharePurchases={sharePurchases}
                  onAddSharePurchase={handleAddSharePurchase}
                  onDeleteSharePurchase={handleDeleteSharePurchase}
                  loanApplications={loanApplications}
                  onAddLoanApplication={handleAddLoanApplication}
                  onEditLoanApplication={handleEditLoanApplication}
                  onDeleteLoanApplication={handleDeleteLoanApplication}
                  onAddReceipt={handleAddReceipt}
                  trustSettings={trustSettings}
                  currentUser={{ role: currentSessionUser?.role || '' }}
                  darkMode={darkMode}
                  viewMode="trust"
                />
              )}

              {activeTab === 'assets' && (
                <AssetModule
                  assets={assets}
                  onAddAsset={handleAddAsset}
                  onEditAsset={handleEditAsset}
                  onDeleteAsset={handleDeleteAsset}
                  onDepreciateAssets={handleDepreciateAssets}
                  currentUser={{ role: currentSessionUser?.role || '' }}
                  darkMode={darkMode}
                  trustSettings={trustSettings}
                />
              )}

              {activeTab === 'purchase_sales' && (
                <PurchaseSalesModule
                  inventoryItems={inventoryItems}
                  purchaseBills={purchaseBills}
                  salesBills={salesBills}
                  banks={banks}
                  onAddInventoryItem={handleAddInventoryItem}
                  onEditInventoryItem={handleEditInventoryItem}
                  onDeleteInventoryItem={handleDeleteInventoryItem}
                  onAddPurchase={handleAddPurchaseBill}
                  onUpdatePurchase={handleUpdatePurchaseBill}
                  onAddSales={handleAddSalesBill}
                  onUpdateSales={handleUpdateSalesBill}
                  onDeletePurchase={handleDeletePurchaseBill}
                  onDeleteSales={handleDeleteSalesBill}
                  currentUser={{ role: currentSessionUser?.role || '' }}
                  darkMode={darkMode}
                  trustSettings={trustSettings}
                />
              )}

              {activeTab === 'documents' && (
                <DocModule
                  documents={documents}
                  onUploadDocument={handleUploadDocument}
                  onEditDocument={handleEditDocument}
                  onDeleteDocument={handleDeleteDocument}
                  currentUser={{ role: currentSessionUser?.role || '' }}
                  darkMode={darkMode}
                  trustSettings={trustSettings}
                />
              )}

              {activeTab === 'tharav' && (
                <AgendaTharavModule
                  tharavs={tharavs}
                  members={members}
                  onAddTharav={handleAddTharav}
                  onEditTharav={handleEditTharav}
                  onDeleteTharav={handleDeleteTharav}
                  currentUser={{ role: currentSessionUser?.role || '' }}
                  darkMode={darkMode}
                  trustSettings={trustSettings}
                />
              )}



              {activeTab === 'backup' && (
                <BackupModule
                  darkMode={darkMode}
                  trustSettings={trustSettings}
                  onSyncToCloud={() => syncToFirebaseAndCloud()}
                  onFetchFromCloud={() => fetchFromFirebaseCloud(false)}
                  isCloudSyncing={isFirebaseSyncing}
                  lastCloudSyncTime={lastFirebaseSyncTime}
                  isOfflinePC={isElectronOfflineApp()}
                />
              )}

              {activeTab === 'users' && (
                <UserManagementModule
                  appUsers={appUsers}
                  currentUser={currentSessionUser}
                  onAddUser={handleAddUser}
                  onEditUser={handleEditUser}
                  onDeleteUser={handleDeleteUser}
                  darkMode={darkMode}
                  trustSettings={trustSettings}
                />
              )}

              {activeTab === 'settings' && (
                <TrustSettingsModule
                  settings={trustSettings}
                  onSaveSettings={handleSaveTrustSettings}
                  currentUser={{ role: currentSessionUser?.role || '' }}
                  darkMode={darkMode}
                  appMode={appMode}
                  onAppModeChange={handleAppModeChange}
                  isOnline={isOnline}
                  onSyncNow={fetchFromFirebaseCloud}
                  onMasterReset={handleMasterReset}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Real-time Audit Logs status bar ticker on footer bottom for offline audit trust */}
        <footer className={`p-3 border-t text-[10px] flex flex-col md:flex-row justify-between items-center gap-2 select-none shrink-0 bg-slate-100/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-400`}>
          <div className="flex items-center gap-1.5 font-mono">
            <Terminal className="w-3.5 h-3.5 text-indigo-500" />
            <span>સ્થાનિક ઓડિટ ટ્રેકર (Real-time SQLite Audit Trail Log):</span>
            <strong className="text-emerald-600 truncate max-w-[400px]">
              {auditLogs[0] ? `[${auditLogs[0].timestamp}] ${auditLogs[0].username}: ${auditLogs[0].actionGuj} - ${auditLogs[0].detailsGuj}` : 'ઓડિટ લોગ લોડ થાય છે...'}
            </strong>
          </div>
          <div>
            <span>પરવાનો: <strong className="text-indigo-500">સક્રિય (v4.2.0-Production-Ready)</strong></span>
          </div>
        </footer>

        {calculatorOpen && (
          <CalculatorWidget onClose={() => setCalculatorOpen(false)} />
        )}

      </div>
    </div>
  );
}
