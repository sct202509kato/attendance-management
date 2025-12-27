// src/components/correction/CorrectionList.tsx
import React, { useState } from 'react';
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export interface CorrectionRequest {
  id: string;
  userId: string;
  userName: string;
  recordId: number;
  recordDate: string;
  originalClockIn: string | null;
  originalClockOut: string | null;
  correctedClockIn: string | null;
  correctedClockOut: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt: string | null;
  processedBy: string | null;
}

interface CorrectionListProps {
  requests?: CorrectionRequest[];
  isAdmin?: boolean;
  currentUserId?: string;
  onApprove?: (requestId: string) => void | Promise<void>;
  onReject?: (requestId: string) => void | Promise<void>;
  loading?: boolean;
}

const CorrectionList: React.FC<CorrectionListProps> = ({
  requests = [],
  isAdmin = false,
  currentUserId = '',
  onApprove,
  onReject,
  loading = false,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 時刻フォーマット
  const formatTime = (isoString: string | null): string => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 日付フォーマット
  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 日時フォーマット
  const formatDateTime = (isoString: string): string => {
    return new Date(isoString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ステータス表示設定
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: '承認待ち',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          icon: <AlertCircle size={16} />,
        };
      case 'approved':
        return {
          label: '承認済み',
          color: 'text-green-700',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          icon: <CheckCircle size={16} />,
        };
      case 'rejected':
        return {
          label: '却下',
          color: 'text-red-700',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          icon: <XCircle size={16} />,
        };
      default:
        return {
          label: '不明',
          color: 'text-gray-700',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          icon: <AlertCircle size={16} />,
        };
    }
  };

  // 承認処理
  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await onApprove?.(requestId);
    } catch (error) {
      console.error('承認エラー:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // 却下処理
  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await onReject?.(requestId);
    } catch (error) {
      console.error('却下エラー:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // 展開/折りたたみ
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // 変更内容の表示
  const renderChanges = (request: CorrectionRequest) => {
    const changes = [];

    if (request.correctedClockIn && request.correctedClockIn !== request.originalClockIn) {
      changes.push({
        field: '出勤時刻',
        before: formatTime(request.originalClockIn),
        after: formatTime(request.correctedClockIn),
      });
    }

    if (request.correctedClockOut && request.correctedClockOut !== request.originalClockOut) {
      changes.push({
        field: '退勤時刻',
        before: formatTime(request.originalClockOut),
        after: formatTime(request.correctedClockOut),
      });
    }

    return changes;
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
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <FileText className="mx-auto text-gray-300 mb-4" size={64} />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          修正申請はありません
        </h3>
        <p className="text-gray-600">
          {isAdmin
            ? '現在、承認待ちの修正申請はありません'
            : '修正申請を行った履歴はありません'}
        </p>
      </div>
    );
  }

  // 承認待ちの件数
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* ヘッダー情報 */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle className="text-yellow-600" size={20} />
          <span className="text-yellow-800 font-semibold">
            {isAdmin
              ? `承認待ちの申請が ${pendingCount} 件あります`
              : `承認待ちの申請が ${pendingCount} 件あります`}
          </span>
        </div>
      )}

      {/* 申請一覧 */}
      <div className="space-y-3">
        {requests.map((request) => {
          const statusConfig = getStatusConfig(request.status);
          const changes = renderChanges(request);
          const isExpanded = expandedId === request.id;
          const isProcessing = processingId === request.id;

          return (
            <div
              key={request.id}
              className={`bg-white rounded-lg shadow-md border-2 transition-all ${
                request.status === 'pending'
                  ? 'border-yellow-200'
                  : statusConfig.borderColor
              }`}
            >
              {/* カードヘッダー */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(request.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* ユーザー名と日付 */}
                    <div className="flex items-center gap-3 mb-2">
                      {isAdmin && (
                        <span className="font-bold text-gray-800 text-lg">
                          {request.userName}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.bgColor} ${statusConfig.color}`}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* 対象日と申請日時 */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>対象日: {formatDate(request.recordDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>申請日: {formatDateTime(request.requestedAt)}</span>
                      </div>
                    </div>

                    {/* 変更内容サマリー */}
                    <div className="flex flex-wrap gap-2">
                      {changes.map((change, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded"
                        >
                          {change.field}: {change.before} → {change.after}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 展開アイコン */}
                  <div className="ml-4">
                    {isExpanded ? (
                      <ChevronUp className="text-gray-400" size={24} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={24} />
                    )}
                  </div>
                </div>
              </div>

              {/* 展開コンテンツ */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                  {/* 変更詳細 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 変更前 */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Clock size={16} />
                        変更前
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">出勤:</span>
                          <span className="ml-2 font-medium text-gray-800">
                            {formatTime(request.originalClockIn)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">退勤:</span>
                          <span className="ml-2 font-medium text-gray-800">
                            {formatTime(request.originalClockOut)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 変更後 */}
                    <div className="bg-white p-4 rounded-lg border border-indigo-200">
                      <h4 className="text-sm font-semibold text-indigo-700 mb-3 flex items-center gap-2">
                        <Clock size={16} />
                        変更後
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">出勤:</span>
                          <span className="ml-2 font-semibold text-indigo-700">
                            {formatTime(request.correctedClockIn || request.originalClockIn)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">退勤:</span>
                          <span className="ml-2 font-semibold text-indigo-700">
                            {formatTime(request.correctedClockOut || request.originalClockOut)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 申請理由 */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText size={16} />
                      申請理由
                    </h4>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {request.reason}
                    </p>
                  </div>

                  {/* 処理情報 */}
                  {request.processedAt && (
                    <div className="text-xs text-gray-500 bg-white p-3 rounded border border-gray-200">
                      処理日時: {formatDateTime(request.processedAt)}
                    </div>
                  )}

                  {/* 管理者用アクションボタン */}
                  {isAdmin && request.status === 'pending' && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(request.id);
                        }}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={20} />
                        {isProcessing ? '処理中...' : '承認'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(request.id);
                        }}
                        disabled={isProcessing}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <XCircle size={20} />
                        {isProcessing ? '処理中...' : '却下'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CorrectionList;