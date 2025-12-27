// src/components/attendance/TodayStatus.tsx
import React from 'react';
import { Clock, Coffee, CheckCircle, XCircle } from 'lucide-react';

interface Break {
  start: string;
  end: string | null;
}

interface TodayStatusProps {
  clockIn?: string | null;
  clockOut?: string | null;
  breaks?: Break[];
  isWorking?: boolean;
  isOnBreak?: boolean;
}

const TodayStatus: React.FC<TodayStatusProps> = ({
  clockIn = null,
  clockOut = null,
  breaks = [],
  isWorking = false,
  isOnBreak = false,
}) => {
  // 時刻フォーマット関数
  const formatTime = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 勤務時間計算（分単位）
  const calculateWorkMinutes = (): number => {
    if (!clockIn) return 0;

    const start = new Date(clockIn);
    const end = clockOut ? new Date(clockOut) : new Date();
    let workMinutes = (end.getTime() - start.getTime()) / 1000 / 60;

    // 休憩時間を差し引く
    breaks.forEach((b) => {
      if (b.start && b.end) {
        const breakStart = new Date(b.start);
        const breakEnd = new Date(b.end);
        workMinutes -= (breakEnd.getTime() - breakStart.getTime()) / 1000 / 60;
      }
    });

    return Math.max(0, workMinutes);
  };

  // 休憩時間計算（分単位）
  const calculateBreakMinutes = (): number => {
    let totalBreakMinutes = 0;

    breaks.forEach((b) => {
      if (b.start && b.end) {
        const breakStart = new Date(b.start);
        const breakEnd = new Date(b.end);
        totalBreakMinutes += (breakEnd.getTime() - breakStart.getTime()) / 1000 / 60;
      }
    });

    return totalBreakMinutes;
  };

  // 時間フォーマット（○時間○分）
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}時間${mins}分`;
  };

  // 勤務状態を取得
  const getWorkStatus = (): {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ReactNode;
  } => {
    if (!clockIn) {
      return {
        label: '未出勤',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100',
        icon: <XCircle className="text-gray-600" size={20} />,
      };
    }

    if (clockOut) {
      return {
        label: '退勤済み',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        icon: <CheckCircle className="text-blue-600" size={20} />,
      };
    }

    if (isOnBreak) {
      return {
        label: '休憩中',
        color: 'text-orange-700',
        bgColor: 'bg-orange-100',
        icon: <Coffee className="text-orange-600" size={20} />,
      };
    }

    if (isWorking) {
      return {
        label: '勤務中',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        icon: <Clock className="text-green-600" size={20} />,
      };
    }

    return {
      label: '未出勤',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: <XCircle className="text-gray-600" size={20} />,
    };
  };

  const workStatus = getWorkStatus();
  const workMinutes = calculateWorkMinutes();
  const breakMinutes = calculateBreakMinutes();
  const completedBreaksCount = breaks.filter((b) => b.end).length;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Clock className="text-indigo-600" size={24} />
          本日の勤務状況
        </h2>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${workStatus.bgColor}`}
        >
          {workStatus.icon}
          <span className={`font-semibold text-sm ${workStatus.color}`}>
            {workStatus.label}
          </span>
        </div>
      </div>

      {/* 出勤していない場合 */}
      {!clockIn && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">まだ出勤していません</p>
          <p className="text-sm mt-2">「出勤」ボタンを押して勤務を開始してください</p>
        </div>
      )}

      {/* 出勤している場合 */}
      {clockIn && (
        <div className="space-y-4">
          {/* 出勤・退勤時刻 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">出勤時刻</div>
              <div className="text-2xl font-bold text-indigo-600">
                {formatTime(clockIn)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">退勤時刻</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatTime(clockOut)}
              </div>
            </div>
          </div>

          {/* 勤務時間・休憩情報 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-xs text-gray-600 mb-1">勤務時間</div>
              <div className="text-lg font-bold text-green-600">
                {formatDuration(workMinutes)}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-xs text-gray-600 mb-1">休憩時間</div>
              <div className="text-lg font-bold text-orange-600">
                {formatDuration(breakMinutes)}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-xs text-gray-600 mb-1">休憩回数</div>
              <div className="text-lg font-bold text-blue-600">
                {completedBreaksCount}回
              </div>
            </div>
          </div>

          {/* 休憩履歴 */}
          {breaks.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Coffee size={16} />
                休憩履歴
              </h3>
              <div className="space-y-2">
                {breaks.map((b, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm bg-white p-2 rounded"
                  >
                    <span className="text-gray-600">休憩 {index + 1}</span>
                    <span className="font-medium text-gray-800">
                      {formatTime(b.start)} 〜 {formatTime(b.end)}
                      {!b.end && (
                        <span className="ml-2 text-orange-600 font-semibold">
                          (休憩中)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 勤務中のリアルタイム表示 */}
          {isWorking && !clockOut && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90 mb-1">現在の勤務時間</div>
                  <div className="text-2xl font-bold">
                    {formatDuration(workMinutes)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold">計測中</span>
                </div>
              </div>
            </div>
          )}

          {/* 退勤済みのメッセージ */}
          {clockOut && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg text-center">
              <CheckCircle className="inline-block mr-2" size={20} />
              <span className="font-semibold">
                本日の勤務は終了しました。お疲れ様でした！
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TodayStatus;