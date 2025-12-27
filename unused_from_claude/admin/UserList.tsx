// src/components/admin/UserList.tsx
import React, { useState } from 'react';
import { User, Users, Search, ShieldCheck, UserCircle, ChevronRight } from 'lucide-react';

export interface UserInfo {
  id: string;
  name: string;
  email?: string;
  loginId: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface UserListProps {
  users?: UserInfo[];
  onSelectUser?: (userId: string) => void;
  loading?: boolean;
}

const UserList: React.FC<UserListProps> = ({
  users = [],
  onSelectUser,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // 検索フィルタリング
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.loginId.toLowerCase().includes(query)
    );
  });

  // 役割ごとの件数
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const userCount = users.filter((u) => u.role === 'user').length;

  // 日付フォーマット
  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 役割バッジの設定
  const getRoleBadge = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      return {
        label: '管理者',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        icon: <ShieldCheck size={14} />,
      };
    }
    return {
      label: '一般',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      icon: <UserCircle size={14} />,
    };
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  // データが空の場合
  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <Users className="mx-auto text-gray-300 mb-4" size={64} />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          ユーザーが存在しません
        </h3>
        <p className="text-gray-600">
          システムに登録されているユーザーがいません
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-indigo-600" size={28} />
            ユーザー管理
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
              <ShieldCheck className="text-red-600" size={18} />
              <span className="text-red-700 font-semibold">
                管理者: {adminCount}名
              </span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
              <UserCircle className="text-blue-600" size={18} />
              <span className="text-blue-700 font-semibold">
                一般: {userCount}名
              </span>
            </div>
          </div>
        </div>

        {/* 検索バー */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ユーザー名、メールアドレス、ログインIDで検索..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600">
            {filteredUsers.length} 件の結果
          </p>
        )}
      </div>

      {/* ユーザー一覧 */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">検索条件に一致するユーザーが見つかりません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const roleBadge = getRoleBadge(user.role);

            return (
              <div
                key={user.id}
                onClick={() => onSelectUser?.(user.id)}
                className="bg-white rounded-lg shadow-md border border-gray-200 hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* アバター */}
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* ユーザー情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-800 truncate">
                          {user.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadge.bgColor} ${roleBadge.color}`}
                        >
                          {roleBadge.icon}
                          {roleBadge.label}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {user.email && (
                          <p className="text-sm text-gray-600 truncate">
                            📧 {user.email}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          🆔 {user.loginId}
                        </p>
                        <p className="text-xs text-gray-500">
                          登録日: {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 右矢印アイコン */}
                  <ChevronRight className="text-gray-400 flex-shrink-0" size={24} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserList;