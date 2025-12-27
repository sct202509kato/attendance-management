// src/components/correction/CorrectionModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, FileText } from 'lucide-react';

interface AttendanceRecord {
  id: number;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
}

interface CorrectionModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (data: CorrectionSubmitData) => void | Promise<void>;
  record?: AttendanceRecord | null;
}

export interface CorrectionSubmitData {
  recordId: number;
  recordDate: string;
  originalClockIn: string | null;
  originalClockOut: string | null;
  correctedClockIn: string;
  correctedClockOut: string;
  reason: string;
}

const CorrectionModal: React.FC<CorrectionModalProps> = ({
  isOpen = false,
  onClose,
  onSubmit,
  record = null,
}) => {
  const [correctedClockIn, setCorrectedClockIn] = useState('');
  const [correctedClockOut, setCorrectedClockOut] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // モーダルが開いたときに初期値をセット
  useEffect(() => {
    if (isOpen && record) {
      setCorrectedClockIn(formatDateTimeLocal(record.clockIn));
      setCorrectedClockOut(formatDateTimeLocal(record.clockOut));
      setReason('');
      setError('');
    }
  }, [isOpen, record]);

  // ISO文字列を datetime-local 形式に変換
  const formatDateTimeLocal = (isoString: string | null): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // 時刻のみをフォーマット（表示用）
  const formatTime = (isoString: string | null): string => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 日付のみをフォーマット（表示用）
  const formatDate = (isoString: string | null): string => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  // バリデーション
  const validate = (): boolean => {
    setError('');

    if (!reason.trim()) {
      setError('修正理由を入力してください');
      return false;
    }

    if (!correctedClockIn && !correctedClockOut) {
      setError('修正後の時刻を少なくとも1つ入力してください');
      return false;
    }

    // 出勤時刻が退勤時刻より後になっていないかチェック
    if (correctedClockIn && correctedClockOut) {
      const clockInTime = new Date(correctedClockIn).getTime();
      const clockOutTime = new Date(correctedClockOut).getTime();
      if (clockInTime >= clockOutTime) {
        setError('退勤時刻は出勤時刻より後に設定してください');
        return false;
      }
    }

    return true;
  };

  // 送信処理
  const handleSubmit = async () => {
    if (!validate()) return;
    if (!record) return;

    setIsSubmitting(true);

    try {
      const submitData: CorrectionSubmitData = {
        recordId: record.id,
        recordDate: record.date,
        originalClockIn: record.clockIn,
        originalClockOut: record.clockOut,
        correctedClockIn: correctedClockIn || record.clockIn || '',
        correctedClockOut: correctedClockOut || record.clockOut || '',
        reason: reason.trim(),
      };

      await onSubmit?.(submitData);

      // 成功したらモーダルを閉じる
      handleClose();
    } catch (err) {
      setError('申請の送信に失敗しました');
      console.error('申請送信エラー:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // モーダルを閉じる
  const handleClose = () => {
    if (isSubmitting) return;
    setCorrectedClockIn('');
    setCorrectedClockOut('');
    setReason('');
    setError('');
    onClose?.();
  };

  // 背景クリックで閉じる
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Escキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // モーダル表示中はbodyのスクロールを無効化
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // モーダルが閉じている場合は何も表示しない
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-indigo-600" size={28} />
            勤怠修正申請
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
            aria-label="閉じる"
          >
            <X size={24} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <span className="text-red-500 font-bold">⚠</span>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* 対象日表示 */}
          {record && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-900 font-semibold mb-3">
                <Calendar className="text-indigo-600" size={20} />
                対象日
              </div>
              <div className="text-lg font-bold text-indigo-700">
                {formatDate(record.date)}
              </div>
            </div>
          )}

          {/* 現在の打刻時刻 */}
          {record && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="text-gray-600" size={18} />
                現在の打刻時刻
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">出勤:</span>
                  <span className="ml-2 font-semibold text-gray-800">
                    {formatTime(record.clockIn)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">退勤:</span>
                  <span className="ml-2 font-semibold text-gray-800">
                    {formatTime(record.clockOut)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 修正後の時刻入力 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock className="text-indigo-600" size={18} />
              修正後の時刻
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 出勤時刻 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  出勤時刻
                </label>
                <input
                  type="datetime-local"
                  value={correctedClockIn}
                  onChange={(e) => setCorrectedClockIn(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
              </div>

              {/* 退勤時刻 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  退勤時刻
                </label>
                <input
                  type="datetime-local"
                  value={correctedClockOut}
                  onChange={(e) => setCorrectedClockOut(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              ※ 修正が必要な時刻のみ入力してください。未入力の項目は変更されません。
            </p>
          </div>

          {/* 修正理由 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              修正理由 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              placeholder="例: 打刻忘れのため&#10;例: システムエラーにより正しく記録されなかったため"
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                修正が必要な理由を具体的に記入してください
              </p>
              <p className="text-xs text-gray-400">
                {reason.length} / 500
              </p>
            </div>
          </div>

          {/* 注意事項 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-800 mb-2">
              ⚠️ 注意事項
            </h4>
            <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
              <li>申請後は管理者による承認が必要です</li>
              <li>承認されるまで勤怠記録は変更されません</li>
              <li>虚偽の申請は行わないでください</li>
            </ul>
          </div>
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-xl">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isSubmitting ? '送信中...' : '申請する'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CorrectionModal;