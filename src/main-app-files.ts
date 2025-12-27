// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// src/App.tsx
import React, { useState } from 'react';
import { AuthProvider, useAuth } from 'contexts/AuthContext';
import { useAttendance } from 'hooks/useAttendance';
import { useCorrection } from 'hooks/useCorrection';
import { Loading } from 'components/common/Loading';
import { Header } from 'components/common/Header';
import { TabNavigation, TabType } from 'components/common/TabNavigation';
import { LoginForm } from 'components/auth/LoginForm';
import { RegisterForm } from 'components/auth/RegisterForm';
import { Lock, Users } from 'lucide-react';

const AuthPage: React.FC = () => {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  if (loading) {
    return <Loading />;
  }

  const handleLogin = async (loginId: string, password: string): Promise<boolean> => {
    const user = await login(loginId, password);
    return !!user;
  };

  const handleRegister = async (
    name: string,
    loginId: string,
    password: string,
    role: 'admin' | 'user'
  ): Promise<boolean> => {
    const user = await register(name, loginId, password, role);
    return !!user;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Lock className="text-indigo-600 mx-auto mb-4" size={64} />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">勤怠管理システム</h1>
          <p className="text-gray-600">
            {mode === 'login' ? 'ログインしてください' : '新規ユーザー登録'}
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
              mode === 'login'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ログイン
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
              mode === 'register'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            新規登録
          </button>
        </div>

        {mode === 'login' ? (
          <LoginForm onLogin={handleLogin} />
        ) : (
          <RegisterForm onRegister={handleRegister} />
        )}
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { currentUser, users, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('clock');
  const [saving, setSaving] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  const {
    records,
    todayRecord,
    isWorking,
    isOnBreak,
    loading: attendanceLoading,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
  } = useAttendance(currentUser?.id || null);

  const {
    requests: correctionRequests,
    pendingCount,
    submitRequest,
    processRequest,
  } = useCorrection(currentUser?.id || null, isAdmin);

  if (!currentUser) {
    return <AuthPage />;
  }

  if (attendanceLoading) {
    return <Loading message="データを読み込んでいます..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Header
          userName={currentUser.name}
          isAdmin={isAdmin}
          onLogout={logout}
          saving={saving}
        />

        {/* Clock In/Out Section - 実際のコンポーネントを実装 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-indigo-600 mb-2">
              {new Date().toLocaleTimeString('ja-JP')}
            </div>
            <div className="text-xl text-gray-600">
              {new Date().toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </div>
          </div>

          {/* 出勤・退勤ボタンなどはここに実装 */}
          <div className="text-center text-gray-600">
            打刻機能を実装してください
          </div>
        </div>

        {/* Tabs and Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isAdmin={isAdmin}
            correctionBadgeCount={pendingCount}
          />

          {/* Tab Content - 各タブのコンテンツを実装 */}
          <div className="py-4">
            {activeTab === 'clock' && <div>勤怠履歴を実装してください</div>}
            {activeTab === 'report' && <div>月次レポートを実装してください</div>}
            {activeTab === 'correction' && <div>修正申請を実装してください</div>}
            {activeTab === 'admin' && isAdmin && <div>全員の勤怠確認を実装してください</div>}
            {activeTab === 'monthlyReport' && isAdmin && (
              <div>月次レポート出力を実装してください</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;

// src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

* {
  box-sizing: border-box;
}

/* スクロールバーのスタイリング */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}