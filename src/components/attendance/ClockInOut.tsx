// src/components/attendance/ClockInOut.tsx
import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Coffee, Clock } from 'lucide-react';

interface ClockInOutProps {
  onClockIn?: () => Promise<void>;
  onClockOut?: () => Promise<void>;
  onStartBreak?: () => Promise<void>;
  onEndBreak?: () => Promise<void>;
  isWorking?: boolean;
  isOnBreak?: boolean;
  todayClockIn?: string | null;
  todayClockOut?: string | null;
  disabled?: boolean;
}

const ClockInOut: React.FC<ClockInOutProps> = ({
  onClockIn,
  onClockOut,
  onStartBreak,
  onEndBreak,
  isWorking = false,
  isOnBreak = false,
  todayClockIn = null,
  todayClockOut = null,
  disabled = false,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClockIn = async () => {
    setLoading(true);
    try {
      await onClockIn?.();
    } catch (error) {
      console.error('出勤エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await onClockOut?.();
    } catch (error) {
      console.error('退勤エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setLoading(true);
    try {
      await onStartBreak?.();
    } catch (error) {
      console.error('休憩開始エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setLoading(true);
    try {
      await onEndBreak?.();
    } catch (error) {
      console.error('休憩終了エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* 現在時刻表示 */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-indigo-600 mb-2">
          {currentTime.toLocaleTimeString('ja-JP')}
        </div>
        <div className="text-xl text-gray-600">
          {currentTime.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </div>
      </div>

      {/* 勤務状態表示 */}
      {(todayClockIn || todayClockOut) && (
        <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-indigo-600" size={20} />
            <h3 className="font-semibold text-indigo-900">本日の勤務状況</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">出勤:</span>
              <span className="ml-2 font-semibold">
                {todayClockIn ? formatTime(todayClockIn) : '未打刻'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">退勤:</span>
              <span className="ml-2 font-semibold">
                {todayClockOut ? formatTime(todayClockOut) : '未打刻'}
              </span>
            </div>
          </div>
          {isWorking && (
            <div className="mt-2 text-sm">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                  isOnBreak
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {isOnBreak ? '休憩中' : '勤務中'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 出勤・退勤ボタン */}
      <div className="flex gap-4 justify-center mb-6">
        <button
          onClick={handleClockIn}
          disabled={isWorking || !!todayClockIn || disabled || loading}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg"
        >
          <LogIn size={24} />
          出勤
        </button>
        <button
          onClick={handleClockOut}
          disabled={!isWorking || disabled || loading}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg"
        >
          <LogOut size={24} />
          退勤
        </button>
      </div>

      {/* 休憩ボタン */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={handleStartBreak}
          disabled={!isWorking || isOnBreak || disabled || loading}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Coffee size={20} />
          休憩開始
        </button>
        <button
          onClick={handleEndBreak}
          disabled={!isWorking || !isOnBreak || disabled || loading}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Coffee size={20} />
          休憩終了
        </button>
      </div>
    </div>
  );
};

export default ClockInOut;
