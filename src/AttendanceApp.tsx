// src/AttendanceApp.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { User, signOut } from "firebase/auth";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

import TodayStatus from "./components/attendance/TodayStatus";
import ClockInOut from "./components/attendance/ClockInOut";
import AttendanceTable from "./components/attendance/AttendanceTable";
import MonthlyReportExport from "./components/attendance/MonthlyReportExport";

/* ======================
   型定義
====================== */
type BreakItem = { start: string; end: string | null };

type AttendanceRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  clockIn: string | null;
  clockOut: string | null;
  breaks: BreakItem[];
};

/* ======================
   日付・初期化系
====================== */
const todayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const makeDefault = (): AttendanceRecord[] => {
  const t = todayKey();
  return [{ id: `rec-${t}`, date: t, clockIn: null, clockOut: null, breaks: [] }];
};

const ensureToday = (prev: AttendanceRecord[]) => {
  const t = todayKey();
  if (prev.some((r) => r.date === t)) return prev;
  return [...prev, { id: `rec-${t}`, date: t, clockIn: null, clockOut: null, breaks: [] }];
};

/* ======================
   メインコンポーネント
====================== */
const AttendanceApp: React.FC<{ user: User }> = ({ user }) => {
  const STORAGE_KEY = `attendance_demo_state_v1_${user.uid}`;

  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDefault();
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : makeDefault();
    } catch {
      return makeDefault();
    }
  });

  const hasLoadedFirestore = useRef(false);

  /* ======================
     Firestore コレクション（ユーザー別）
  ====================== */
  const colRef = useMemo(() => {
    return collection(db, "users", user.uid, "attendanceRecords");
  }, [user.uid]);

  /* ======================
     Firestore 読み込み
  ====================== */
  useEffect(() => {
    const loadFromFirestore = async () => {
      try {
        const snap = await getDocs(colRef);
        const list: AttendanceRecord[] = snap.docs.map((d) => {
          const data = d.data() as Omit<AttendanceRecord, "id">;
          return {
            id: d.id,
            date: data.date,
            clockIn: data.clockIn ?? null,
            clockOut: data.clockOut ?? null,
            breaks: Array.isArray(data.breaks) ? data.breaks : [],
          };
        });

        setRecords(list.length > 0 ? list.sort((a, b) => (a.date < b.date ? 1 : -1)) : makeDefault());
      } catch (e) {
        console.error("Firestore load error:", e);
      } finally {
        hasLoadedFirestore.current = true;
      }
    };

    loadFromFirestore();
  }, [colRef]);

  /* ======================
     Firestore 保存
  ====================== */
  useEffect(() => {
    if (!hasLoadedFirestore.current) return;

    const saveToFirestore = async () => {
      try {
        await Promise.all(
          records.map((r) =>
            setDoc(
              doc(colRef, r.id),
              {
                date: r.date,
                clockIn: r.clockIn,
                clockOut: r.clockOut,
                breaks: r.breaks,
              },
              { merge: true }
            )
          )
        );
      } catch (e) {
        console.error("Firestore save error:", e);
      }
    };

    saveToFirestore();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records, colRef, STORAGE_KEY]);

  /* ======================
     今日の状態
  ====================== */
  const todayRecord = useMemo(() => {
    const t = todayKey();
    return records.find((r) => r.date === t) ?? makeDefault()[0];
  }, [records]);

  const isWorking = !!todayRecord.clockIn && !todayRecord.clockOut;
  const isOnBreak =
    isWorking &&
    todayRecord.breaks.length > 0 &&
    todayRecord.breaks[todayRecord.breaks.length - 1].end === null;

  /* ======================
     打刻処理
  ====================== */
  const handleClockIn = () => {
    setRecords((prev) =>
      ensureToday(prev).map((r) =>
        r.date === todayKey() && !r.clockIn
          ? { ...r, clockIn: new Date().toISOString(), clockOut: null, breaks: [] }
          : r
      )
    );
  };

  const handleClockOut = () => {
    setRecords((prev) =>
      ensureToday(prev).map((r) => {
        if (r.date !== todayKey() || !r.clockIn || r.clockOut) return r;
        const breaks = [...r.breaks];
        const last = breaks[breaks.length - 1];
        if (last && last.end === null) {
          breaks[breaks.length - 1] = { ...last, end: new Date().toISOString() };
        }
        return { ...r, clockOut: new Date().toISOString(), breaks };
      })
    );
  };

  const handleStartBreak = () => {
    setRecords((prev) =>
      ensureToday(prev).map((r) => {
        if (r.date !== todayKey() || !r.clockIn || r.clockOut) return r;
        const last = r.breaks[r.breaks.length - 1];
        if (last && last.end === null) return r;
        return { ...r, breaks: [...r.breaks, { start: new Date().toISOString(), end: null }] };
      })
    );
  };

  const handleEndBreak = () => {
    setRecords((prev) =>
      ensureToday(prev).map((r) => {
        if (r.date !== todayKey() || !r.clockIn || r.clockOut) return r;
        const breaks = [...r.breaks];
        const last = breaks[breaks.length - 1];
        if (!last || last.end !== null) return r;
        breaks[breaks.length - 1] = { ...last, end: new Date().toISOString() };
        return { ...r, breaks };
      })
    );
  };

  /* ======================
     UI
  ====================== */
  return (
    <div className="p-4 space-y-6 bg-gray-100 min-h-screen">
      <div className="flex justify-end">
        <button className="text-sm underline" onClick={() => signOut(auth)}>
          ログアウト
        </button>
      </div>

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

      <AttendanceTable records={records} />
      <MonthlyReportExport records={records} />
    </div>
  );
};

export default AttendanceApp;
