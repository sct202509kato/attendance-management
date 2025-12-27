// src/components/common/Loading.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loading: React.FC<{ message?: string }> = ({ message = '読み込み中...' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

// src/components/common/Header.tsx
import React from 'react';
import { Clock, User, LogOut, Loader2 } from 'lucide-react';

interface HeaderProps {
  userName: string;
  isAdmin: boolean;
  onLogout: () => void;
  saving?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ userName, isAdmin, onLogout, saving }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Clock className="text-indigo-600" />
            勤怠管理システム
          </h1>
          <div className="flex items-center gap-2 text-gray-600">
            <User size={20} />
            <span className="font-semibold">{userName}</span>
            さん
            {isAdmin && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                管理者
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <LogOut size={20} />
          ログアウト
        </button>
      </div>
      {saving && (
        <div className="mt-2 flex items-center gap-2 text-sm text-indigo-600">
          <Loader2 className="animate-spin" size={16} />
          保存中...
        </div>
      )}
    </div>
  );
};

// src/components/common/TabNavigation.tsx
import React from 'react';
import { Calendar, FileText, Users, Download } from 'lucide-react';

export type TabType = 'clock' | 'report' | 'correction' | 'admin' | 'monthlyReport';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isAdmin: boolean;
  correctionBadgeCount?: number;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  isAdmin,
  correctionBadgeCount = 0,
}) => {
  const tabs = [
    { id: 'clock' as TabType, label: '勤怠履歴', icon: Calendar, showToAll: true },
    { id: 'report' as TabType, label: '月次レポート', icon: FileText, showToAll: true },
    { id: 'correction' as TabType, label: '修正申請', icon: FileText, showToAll: true },
    { id: 'admin' as TabType, label: '全員の勤怠確認', icon: Users, showToAll: false },
    { id: 'monthlyReport' as TabType, label: '月次レポート出力', icon: Download, showToAll: false },
  ];

  return (
    <div className="flex gap-4 mb-6 border-b overflow-x-auto">
      {tabs.map((tab) => {
        if (!tab.showToAll && !isAdmin) return null;

        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`pb-2 px-4 font-semibold transition-colors whitespace-nowrap relative ${
              isActive
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="inline mr-2" size={20} />
            {tab.label}
            {tab.id === 'correction' && correctionBadgeCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {correctionBadgeCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};