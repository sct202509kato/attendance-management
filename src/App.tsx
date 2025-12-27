// src/App.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

import TodayStatus from "./components/attendance/TodayStatus";
import ClockInOut from "./components/attendance/ClockInOut";
import AttendanceTable from "./components/attendance/AttendanceTable";
import MonthlyReportExport from "./components/attendance/MonthlyReportExport";

import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "./firebase";

type BreakItem = { start: string; end: string | null };

type AttendanceRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  clockIn: string | null;
  clockOut: string | null;
  breaks: BreakItem[];
};

const STORAGE_KEY = "attendance_demo_state_v1";
const COL_NAME = "attendanceRecords";

const todayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // ローカル日付（JST環境ならJST）
};


const makeDefault = (): AttendanceRecord[] => {
  const t = todayKey();
  return [{ id: `rec-${t}`, date: t, clockIn: null, clockOut: null, breaks: [] }];
};

const safeParse = (raw: string | null): AttendanceRecord[] | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as AttendanceRecord[];
  } catch {
    return null;
  }
};



const App: React.FC = () => {
  // 1) 初期値：localStorage → なければ今日の空レコード
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY));
    return saved && saved.length > 0 ? saved : makeDefault();
  });

  const [loading, setLoading] = useState(true);

  // Firestore読み込み後の「初回保存暴発」を防ぐためのフラグ
  const hasLoadedFirestore = useRef(false);

  // 2) 起動後：Firestore があれば上書き（doc.id を id に入れる）
  useEffect(() => {
    const loadFromFirestore = async () => {
      try {
        const snap = await getDocs(collection(db, COL_NAME));
        const list: AttendanceRecord[] = snap.docs.map((d) => {
          const data = d.data() as Omit<AttendanceRecord, "id">;
          return {
            id: d.id, // ★これが重要（d.data()だけだとidが無い）
            date: data.date,
            clockIn: data.clockIn ?? null,
            clockOut: data.clockOut ?? null,
            breaks: Array.isArray(data.breaks) ? (data.breaks as BreakItem[]) : [],
          };
        });

        if (list.length > 0) {
          list.sort((a, b) => (a.date < b.date ? 1 : -1));
          setRecords(list);
        } else {
          // Firestore が空なら、最低でも今日のレコードはある状態にする
          setRecords((prev) => (prev.length > 0 ? prev : makeDefault()));
        }
      } catch (e) {
        console.error("Firestore load error:", e);
      } finally {
        hasLoadedFirestore.current = true;
        setLoading(false);
      }
    };

    loadFromFirestore();
  }, []);

  // 3) localStorage 保存（recordsが変わったら）
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      // 何もしない
    }
  }, [records]);

  // Firestore読み込み後/日付が変わった後でも、今日のレコードを必ず用意する
useEffect(() => {
  const t = todayKey();
  setRecords((prev) => {
    const exists = prev.some((r) => r.date === t);
    if (exists) return prev;
    return [...prev, { id: `rec-${t}`, date: t, clockIn: null, clockOut: null, breaks: [] }];
  });
  // records の変化で毎回走るけど、exists なら何もしないので安全
}, [records]);

  // 4) Firestore 保存（recordsが変わったら）
  //    ※読み込み前(loading中)の保存はしない
  useEffect(() => {
    if (loading) return;
    if (!hasLoadedFirestore.current) return;

    const saveToFirestore = async () => {
      try {
        await Promise.all(
          records.map((r) =>
            setDoc(
              doc(db, COL_NAME, r.id || `rec-${r.date}`),
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
  }, [records, loading]);

  // 5) 便利：今日のレコードを取り出す
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

  // 6) 状態（勤務中/休憩中）をレコードから導出
  const isWorking = !!todayRecord.clockIn && !todayRecord.clockOut;
  const isOnBreak =
    isWorking &&
    todayRecord.breaks.length > 0 &&
    todayRecord.breaks[todayRecord.breaks.length - 1].end === null;

  // ---- 打刻処理（ここが本体）----
  const ensureTodayRecord = (prev: AttendanceRecord[]) => {
    const t = todayKey();
    const exists = prev.some((r) => r.date === t);
    if (exists) return prev;
    return [...prev, { id: `rec-${t}`, date: t, clockIn: null, clockOut: null, breaks: [] }];
  };

  const handleClockIn = async () => {
    setRecords((prev0) => {
      const prev = ensureTodayRecord(prev0);
      const t = todayKey();
      return prev.map((r) =>
        r.date !== t
          ? r
          : r.clockIn
          ? r
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
        if (!r.clockIn || r.clockOut) return r;

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
        if (!r.clockIn || r.clockOut) return r;
        const breaks = [...r.breaks];
        const last = breaks[breaks.length - 1];
        if (last && last.end === null) return r;
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
        if (!last || last.end !== null) return r;
        breaks[breaks.length - 1] = { ...last, end: new Date().toISOString() };
        return { ...r, breaks };
      });
    });
  };

  return (
    <div className="p-4 space-y-6 bg-gray-100 min-h-screen">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default App;
