// src/App.tsx
import React, { useEffect, useMemo, useState } from 'react';

import TodayStatus from './components/attendance/TodayStatus';
import ClockInOut from './components/attendance/ClockInOut';
import AttendanceTable from './components/attendance/AttendanceTable';
import MonthlyReportExport from './components/attendance/MonthlyReportExport';

type BreakItem = { start: string; end: string | null };

type AttendanceRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  clockIn: string | null;
  clockOut: string | null;
  breaks: BreakItem[];
};

const STORAGE_KEY = 'attendance_demo_state_v1';

const todayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const App: React.FC = () => {
  // 1) 勤怠レコード（最初は今日の空レコードを作る）
const makeDefault = () => {
  const t = todayKey();
  return [
    { id: `rec-${t}`, date: t, clockIn: null, clockOut: null, breaks: [] },
  ];
};

const [records, setRecords] = useState<AttendanceRecord[]>(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDefault();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as AttendanceRecord[];
    return makeDefault();
  } catch {
    return makeDefault();
  }
});


  // 2) 便利：今日のレコードを取り出す
  const todayRecord = useMemo(() => {
    const t = todayKey();
    return (
      records.find((r) => r.date === t) ?? {
        id: `rec-${t}`,
        date: t,
        clockIn: null,
        clockOut: null,
        breaks: [],
      }
    );
  }, [records]);

  // 3) 状態（勤務中/休憩中）をレコードから導出
  const isWorking = !!todayRecord.clockIn && !todayRecord.clockOut;
  const isOnBreak =
    isWorking &&
    todayRecord.breaks.length > 0 &&
    todayRecord.breaks[todayRecord.breaks.length - 1].end === null;

  // 4) localStorage 復元（最初の1回）
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as AttendanceRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setRecords(parsed);
      }
    } catch {
      // 何もしない（壊れてたら初期値のまま）
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 5) localStorage 保存（recordsが変わったら）
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      // 何もしない
    }
  }, [records]);

  // ---- 打刻処理（ここが本体） ----
  const ensureTodayRecord = (prev: AttendanceRecord[]) => {
    const t = todayKey();
    const exists = prev.some((r) => r.date === t);
    if (exists) return prev;
    return [
      ...prev,
      { id: `rec-${t}`, date: t, clockIn: null, clockOut: null, breaks: [] },
    ];
  };

  const handleClockIn = async () => {
    setRecords((prev0) => {
      const prev = ensureTodayRecord(prev0);
      const t = todayKey();
      return prev.map((r) =>
        r.date !== t
          ? r
          : r.clockIn
          ? r // すでに出勤済みなら何もしない
          : { ...r, clockIn: new Date().toISOString(), clockOut: null, breaks: [] }
      );
    });
  };

  const handleClockOut = async () => {
    setRecords((prev0) => {
      const prev = ensureTodayRecord(prev0);
      const t = todayKey();
      return prev.map((r) => {
        if (r.date !== t) return r;
        if (!r.clockIn || r.clockOut) return r; // 未出勤 or 退勤済み

        // 休憩が開いていたら閉じる（自動終了）
        const breaks = [...r.breaks];
        const last = breaks[breaks.length - 1];
        if (last && last.end === null) {
          breaks[breaks.length - 1] = { ...last, end: new Date().toISOString() };
        }

        return { ...r, clockOut: new Date().toISOString(), breaks };
      });
    });
  };

  const handleStartBreak = async () => {
    setRecords((prev0) => {
      const prev = ensureTodayRecord(prev0);
      const t = todayKey();
      return prev.map((r) => {
        if (r.date !== t) return r;
        if (!r.clockIn || r.clockOut) return r; // 勤務中じゃない
        const breaks = [...r.breaks];
        const last = breaks[breaks.length - 1];
        if (last && last.end === null) return r; // すでに休憩中
        breaks.push({ start: new Date().toISOString(), end: null });
        return { ...r, breaks };
      });
    });
  };

  const handleEndBreak = async () => {
    setRecords((prev0) => {
      const prev = ensureTodayRecord(prev0);
      const t = todayKey();
      return prev.map((r) => {
        if (r.date !== t) return r;
        if (!r.clockIn || r.clockOut) return r;
        const breaks = [...r.breaks];
        const last = breaks[breaks.length - 1];
        if (!last || last.end !== null) return r; // 休憩中じゃない
        breaks[breaks.length - 1] = { ...last, end: new Date().toISOString() };
        return { ...r, breaks };
      });
    });
  };

  return (
    <div className="p-4 space-y-6 bg-gray-100 min-h-screen">
      <TodayStatus
        clockIn={todayRecord.clockIn}
        clockOut={todayRecord.clockOut}
        breaks={todayRecord.breaks}
        isWorking={isWorking}
        isOnBreak={isOnBreak}
      />

      <ClockInOut
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        onStartBreak={handleStartBreak}
        onEndBreak={handleEndBreak}
        isWorking={isWorking}
        isOnBreak={isOnBreak}
        todayClockIn={todayRecord.clockIn}
        todayClockOut={todayRecord.clockOut}
      />

      {/* AttendanceTable 側が props 未対応なら、いったんこのままでOK（表示専用でも動く） */}
      <AttendanceTable records={records} />


      {/* MonthlyReportExport 側が props 未対応でもOK。後で records 渡して本物にする */}
      <MonthlyReportExport records={records} />
    </div>
  );
};

export default App;
