/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Receipt,
  CreditCard,
  Building2,
  BookOpen,
  Users,
  UserCheck,
  Award,
  Package,
  ShoppingCart,
  FileText,
  FileSpreadsheet,
  Database,
  UserCog,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Sun,
  Moon,
  LogOut,
  Landmark,
  Cloud,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { TrustSettings } from '../types';

interface NavGroup {
  labelGuj: string;
  items: {
    id: string;
    labelGuj: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
    accentColor?: string;
  }[];
}

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  currentUser: {
    username: string;
    nameGuj: string;
    role: string;
    roleGuj: string;
  } | null;
  trustSettings?: TrustSettings;
  darkMode: boolean;
  onToggleTheme: () => void;
  onOpenCalculator: () => void;
  onLogout: () => void;
  counts: {
    receipts?: number;
    vouchers?: number;
    donors?: number;
    members?: number;
    banks?: number;
    assets?: number;
    documents?: number;
    tharavs?: number;
  };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isCloudConnected?: boolean;
  isSuperAdminAuthenticated?: boolean;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  currentUser,
  trustSettings,
  darkMode,
  onToggleTheme,
  onOpenCalculator,
  onLogout,
  counts,
  isCollapsed,
  onToggleCollapse,
  isCloudConnected = true,
  isSuperAdminAuthenticated = false
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const userRole = currentUser?.role || 'Admin';

  const isTabAllowed = (tabId: string): boolean => {
    if (tabId === 'dashboard' || tabId === 'control_panel') return true;
    if (userRole === 'Admin') return true;
    if (userRole === 'Accountant') {
      return !['users', 'settings'].includes(tabId);
    }
    if (userRole === 'DataEntry' || userRole === 'ReadOnly') {
      return !['banks', 'accounting', 'backup', 'settings', 'users'].includes(tabId);
    }
    return false;
  };

  const navGroups: NavGroup[] = [
    {
      labelGuj: 'મુખ્ય સંચાલન',
      items: [
        {
          id: 'control_panel',
          labelGuj: '🎛️ કંટ્રોલ પેનલ',
          icon: LayoutDashboard,
          accentColor: 'text-emerald-500'
        },
        {
          id: 'dashboard',
          labelGuj: '📊 ડેશબોર્ડ & વિશ્લેષણ',
          icon: BarChart3,
          accentColor: 'text-indigo-500'
        }
      ]
    },
    {
      labelGuj: 'નાણાકીય હિસાબો & ઓડિટ',
      items: [
        {
          id: 'accounting',
          labelGuj: 'રોજમેળ & ઓડિટ પત્રકો',
          icon: BookOpen,
          badge: 'કાચું સરવૈયું / સરવૈયું',
          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
          accentColor: 'text-emerald-600'
        },
        {
          id: 'receipts',
          labelGuj: 'આવક દાન પાવતીઓ',
          icon: Receipt,
          badge: counts.receipts,
          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
          accentColor: 'text-emerald-500'
        },
        {
          id: 'vouchers',
          labelGuj: 'ખર્ચ વાઉચર્સ',
          icon: CreditCard,
          badge: counts.vouchers,
          badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
          accentColor: 'text-rose-500'
        },
        {
          id: 'banks',
          labelGuj: 'બેંક ખાતાઓ & મેળવણી',
          icon: Landmark,
          badge: counts.banks,
          badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200',
          accentColor: 'text-sky-500'
        }
      ]
    },
    {
      labelGuj: 'સભાસદો & દાતાઓ',
      items: [
        {
          id: 'donors',
          labelGuj: 'દાતાઓ યાદી (Donors)',
          icon: Users,
          badge: counts.donors,
          badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
          accentColor: 'text-purple-500'
        },
        {
          id: 'members',
          labelGuj: 'સભાસદ મંડળ, શેર & લોન',
          icon: UserCheck,
          badge: counts.members,
          badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
          accentColor: 'text-amber-500'
        },
        {
          id: 'trust_members',
          labelGuj: 'ટ્રસ્ટ હોદ્દેદારો (Trustees)',
          icon: Award,
          accentColor: 'text-yellow-600'
        }
      ]
    },
    {
      labelGuj: 'મિલકતો & માલસામાન',
      items: [
        {
          id: 'assets',
          labelGuj: 'સ્થાવર-જંગમ મિલકતો',
          icon: Building2,
          badge: counts.assets,
          badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200',
          accentColor: 'text-teal-500'
        },
        {
          id: 'purchase_sales',
          labelGuj: 'ખરીદ-વેચાણ & સ્ટોક',
          icon: ShoppingCart,
          accentColor: 'text-orange-500'
        }
      ]
    },
    {
      labelGuj: 'દસ્તાવેજો & રેકોર્ડ્સ',
      items: [
        {
          id: 'documents',
          labelGuj: 'દસ્તાવેજો & આવક-જાવક ટપાલ',
          icon: FileText,
          badge: counts.documents,
          badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
          accentColor: 'text-blue-500'
        },
        {
          id: 'tharav',
          labelGuj: 'એજન્ડા & ઠરાવ બુક',
          icon: FileSpreadsheet,
          badge: counts.tharavs,
          badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200',
          accentColor: 'text-cyan-500'
        }
      ]
    },
    {
      labelGuj: 'સિસ્ટમ & વહીવટ',
      items: [
        {
          id: 'backup',
          labelGuj: 'ઓટો બેકઅપ & PC સિંક',
          icon: Database,
          accentColor: 'text-emerald-500'
        },
        {
          id: 'users',
          labelGuj: 'યુઝર્સ મેનેજમેન્ટ',
          icon: UserCog,
          accentColor: 'text-slate-500'
        },
        {
          id: 'settings',
          labelGuj: 'ટ્રસ્ટ માહિતી & સેટિંગ્સ',
          icon: Settings,
          accentColor: 'text-slate-600'
        },
        ...(isSuperAdminAuthenticated || currentUser?.username === 'patelmunaf90@gmail.com' ? [
          {
            id: 'superadmin',
            labelGuj: 'સુપર એડમિન કંટ્રોલ',
            icon: ShieldCheck,
            badge: 'PRO',
            badgeColor: 'bg-amber-500 text-white font-bold',
            accentColor: 'text-amber-500'
          }
        ] : [])
      ]
    }
  ];

  return (
    <aside
      className={`relative flex flex-col shrink-0 border-r transition-all duration-300 z-30 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
      } ${isCollapsed ? 'w-20' : 'w-72 md:w-80'}`}
    >
      {/* Top Branding Section */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shrink-0 font-black text-lg">
            {trustSettings?.trustNameGuj ? trustSettings.trustNameGuj.charAt(0) : 'ટ્ર'}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-black text-sm text-slate-900 dark:text-white truncate leading-tight">
                {trustSettings?.trustNameGuj || 'સાર્વજનિક ટ્રસ્ટ હિસાબ'}
              </h1>
              <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 truncate flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                {trustSettings?.regNoGuj || 'ગુજરાત પબ્લિક ટ્રસ્ટ એક્ટ'}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all shrink-0 cursor-pointer shadow-2xs"
          title={isCollapsed ? "સાઇડબાર મોટું કરો (Expand Sidebar)" : "સાઇડબાર નાનું કરો (Collapse Sidebar)"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Cloud & FY Status Mini-Bar */}
      {!isCollapsed && (
        <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-850/50 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="truncate">{trustSettings?.financialYear || 'FY ૨૦૨૬-૨૭'}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>ક્લાઉડ સિંક ઓકે</span>
          </div>
        </div>
      )}

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter(item => isTabAllowed(item.id));
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 select-none">
                  {group.labelGuj}
                </div>
              )}
              <div className="space-y-0.5">
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left relative group cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title={isCollapsed ? item.labelGuj : undefined}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : item.accentColor || 'text-slate-500'
                        }`}
                      />

                      {!isCollapsed && (
                        <span className="flex-1 truncate leading-tight">
                          {item.labelGuj}
                        </span>
                      )}

                      {!isCollapsed && item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badgeColor || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip for collapsed mode */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                          {item.labelGuj}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer & User Profile */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-2">
        {/* Quick Utility Buttons */}
        <div className={`flex items-center gap-1.5 ${isCollapsed ? 'flex-col' : 'justify-between'}`}>
          <button
            type="button"
            onClick={onOpenCalculator}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer flex-1 justify-center"
            title="કેલ્ક્યુલેટર ખોલો"
          >
            <Calculator className="w-4 h-4 text-emerald-600" />
            {!isCollapsed && <span>કેલ્ક્યુલેટર</span>}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all shadow-2xs cursor-pointer shrink-0"
            title={darkMode ? "લાઇટ મોડ કરો" : "ડાર્ક મોડ કરો"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>

        {/* User profile row */}
        {currentUser && (
          <div className={`pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                {currentUser.nameGuj ? currentUser.nameGuj.charAt(0) : 'U'}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {currentUser.nameGuj || currentUser.username}
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-300 truncate">
                    {currentUser.roleGuj || currentUser.role}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-all shrink-0 cursor-pointer"
              title="લૉગ આઉટ (Sign Out)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
