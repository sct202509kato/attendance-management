// src/components/attendance/AttendanceTable.tsx
import React, { useMemo } from 'react';

type BreakItem = { start: string; end: string | null };

export type AttendanceRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  clockIn: string | null;   // ISO string
  clockOut: string | null;  // ISO string
  breaks: BreakItem[];
};

type Props = {
  records: AttendanceRecord[];
};

const toTime = (iso: string | null) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
};

const minutesBetween = (startIso: string, endIso: string) =>
  Math.max(0, Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000));

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}時間${m}分`;
};

const calcBreakMinutes = (breaks: BreakItem[]) => {
  let total = 0;
  for (const b of breaks) {
    if (b.start && b.end) total += minutesBetween(b.start, b.end);
  }
  return total;
};

const calcWorkMinutes = (r: AttendanceRecord) => {
  if (!r.clockIn) return 0;
  const endIso = r.clockOut ?? new Date().toISOString();
  const gross = minutesBetween(r.clockIn, endIso);
  const brk = calcBreakMinutes(r.breaks);
  return Math.max(0, gross - brk);
};

const AttendanceTable: React.FC<Props> = ({ records }) => {
  const sorted = useMemo(() => {
    // 新しい日付が上
    return [...records].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [records]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">勤怠履歴</h2>

      {sorted.length === 0 ? (
        <div className="text-gray-500">履歴がありません</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-sm text-gray-600">
                <th className="p-3">日付</th>
                <th className="p-3">出勤</th>
                <th className="p-3">退勤</th>
                <th className="p-3">休憩</th>
                <th className="p-3">勤務時間</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const breakMin = calcBreakMinutes(r.breaks);
                const workMin = calcWorkMinutes(r);

                return (
                  <tr key={r.id} className="border-b">
                    <td className="p-3 font-medium">{r.date}</td>
                    <td className="p-3">{toTime(r.clockIn)}</td>
                    <td className="p-3">{toTime(r.clockOut)}</td>
                    <td className="p-3">{formatDuration(breakMin)}</td>
                    <td className="p-3 font-semibold">{formatDuration(workMin)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="mt-3 text-xs text-gray-500">
            ※退勤前の「勤務時間」は現在時刻までで計算されます
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceTable;
